import { AIScoreConfig } from '../types.js'
import { ValidationContext, ScoringStrategy } from './types.js'
import { calculateNormalizedWeights } from './utils.js'

function extractWeights(items: (AIScoreConfig | null)[]): (number | null)[] {
  return items.map((item) => {
    if (typeof item === 'number') return item
    if (item && typeof item === 'object') return item.value
    return null
  })
}

export const weightedSumStrategy: ScoringStrategy = {
  distribute(items, totalCount, options) {
    return calculateNormalizedWeights(
      extractWeights(items),
      totalCount,
      options
    )
  },
  aggregate(parentCtx, childrenCtxs) {
    let sum = 0
    for (const child of childrenCtxs) {
      sum += child.earnedScore
    }
    parentCtx.earnedScore += sum
  },
}

export const maxStrategy: ScoringStrategy = {
  distribute(items, totalCount, options) {
    return calculateNormalizedWeights(extractWeights(items), totalCount, {
      ...options,
      independentScale: true,
    })
  },
  aggregate(parentCtx, childrenCtxs) {
    let max = 0
    for (const child of childrenCtxs) {
      if (child.earnedScore > max) {
        max = child.earnedScore
      }
    }
    parentCtx.earnedScore += max
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
