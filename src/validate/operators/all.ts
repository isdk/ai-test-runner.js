import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn, MatchResult } from '../types.js'
import { calculateNormalizedWeights, processValidationResult } from '../utils.js'
import { validateContains } from './contains.js'
import { getStrategy } from '../strategies.js'

/**
 * Validates that an array contains ALL items specified in the expectation list.
 */
export async function validateAll(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  const explicitWeights = expectedList.map((item) =>
    item && typeof item === 'object' && item.score !== undefined
      ? typeof item.score === 'number'
        ? item.score
        : (item.score.value ?? 1)
      : null
  )
  
  const strategy = ctx.strategy || getStrategy('weighted')
  const weights = strategy.distribute(explicitWeights, {
    totalUnassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })

  const results: MatchResult[] = []

  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createSubContext(`$all[${i}]`)
    // Pass allocated score to sub-context so it can be used for logging or deep logic
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    
    const result = await validateContains(actual, expectedList[i], subCtx, validateMatch)
    const matchResult = processValidationResult(result, expectedList[i], actual, subCtx)
    
    results.push(matchResult)
  }

  return strategy.aggregate(results, weights)
}

validateAll.expects = 'array'
