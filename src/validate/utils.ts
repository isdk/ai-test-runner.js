import { AIStrictOption } from '../types.js'
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
 * Calculates normalized weights for a set of items.
 */
export function calculateNormalizedWeights(
  explicitWeights: (number | null)[],
  totalCount: number,
  options: { unassignedWeight?: number; independentScale?: boolean } = {}
): number[] {
  let explicitSum = 0
  let hasExplicit = false
  let maxExplicit = 0

  for (const w of explicitWeights) {
    if (w !== null) {
      explicitSum += w
      hasExplicit = true
      if (w > maxExplicit) maxExplicit = w
    }
  }

  const unassignedCount = totalCount - explicitWeights.filter((w) => w !== null).length

  if (options.independentScale) {
    const scale = maxExplicit > 1 ? Math.max(100, maxExplicit) : 1.0
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
    const scale = maxExplicit > 1 ? Math.max(100, maxExplicit) : 1.0
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

  const finalWeights = explicitWeights.map((w) => w === null ? (defaultWeight ?? 1) : w)
  const totalWeight = finalWeights.reduce((a: number, b) => a + (b || 0), 0)
  return finalWeights.map((w) => (totalWeight > 0 ? (w || 0) / totalWeight : 0))
}
