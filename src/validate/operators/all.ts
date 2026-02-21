import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'
import { validateContains } from './contains.js'

/**
 * Validates that an array contains ALL items specified in the expectation list.
 */
export async function validateAll(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
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
    const subCtx = ctx.createSubContext('')
    subCtx.failures = []
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateContains(actual, expectedList[i], subCtx, validateMatch)
    if (subCtx.failures.length > 0) {
      ctx.failures.push(...subCtx.failures)
    }
    ctx.earnedScore += subCtx.earnedScore
  }
  return ctx.failures
}

validateAll.expects = 'array'
