import { cloneDeep } from 'lodash-es'
import { AIValidationFailure } from '../types.js'
import { ValidationContext } from './types.js'
import { validateJsonSchema } from './schema.js'
import { formatObject } from './template.js'
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
 * Validates that an array contains at least one item matching the expectation.
 * Implements the `$contains` operator.
 *
 * @param actual - The actual array to check.
 * @param expected - The pattern or value that at least one item must match.
 * @param ctx - Validation context.
 * @param validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateContains(
  actual: any[],
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  for (const item of actual) {
    const subCtx = ctx.createSubContext('') // Reset key for sub-matching
    subCtx.failures = []
    await validateMatch(item, expected, subCtx)
    if (subCtx.failures.length === 0) return [] // found a match
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
 * Order of items in the array does not matter. Implements the `$all` operator.
 *
 * @param actual - The actual array to check.
 * @param expectedList - Array of patterns/values that must all be present.
 * @param ctx - Validation context.
 * @param validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateAll(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  for (const expected of expectedList) {
    const subCtx = ctx.createSubContext('')
    subCtx.failures = []
    await validateContains(actual, expected, subCtx, validateMatch)
    if (subCtx.failures.length > 0) {
      ctx.failures.push(...subCtx.failures)
    }
  }
  return ctx.failures
}

/**
 * Validates that an array contains a sequence of matching items in the specified order.
 * Other items are allowed between matches. Implements the `$sequence` operator.
 *
 * @param actual - The actual array to check.
 * @param expectedList - Array of patterns/values that must appear in sequence.
 * @param ctx - Validation context.
 * @param validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateSequence(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  let actualIdx = 0
  for (let i = 0; i < expectedList.length; i++) {
    const expected = expectedList[i]
    let found = false
    while (actualIdx < actual.length) {
      const subCtx = ctx.createSubContext('')
      subCtx.failures = []
      await validateMatch(actual[actualIdx], expected, subCtx)
      actualIdx++
      if (subCtx.failures.length === 0) {
        found = true
        break
      }
    }
    if (!found) {
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
 * Implements the `$not` operator.
 *
 * @param actual - The actual value to check.
 * @param expected - The pattern or value that should NOT be matched.
 * @param ctx - Validation context.
 * @param validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateNot(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const subCtx = ctx.createSubContext('')
  subCtx.failures = []
  await validateMatch(actual, expected, subCtx)
  if (subCtx.failures.length === 0) {
    ctx.addFailure({
      message: '$not mismatch: value matches expectation but should not',
      expected,
      actual,
    })
  }
  return ctx.failures
}

/**
 * Explicitly validates a value against a JSON Schema.
 * Implements the `$schema` operator.
 *
 * @param actual - The actual value to validate.
 * @param expected - The JSON Schema definition.
 * @param ctx - Validation context.
 * @param _validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateSchemaOperator(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  _validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  return validateJsonSchema(actual, expected, ctx)
}

/**
 * Validates that a value matches ALL specified expectations.
 * Implements the `$and` operator.
 *
 * @param actual - The actual value to check.
 * @param expectedList - Array of patterns/values that must all be matched.
 * @param ctx - Validation context.
 * @param validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateAnd(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  if (!Array.isArray(expectedList)) {
    ctx.addFailure({
      message: '$and operator requires an array of expectations',
      expected: expectedList,
      actual,
    })
    return ctx.failures
  }

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext(`$and[${i}]`)
    await validateMatch(actual, expectedList[i], subCtx)
  }
  return ctx.failures
}

/**
 * Validates that a value matches at least ONE of the specified expectations.
 * Implements the `$or` operator.
 *
 * @param actual - The actual value to check.
 * @param expectedList - Array of patterns/values where at least one must match.
 * @param ctx - Validation context.
 * @param validateMatch - Recursion handle.
 * @returns Failure list from context.
 */
export async function validateOr(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  if (!Array.isArray(expectedList)) {
    ctx.addFailure({
      message: '$or operator requires an array of expectations',
      expected: expectedList,
      actual,
    })
    return ctx.failures
  }

  const allFailures: AIValidationFailure[][] = []
  for (let i = 0; i < expectedList.length; i++) {
    const branchFailures: AIValidationFailure[] = []
    const subCtx = ctx.createSubContext(`$or[${i}]`, {
      failures: branchFailures,
    })
    await validateMatch(actual, expectedList[i], subCtx)

    if (branchFailures.length === 0) {
      return [] // Success: at least one branch matched
    }
    allFailures.push(branchFailures)
  }

  // All branches failed, summarize
  const summary = allFailures
    .map((failures, i) => {
      const branchMsg = failures.map((f) => f.message).join('; ')
      return `Branch ${i}: ${branchMsg}`
    })
    .join(' | ')

  ctx.addFailure({
    message: `$or mismatch: none of the conditions met. Details: ${summary}`,
    expected: expectedList,
    actual,
  })
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
}
