import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'

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
  let maxBranchEarnedScore = 0
  let matchedAny = false

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
    { unassignedWeight: ctx.unassignedWeight, independentScale: true }
  )

  for (let i = 0; i < expectedList.length; i++) {
    const branchFailures: AIValidationFailure[] = []
    const subCtx = ctx.createSubContext(`$or[${i}]`, {
      failures: branchFailures,
    })
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    await validateMatch(actual, expectedList[i], subCtx)

    if (branchFailures.length === 0) {
      matchedAny = true
      if (subCtx.earnedScore > maxBranchEarnedScore)
        maxBranchEarnedScore = subCtx.earnedScore
      if (!ctx.scoring) {
        ctx.earnedScore = ctx.allocatedScore
        return []
      }
    } else {
      if (subCtx.earnedScore > maxBranchEarnedScore)
        maxBranchEarnedScore = subCtx.earnedScore
      allFailures.push(branchFailures)
    }
  }

  ctx.earnedScore = maxBranchEarnedScore
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
