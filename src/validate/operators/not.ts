import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'

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
