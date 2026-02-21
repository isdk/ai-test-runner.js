import { AIValidationFailure } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'

/**
 * Validates that an array contains at least one item matching the expectation.
 */
export async function validateContains(
  actual: any[],
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  let maxBranchEarnedScore = 0
  let matchedAny = false

  for (const item of actual) {
    const subCtx = ctx.createSubContext('')
    subCtx.failures = []
    subCtx.allocatedScore = ctx.allocatedScore
    await validateMatch(item, expected, subCtx)

    if (subCtx.earnedScore > maxBranchEarnedScore) {
      maxBranchEarnedScore = subCtx.earnedScore
    }

    if (subCtx.failures.length === 0) {
      matchedAny = true
      if (!ctx.scoring) break
    }
  }

  ctx.earnedScore = maxBranchEarnedScore
  if (matchedAny) {
    return []
  }

  ctx.addFailure({
    message: '$contains mismatch: item not found in array',
    expected,
    actual,
  })
  return ctx.failures
}

validateContains.expects = 'array'
