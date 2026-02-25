import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn, MatchResult } from '../types.js'
import { getStrategy } from '../strategies.js'

/**
 * Validates that a value matches ALL specified expectations.
 */
export async function validateAnd(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  if (!Array.isArray(expectedList)) {
    return {
      score: 0,
      pass: false,
      message: '$and operator requires an array of expectations',
    }
  }

  const explicitWeights = expectedList.map((item) =>
    item && typeof item === 'object' && item.score !== undefined
      ? item.score
      : null
  )

  const strategy = ctx.strategy || getStrategy('weighted')
  const weights = strategy.distribute(explicitWeights, {
    totalUnassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })

  const results: MatchResult[] = []

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext(`[${i}]`)
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    const res = await validateMatch(actual, expectedList[i], subCtx)
    results.push(res)
  }

  return strategy.aggregate(results, weights)
}
