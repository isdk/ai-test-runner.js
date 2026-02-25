import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn, MatchResult } from '../types.js'

/**
 * Validates that a value does NOT match the specified expectation.
 */
export async function validateNot(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  const subCtx = ctx.createSubContext('')
  subCtx.allocatedScore = ctx.allocatedScore
  const result = await validateMatch(actual, expected, subCtx)

  if (result.pass) {
    return {
      score: 0,
      pass: false,
      message: '$not mismatch: value matches expectation but should not',
      expected,
      actual,
    }
  } else {
    return {
      score: 1.0,
      pass: true,
      failures: [],
    }
  }
}
