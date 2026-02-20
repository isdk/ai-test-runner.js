import { cloneDeep } from 'lodash-es'
import { AIValidationFailure, AIDiffOptions } from '../types.js'
import { ValidationContext } from './types.js'
import { validateJsonSchema } from './schema.js'
import { calculateNormalizedWeights } from './utils.js'
import { formatObject } from './template.js'
import { validateStringDiff } from './diff.js'
import { YamlTypeJsonSchema } from '../yaml-types/index.js'

/**
 * Signature for the core match validation function used recursively by operators.
 */
export type ValidateMatchFn = (
  actual: any,
  expected: any,
  ctx: ValidationContext
) => Promise<AIValidationFailure[]>

/**
 * A transparent container that delegates validation to its value.
 */
export async function validateExpect(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  await validateMatch(actual, expected, ctx)
  return ctx.failures
}

/**
 * Validates that an array contains at least one item matching the expectation.
 */
export async function validateContains(
  actual: any[],
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  let maxBranchEarnedScore = 0
  let matchedAny = false

  for (const item of actual) {
    const subCtx = ctx.createSubContext('')
    subCtx.failures = []
    subCtx.allocatedScore = ctx.allocatedScore
    await validateMatch(item, expected, subCtx)

    if (subCtx.earnedScore > maxBranchEarnedScore) {
      maxBranchEarnedScore = subCtx.earnedScore
    }

    if (subCtx.failures.length === 0) {
      matchedAny = true
      if (!ctx.scoring) break
    }
  }

  ctx.earnedScore = maxBranchEarnedScore
  if (matchedAny) {
    return []
  }

  ctx.addFailure({
    message: '$contains mismatch: item not found in array',
    expected,
    actual,
  })
  return ctx.failures
}

/**
 * Validates that an array contains ALL items specified in the expectation list.
 */
export async function validateAll(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const explicitWeights = expectedList.map(item => (item && typeof item === 'object' && item.score !== undefined) ? (typeof item.score === 'number' ? item.score : (item.score.value ?? 1)) : null)
  const weights = calculateNormalizedWeights(explicitWeights, expectedList.length, { unassignedWeight: ctx.unassignedWeight })

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext('')
    subCtx.failures = []
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateContains(actual, expectedList[i], subCtx, validateMatch)
    if (subCtx.failures.length > 0) {
      ctx.failures.push(...subCtx.failures)
    }
    ctx.earnedScore += subCtx.earnedScore
  }
  return ctx.failures
}

/**
 * Validates that an array contains a sequence of matching items in the specified order.
 */
export async function validateSequence(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const explicitWeights = expectedList.map(item => (item && typeof item === 'object' && item.score !== undefined) ? (typeof item.score === 'number' ? item.score : (item.score.value ?? 1)) : null)
  const weights = calculateNormalizedWeights(explicitWeights, expectedList.length, { unassignedWeight: ctx.unassignedWeight })

  let actualIdx = 0
  for (let i = 0; i < expectedList.length; i++) {
    const expected = expectedList[i]
    const subAllocated = weights[i] * ctx.allocatedScore
    let found = false
    let maxBranchEarnedScore = 0

    let tempIdx = actualIdx
    while (tempIdx < actual.length) {
      const subCtx = ctx.createSubContext('')
      subCtx.failures = []
      subCtx.allocatedScore = subAllocated
      await validateMatch(actual[tempIdx], expected, subCtx)

      if (subCtx.earnedScore > maxBranchEarnedScore) {
        maxBranchEarnedScore = subCtx.earnedScore
      }

      if (subCtx.failures.length === 0) {
        found = true
        actualIdx = tempIdx + 1
        if (!ctx.scoring) break
      }
      tempIdx++
    }

    if (found) {
      ctx.earnedScore += subAllocated
    } else {
      ctx.earnedScore += maxBranchEarnedScore
      ctx.addFailure({
        message: `$sequence mismatch: item at index ${i} not found in sequence after previous matches`,
        expected,
        actual,
      })
      return ctx.failures
    }
  }
  return ctx.failures
}

/**
 * Validates that a value does NOT match the specified expectation.
 */
export async function validateNot(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const subCtx = ctx.createSubContext('')
  subCtx.failures = []
  subCtx.allocatedScore = ctx.allocatedScore
  await validateMatch(actual, expected, subCtx)
  if (subCtx.failures.length === 0) {
    ctx.earnedScore = 0
    ctx.addFailure({
      message: '$not mismatch: value matches expectation but should not',
      expected,
      actual,
    })
  } else {
    ctx.earnedScore = ctx.allocatedScore
  }
  return ctx.failures
}

/**
 * Explicitly validates a value against a JSON Schema.
 */
export async function validateSchemaOperator(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  _validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const initialFailures = ctx.failures.length
  await validateJsonSchema(actual, expected, ctx)
  if (ctx.failures.length === initialFailures) {
    ctx.earnedScore = ctx.allocatedScore
  }
  return ctx.failures
}

/**
 * Validates that a value matches ALL specified expectations.
 */
