import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'

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
    ctx.addFailure({
      message: '$and operator requires an array of expectations',
      expected: expectedList,
      actual,
    })
    return ctx.failures
  }

  const explicitWeights = expectedList.map((item) =>
    item && typeof item === 'object' && item.score !== undefined
      ? typeof item.score === 'number'
        ? item.score
        : (item.score.value ?? 1)
      : null
  )
  const weights = calculateNormalizedWeights(
    explicitWeights,
    expectedList.length,
    { unassignedWeight: ctx.unassignedWeight }
  )

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext(`$and[${i}]`)
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateMatch(actual, expectedList[i], subCtx)
    ctx.earnedScore += subCtx.earnedScore
  }
  return ctx.failures
}
