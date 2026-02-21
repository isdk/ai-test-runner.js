import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'
import { getStrategy } from '../strategies.js'

/**
 * Validates that a value matches at least ONE of the specified expectations.
 */
export async function validateOr(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  if (!Array.isArray(expectedList)) {
    ctx.addFailure({
      message: '$or operator requires an array of expectations',
      expected: expectedList,
      actual,
    })
    return ctx.failures
  }

  const allFailures: AIValidationFailure[][] = []
  let matchedAny = false

  const explicitWeights = expectedList.map((item) =>
    item && typeof item === 'object' && item.score !== undefined
      ? item.score
      : null
  )

  const strategy = ctx.strategy || getStrategy('max')
  const weights = strategy.distribute(explicitWeights, expectedList.length, {
    unassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })
  const subContexts: ValidationContext[] = []

  for (let i = 0; i < expectedList.length; i++) {
    const branchFailures: AIValidationFailure[] = []
    const subCtx = ctx.createSubContext(`$or[${i}]`, {
      failures: branchFailures,
    })
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateMatch(actual, expectedList[i], subCtx)
    subContexts.push(subCtx)

    if (branchFailures.length === 0) {
      matchedAny = true
      if (!ctx.scoring) {
        ctx.earnedScore = ctx.allocatedScore
        return []
      }
    } else {
      allFailures.push(branchFailures)
    }
  }

  strategy.aggregate(ctx, subContexts)

  if (matchedAny) {
    return []
  }

  const summary = allFailures
    .map(
      (failures, i) =>
        `Branch ${i}: ${failures.map((f) => f.message).join('; ')}`
    )
    .join(' | ')
  ctx.addFailure({
    message: `$or mismatch: none of the conditions met. Details: ${summary}`,
    expected: expectedList,
    actual,
  })
  return ctx.failures
}
