import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn, MatchResult } from '../types.js'

/**
 * Validates that an array contains at least one item matching the expectation.
 */
export async function validateContains(
  actual: any[],
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  let maxBranchScore = 0
  let matchedAny = false

  for (const item of actual) {
    const subCtx = ctx.createSubContext('')
    subCtx.allocatedScore = ctx.allocatedScore
    const result = (await validateMatch(item, expected, subCtx)) as MatchResult

    const score = result.score
    if (score > maxBranchScore) {
      maxBranchScore = score
    }

    if (result.pass) {
      matchedAny = true
      if (!ctx.scoring) break
    }
  }

  if (matchedAny) {
    return { score: maxBranchScore, pass: true }
  }

  return {
    score: maxBranchScore,
    pass: false,
    message: '$contains mismatch: item not found in array',
    expected,
    actual,
  }
}

validateContains.expects = 'array'
