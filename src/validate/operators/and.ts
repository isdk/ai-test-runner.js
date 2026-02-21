import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'
import { getStrategy } from '../strategies.js'

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
      ? item.score
      : null
  )

  const strategy = ctx.strategy || getStrategy('weighted')
  const weights = strategy.distribute(explicitWeights, expectedList.length, {
    unassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })
  const subContexts: ValidationContext[] = []

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext(`$and[${i}]`)
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateMatch(actual, expectedList[i], subCtx)
    subContexts.push(subCtx)
  }
  strategy.aggregate(ctx, subContexts)

  return ctx.failures
}
