import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'

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
