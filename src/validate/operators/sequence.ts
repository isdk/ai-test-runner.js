import { AIValidationFailure, ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn, MatchResult } from '../types.js'
import { calculateNormalizedWeights } from '../utils.js'

/**
 * Validates that an array contains a sequence of matching items in the specified order.
 */
export async function validateSequence(
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
  const weights = calculateNormalizedWeights(explicitWeights, {
    totalUnassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
    autoConfidence: ctx.autoConfidence,
  })

  let totalScore = 0
  const allFailures: AIValidationFailure[] = []
  let actualIdx = 0
  let pass = true

  for (let i = 0; i < expectedList.length; i++) {
    const expected = expectedList[i]
    const subAllocated = weights[i] * ctx.allocatedScore
    let found = false
    let maxBranchScore = 0
    let bestBranchFailures: AIValidationFailure[] = []

    let tempIdx = actualIdx
    while (tempIdx < actual.length) {
      const subCtx = ctx.createSubContext('')
      subCtx.allocatedScore = subAllocated
      const result = (await validateMatch(
        actual[tempIdx],
        expected,
        subCtx
      )) as MatchResult

      if (result.score > maxBranchScore) {
        maxBranchScore = result.score
        bestBranchFailures = result.failures
      }

      if (result.pass) {
        found = true
        actualIdx = tempIdx + 1
        break
      }
      tempIdx++
    }

    if (found) {
      totalScore += subAllocated
    } else {
      totalScore += maxBranchScore * subAllocated
      pass = false
      allFailures.push(
        ...bestBranchFailures,
        {
          key: ctx.key,
          message: `$sequence mismatch: item at index ${i} not found in sequence after previous matches`,
          expected,
          actual,
        }
      )
    }
  }

  return {
    score: totalScore / ctx.allocatedScore,
    pass,
    failures: allFailures,
  }
}

validateSequence.expects = 'array'
