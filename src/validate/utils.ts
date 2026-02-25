import {
  AIStrictOption,
  ValidationResult,
  AIValidationFailure,
} from '../types.js'
import { ValidationContext, MatchResult } from './types.js'

/**
 * Checks if strict mode is enabled for a specific type.
 */
export function isStrict(
  type: 'object' | 'diff' | 'array',
  strict?: AIStrictOption | ValidationContext
): boolean {
  if (strict instanceof ValidationContext) {
    strict = strict.strict
  }
  if (typeof strict === 'boolean') return strict
  if (typeof strict === 'string') return strict === type
  if (Array.isArray(strict)) return strict.includes(type)
  return false
}

/**
 * Processes the result of a validation function/operator and normalizes it to a MatchResult.
 * Performs "auto-backfill" of missing keys and context information for failures.
 * This is a pure function that does NOT modify the context.
 *
 * @returns MatchResult containing score, pass status and normalized failures.
 */
export function processValidationResult(
  result: ValidationResult,
  expected: any,
  actual: any,
  ctx: ValidationContext,
  options: { key?: string } = {}
): MatchResult {
  let score = 0
  let pass = false
  let failures: AIValidationFailure[] = []
  let message: string | undefined

  if (result === true) {
    score = 1.0
    pass = true
  } else if (result === false) {
    score = 0.0
    pass = false
    message = 'Validation failed'
  } else if (typeof result === 'string') {
    score = 0.0
    pass = false
    message = result
  } else if (typeof result === 'number') {
    score = Math.max(0, Math.min(1, result))
    if (ctx.threshold !== undefined) {
      pass = score >= ctx.threshold
      if (!pass) {
        message = `Score ${score.toFixed(2)} is below threshold ${ctx.threshold}`
      }
    } else {
      pass = true
    }
  } else if (typeof result === 'object' && result !== null) {
    // Handle object result
    // Must contain at least 'score' or 'pass' to be valid
    const hasScore = typeof (result as any).score === 'number'
    const hasPass = (result as any).pass !== undefined

    if (!hasScore && !hasPass && !Array.isArray((result as any).failures)) {
       score = 0.0
       pass = false
       message = 'Invalid validation result: unrecognized object format'
    } else {
      if (typeof (result as any).score === 'number') {
        score = Math.max(0, Math.min(1, (result as any).score))
      } else {
        score = 0
      }

      if ((result as any).pass !== undefined) {
        pass = !!(result as any).pass
      } else if (ctx.threshold !== undefined) {
        pass = score >= ctx.threshold
      } else {
        // Default: passed if object has score but no explicit pass flag (soft score)
        pass = true
      }

      message = (result as any).message
      if (!pass && !message && ctx.threshold !== undefined) {
         message = `Score ${score.toFixed(2)} is below threshold ${ctx.threshold}`
      }

      // Extract failures if present (using type assertion for safety)
      if (Array.isArray((result as any).failures)) {
        failures = (result as any).failures
      }
    }
  } else {
    // Unknown type
    score = 0.0
    pass = false
    message = 'Invalid validation result: unknown type'
  }

  // If failed but no failures reported, create a default one
  if (!pass && failures.length === 0) {
    failures.push({
      key: options.key || ctx.key,
      message: message || 'Validation failed',
      expected,
      actual,
    })
  }

  // Auto-backfill failures with context info
  const finalFailures = failures.map((f) => {
    const newFailure: AIValidationFailure = {
      ...f,
      key: f.key || options.key || ctx.key,
    }

    if (newFailure.expected === undefined) newFailure.expected = expected
    if (newFailure.actual === undefined) newFailure.actual = actual

    // Mark as critical if the branch is critical
    if (ctx.isCriticalBranch) {
      newFailure.critical = true
    }

    return newFailure
  })

  return { score, pass, failures: finalFailures }
}

/**
 * Calculates normalized weights for a set of items, balancing explicit scores and unassigned items.
 *
 * This function handles two primary modes:
 * 1. Balanced (normalize: true): Ensures the sum of all weights equals 1.0. It provides a
 *    guaranteed budget (totalUnassignedWeight) for items without explicit scores.
 * 2. Independent (normalize: false): Maps each item to its individual confidence score (0.0-1.0)
 *    without requiring the total sum to be 1.0.
 *
 * @param explicitWeights - Array of scores or weights. Use null for unassigned items.
 * @param options - Configuration options.
 * @returns An array of weights (0.0-1.0) corresponding to the input items.
 */
export function calculateNormalizedWeights(
  explicitWeights: (number | null)[],
  options: {
    /** The total weight budget reserved for all unassigned (null) items. Defaults to 0.1. */
    totalUnassignedWeight?: number
    /** Whether to normalize the total sum to 1.0. Defaults to true. */
    normalize?: boolean
    /** The maximum possible value for explicit weights, used for scaling. Defaults to 100. */
    maxScore?: number
    /** Whether to automatically treat values between 0 and 1 as confidence scores. Defaults to true. */
    autoConfidence?: boolean | 'force'
  } = {}
): number[] {
  const {
    normalize = true,
    maxScore = 100,
    autoConfidence = true,
  } = options
  let totalUnassignedWeight = options.totalUnassignedWeight ?? 0.1

  const unassignedCount = explicitWeights.filter((w) => w === null).length

  // 1. Unify scale: map explicit scores to 0-1 confidence
  const maxExplicit = Math.max(
    ...explicitWeights.filter((w): w is number => w !== null),
    0
  )
  const scale = Math.max(maxScore, maxExplicit)
  if (!((autoConfidence && totalUnassignedWeight >= 0 && totalUnassignedWeight < 1) || (autoConfidence === 'force'))) {
    totalUnassignedWeight = totalUnassignedWeight / scale
  }

  const explicitConfidences = explicitWeights.map((w) => {
    if (w === null) return null
    // If autoConfidence is enabled, treat small values as already normalized.
    if ((autoConfidence && w >= 0 && w < 1) || (autoConfidence === 'force')) return w
    return w / scale
  })
  const explicitSum = explicitConfidences.reduce<number>((a, b) => a + (b || 0), 0)!

  // 2. Independent Mode (normalize: false)
  if (!normalize) {
    return explicitConfidences.map((w) => {
      if (w != null) return w
      return unassignedCount > 0 ? totalUnassignedWeight / unassignedCount : 0
    })
  }

  // 3. Balanced Mode (normalize: true)
  let finalUnassignedTotal = 0
  let explicitFactor = 1

  if (unassignedCount > 0) {
    if (explicitSum + totalUnassignedWeight <= 1.0) {
      // Enough space: unassigned items take all remaining space
      finalUnassignedTotal = 1.0 - explicitSum
    } else {
      // Space constraint: unassigned items get their guaranteed budget,
      // and explicit items are proportionally compressed.
      finalUnassignedTotal = totalUnassignedWeight
      explicitFactor =
        explicitSum > 0 ? (1.0 - totalUnassignedWeight) / explicitSum : 0
    }
  } else {
    // No unassigned items: normalize explicit weights to sum to 1.0
    explicitFactor = explicitSum > 0 ? 1.0 / explicitSum : 0
  }

  const result = explicitConfidences.map((w) => {
    if (w !== null) return w * explicitFactor
    return finalUnassignedTotal / unassignedCount
  })

  return result
}
