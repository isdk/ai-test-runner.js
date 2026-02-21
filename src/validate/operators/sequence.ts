import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'

/**
 * Validates that an array contains a sequence of matching items in the specified order.
 */
export async function validateSequence(
  actual: any[],
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const explicitWeights = expectedList.map(item => (item && typeof item === 'object' && item.score !== undefined) ? (typeof item.score === 'number' ? item.score : (item.score.value ?? 1)) : null)
  const weights = calculateNormalizedWeights(explicitWeights, expectedList.length, { unassignedWeight: ctx.unassignedWeight })

  let actualIdx = 0
  for (let i = 0; i < expectedList.length; i++) {
    const expected = expectedList[i]
    const subAllocated = weights[i] * ctx.allocatedScore
    let found = false
    let maxBranchEarnedScore = 0

    let tempIdx = actualIdx
    while (tempIdx < actual.length) {
      const subCtx = ctx.createSubContext('')
      subCtx.failures = []
      subCtx.allocatedScore = subAllocated
      await validateMatch(actual[tempIdx], expected, subCtx)

      if (subCtx.earnedScore > maxBranchEarnedScore) {
        maxBranchEarnedScore = subCtx.earnedScore
      }

      if (subCtx.failures.length === 0) {
        found = true
        actualIdx = tempIdx + 1
        if (!ctx.scoring) break
      }
      tempIdx++
    }

    if (found) {
      ctx.earnedScore += subAllocated
    } else {
      ctx.earnedScore += maxBranchEarnedScore
      ctx.addFailure({
        message: `$sequence mismatch: item at index ${i} not found in sequence after previous matches`,
        expected,
        actual,
      })
      return ctx.failures
    }
  }
  return ctx.failures
}
