import {
  AIStrictOption,
  ValidationResult,
  AIValidationFailure,
} from '../types.js'
import { ValidationContext } from './types.js'

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
 * Processes the result of a validation function/operator and updates the context.
 * Supports boolean, string, number (0-1), and detailed object results.
 * @returns true if passed (according to result/threshold), false otherwise.
 */
export function processValidationResult(
  result: any, // Use any to be safe with incoming data
  expected: any,
  actual: any,
  ctx: ValidationContext
): boolean {
  let score = 0
  let message: string | undefined
  let passed = false

  if (result === true) {
    score = 1.0
    passed = true
  } else if (result === false) {
    score = 0.0
    message = 'Validation failed'
    passed = false
  } else if (typeof result === 'string') {
    score = 0.0
    message = result
    passed = false
  } else if (typeof result === 'number') {
    score = Math.max(0, Math.min(1, result))
    if (ctx.threshold !== undefined) {
      passed = score >= ctx.threshold
      if (!passed) {
        message = `Score ${score.toFixed(2)} is below threshold ${ctx.threshold}`
      }
    } else {
      passed = true
    }
  } else if (typeof result === 'object' && result !== null) {
    // Check if it's a valid ValidationResult object with 'score' or 'pass' property
    if (typeof result.score === 'number' || typeof result.pass === 'boolean') {
      score =
        typeof result.score === 'number'
          ? Math.max(0, Math.min(1, result.score))
          : 0
      message = result.message
      if (result.pass !== undefined) {
        passed = !!result.pass
      } else if (ctx.threshold !== undefined) {
        passed = score >= ctx.threshold
        if (!passed && !message) {
          message = `Score ${score.toFixed(2)} is below threshold ${ctx.threshold}`
        }
      } else {
        // Default: passed if object has score but no explicit pass flag, assume passed (soft score)
        passed = true
      }
    } else {
      // Not a recognized ValidationResult object, treat as unknown type / failure
      score = 0.0
      message = 'Invalid validation result: unrecognized object format'
      passed = false
    }
  } else {
    // Truly unknown result type, (e.g., function, symbol, etc.)
    score = 0.0
    message = 'Invalid validation result: unknown type'
    passed = false
  }

  // Update context
  ctx.earnedScore += ctx.allocatedScore * score

  if (!passed) {
    ctx.addFailure({
      message: message || 'Validation failed',
      expected,
      actual,
    })
  }

  return passed
}

/**
 * Calculates normalized weights for a set of items.
 */
export function calculateNormalizedWeights(
  explicitWeights: (number | null)[],
  totalCount: number,
  options: {
    unassignedWeight?: number
    independentScale?: boolean
    maxScore?: number
  } = {}
): number[] {
  let explicitSum = 0
  let hasExplicit = false
  let maxExplicit = 0
  const maxScore = options.maxScore ?? 100

  for (const w of explicitWeights) {
    if (w !== null) {
      explicitSum += w
      hasExplicit = true
      if (w > maxExplicit) maxExplicit = w
    }
  }

  const unassignedCount =
    totalCount - explicitWeights.filter((w) => w !== null).length

  if (options.independentScale) {
    const scale = maxExplicit > 1 ? Math.max(maxScore, maxExplicit) : 1.0
    const defWeight = options.unassignedWeight ?? scale
    return explicitWeights.map((w) => {
      const val = w === null ? defWeight : w
      return scale > 0 ? val / scale : 0
    })
  }

  if (unassignedCount === 0 && totalCount > 0) {
    const sum = explicitWeights.reduce((a: number, b) => a + (b || 0), 0)
    return explicitWeights.map((w) => (sum > 0 ? (w || 0) / sum : 0))
  }

  let defaultWeight = options.unassignedWeight
  if (defaultWeight === undefined) {
    const scale = maxExplicit > 1 ? Math.max(maxScore, maxExplicit) : 1.0
    if (unassignedCount > 0) {
      if (hasExplicit) {
        if (explicitSum < scale) {
          defaultWeight = (scale - explicitSum) / unassignedCount
        } else {
          const avg = explicitSum / (totalCount - unassignedCount)
          defaultWeight = avg * 0.01
        }
      } else {
        defaultWeight = 1.0 / unassignedCount
      }
    }
  }

  const finalWeights = explicitWeights.map((w) =>
    w === null ? (defaultWeight ?? 1) : w
  )
  const totalWeight = finalWeights.reduce((a: number, b) => a + (b || 0), 0)
  return finalWeights.map((w) => (totalWeight > 0 ? (w || 0) / totalWeight : 0))
}
