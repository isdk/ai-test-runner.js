import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { validateStringDiff } from '../diff.js'
import { AIDiffOptions } from '../../types.js'

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
    await validateStringDiff(actual, expectedValue, ctx, diffOptions)
  }
  return ctx.failures
}
