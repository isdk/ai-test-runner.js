import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'

/**
 * A transparent container that delegates validation to its value.
 */
export async function validateExpect(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  return await validateMatch(actual, expected, ctx)
}
