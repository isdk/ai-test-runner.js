import { AIScoreConfig } from '../types.js'
import { ScoringStrategy, MatchResult } from './types.js'
import { calculateNormalizedWeights } from './utils.js'

function extractWeights(items: (AIScoreConfig | null)[]): (number | null)[] {
  return items.map((item) => {
    if (typeof item === 'number') return item
    if (item && typeof item === 'object') return item.value
    return null
  })
}

export const weightedSumStrategy: ScoringStrategy = {
  distribute(items, options) {
    return calculateNormalizedWeights(extractWeights(items), {
      ...options,
      normalize: true,
      // totalUnassignedWeight: options?.totalUnassignedWeight,
      // maxScore: options?.maxScore,
      // autoConfidence: options?.autoConfidence,
    })
  },
  aggregate(results: MatchResult[], weights: number[]): MatchResult {
    let score = 0
    let allPassed = true

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      const w = weights[i] || 0
      score += r.score * w
      if (!r.pass) {
        allPassed = false
      }
    }

    // In a weighted sum, if strict adherence is required (which is default for object properties),
    // any failure means the whole object check failed.
    // However, if we want fuzzy matching where score < 1 is still a pass...
    // But r.pass is the decision of the child. If child says "I failed", then parent usually fails.

    return {
      score,
      pass: allPassed,
      failures: results.flatMap((r) => r.failures),
    }
  },
}

export const maxStrategy: ScoringStrategy = {
  distribute(items, options) {
    return calculateNormalizedWeights(extractWeights(items), {
      ...options,
      normalize: false,
      // totalUnassignedWeight: options?.totalUnassignedWeight,
      // autoConfidence: options?.autoConfidence,
    })
  },
  aggregate(results: MatchResult[], weights: number[]): MatchResult {
    let maxScore = 0
    let anyPassed = false
    let bestResult: MatchResult | null = null

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.pass) {
        anyPassed = true
      }
      const weightedScore = r.score * (weights[i] || 0)
      if (weightedScore >= maxScore) {
        maxScore = weightedScore
        bestResult = r
      }
    }

    // If any passed, we pass.
    // If passed, we technically don't have failures, but maybe we want to report warnings?
    // For now, if passed, clear failures.

    if (anyPassed) {
      return {
        score: maxScore,
        pass: true,
        failures: [],
      }
    }

    // If none passed, return a single summary failure to explain why none matched
    const failures: MatchResult['failures'] = [
      {
        message:
          `$or mismatch: none of the conditions met\n` +
          results
            .map(
              (r, i) =>
                `  Branch ${i}: ${r.failures.map((f) => f.message).join('; ')}`
            )
            .join('\n'),
        // No key here so it can be backfilled by the context key
        expected: results.map((r) => r.failures[0]?.expected),
        actual: results[0]?.failures[0]?.actual,
      },
    ]

    return {
      score: maxScore,
      pass: false,
      failures,
    }
  },
}

export const strategies: Record<string, ScoringStrategy> = {
  weighted: weightedSumStrategy,
  max: maxStrategy,
  // Alias for default behaviors
  and: weightedSumStrategy,
  or: maxStrategy,
}

export function getStrategy(name?: string): ScoringStrategy {
  if (!name) return weightedSumStrategy
  return strategies[name] || strategies.weighted
}
