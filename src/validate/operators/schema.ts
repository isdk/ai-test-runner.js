import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { validateJsonSchema } from '../schema.js'

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