export async function validateAnd(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  if (!Array.isArray(expectedList)) {
    ctx.addFailure({ message: '$and operator requires an array of expectations', expected: expectedList, actual })
    return ctx.failures
  }

  const explicitWeights = expectedList.map(item => (item && typeof item === 'object' && item.score !== undefined) ? (typeof item.score === 'number' ? item.score : (item.score.value ?? 1)) : null)
  const weights = calculateNormalizedWeights(explicitWeights, expectedList.length, { unassignedWeight: ctx.unassignedWeight })

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext(`$and[${i}]`)
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateMatch(actual, expectedList[i], subCtx)
    ctx.earnedScore += subCtx.earnedScore
  }
  return ctx.failures
}

/**
 * Validates that a value matches at least ONE of the specified expectations.
 */
export async function validateOr(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  if (!Array.isArray(expectedList)) {
    ctx.addFailure({ message: '$or operator requires an array of expectations', expected: expectedList, actual })
    return ctx.failures
  }

  const allFailures: AIValidationFailure[][] = []
  let maxBranchEarnedScore = 0
  let matchedAny = false

  const explicitWeights = expectedList.map(item => (item && typeof item === 'object' && item.score !== undefined) ? (typeof item.score === 'number' ? item.score : (item.score.value ?? 1)) : null)
  const weights = calculateNormalizedWeights(explicitWeights, expectedList.length, { unassignedWeight: ctx.unassignedWeight, independentScale: true })

  for (let i = 0; i < expectedList.length; i++) {
    const branchFailures: AIValidationFailure[] = []
    const subCtx = ctx.createSubContext(`$or[${i}]`, { failures: branchFailures })
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateMatch(actual, expectedList[i], subCtx)

    if (branchFailures.length === 0) {
      matchedAny = true
      if (subCtx.earnedScore > maxBranchEarnedScore) maxBranchEarnedScore = subCtx.earnedScore
      if (!ctx.scoring) {
        ctx.earnedScore = ctx.allocatedScore
        return []
      }
    } else {
      if (subCtx.earnedScore > maxBranchEarnedScore) maxBranchEarnedScore = subCtx.earnedScore
      allFailures.push(branchFailures)
    }
  }

  ctx.earnedScore = maxBranchEarnedScore
  if (matchedAny) {
    return []
  }

  const summary = allFailures.map((failures, i) => `Branch ${i}: ${failures.map(f => f.message).join('; ')}`).join(' | ')
  ctx.addFailure({ message: `$or mismatch: none of the conditions met. Details: ${summary}`, expected: expectedList, actual })
  return ctx.failures
}

/**
 * Validates whether a property exists or is defined.
 */
export async function validateExists(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<AIValidationFailure[]> {
  let expectedExists: boolean
  let strict = false

  if (typeof expected === 'object' && expected !== null && '$value' in expected) {
    expectedExists = !!expected.$value
    strict = !!expected.strict
  } else {
    expectedExists = !!expected
  }

  const isPresent = ctx.isKeyPresent
  const isUndefined = actual === undefined
  let failed = false
  let message = ''

  if (strict) {
    if (expectedExists && !isPresent) { failed = true; message = `$exists mismatch: key expected to be present but it is missing` }
    else if (!expectedExists && isPresent) { failed = true; message = `$exists mismatch: key expected to be missing but it exists` }
  } else {
    if (expectedExists && isUndefined) { failed = true; message = `$exists mismatch: value expected to be defined but it is undefined` }
    else if (!expectedExists && !isUndefined) { failed = true; message = `$exists mismatch: value expected to be undefined but it is defined` }
  }

  if (failed) {
    ctx.earnedScore = 0
    ctx.addFailure({ message, expected: expectedExists, actual: strict ? (isPresent ? 'present' : 'missing') : (isUndefined ? 'undefined' : 'defined') })
  } else {
    ctx.earnedScore = ctx.allocatedScore
  }
  return ctx.failures
}

/**
 * Validates a string using diff analysis.
 */
export async function validateDiff(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  _validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  let expectedValue: any
  let diffOptions: AIDiffOptions | undefined

  if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
    expectedValue = expected.value ?? expected.expected
    diffOptions = expected as AIDiffOptions
  } else {
    expectedValue = expected
  }

  if (typeof actual !== 'string') {
    ctx.earnedScore = 0
    ctx.addFailure({ message: 'Value mismatch: expected string for $diff', expected: expectedValue, actual })
  } else {
    await validateStringDiff(actual, expectedValue, ctx, ctx.isCriticalBranch, diffOptions)
  }
  return ctx.failures
}

/** Map of supported collection validation operators. */
export const OPERATORS: Record<
  string,
  (
    actual: any,
    expected: any,
    ctx: ValidationContext,
    validateMatch: ValidateMatchFn
  ) => Promise<AIValidationFailure[]>
> = {
  $and: validateAnd,
  $or: validateOr,
  $contains: validateContains,
  $all: validateAll,
  $sequence: validateSequence,
  $not: validateNot,
  $schema: validateSchemaOperator,
  $exists: validateExists,
  $expect: validateExpect,
  $diff: validateDiff,
}
