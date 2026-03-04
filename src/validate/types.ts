import { template } from 'lodash-es'
import { AIValidationFailure, AIStrictOption, AIScoreConfig, ValidationResult } from '../types.js'

/**
 * Options for matching and validating values.
 */
export interface MatchValueOptions {
  /** The current key or path being validated. */
  key?: string
  /** Data context for template formatting. */
  data?: Record<string, any>
  /** The test fixture input/configuration. */
  input?: any
  /** Strict validation mode configuration. */
  strict?: AIStrictOption
  /** Whether to allow unverified diff changes in non-strict mode. */
  diffPermissive?: boolean
  /** Whether to disable heuristic JSON Schema recognition. Defaults to false. */
  disableHeuristicSchema?: boolean
  /** Custom validation operators. */
  operators?: Record<string, ValidationOperatorHandler>
  /** Whether to allow custom operators to override built-in ones. Defaults to false. */
  allowOperatorOverride?: boolean
  /** Whether the current key is actually present in the parent object. */
  isKeyPresent?: boolean
  /** Scoring mode configuration. */
  scoring?: boolean | 'auto'
  /** The maximum possible score. */
  maxScore?: number
  /** The minimum score required to pass. */
  passScore?: number
  /** The default weight for unassigned items. */
  unassignedWeight?: number
  /** The score allocated to this validation node from its parent. */
  allocatedScore?: number
  /** Whether the current validation branch is mandatory (Critical). */
  isCriticalBranch?: boolean
  /** The scoring strategy to use. */
  strategy?: ScoringStrategy
  /** The threshold for fuzzy matching. Only applicable for leaf nodes. */
  threshold?: number
  autoConfidence?: boolean|'force'
  /** The name of the operator currently being executed. */
  currentOperator?: string
  /** The virtual/path strategy of the current operator. */
  operatorStrategy?: boolean | string
}

/**
 * Manages the read-only configuration and context of a validation process.
 */
export class ValidationContext {
  /** The current hierarchical key or dot-separated path being validated. */
  key: string
  /** Data context used for template formatting and variable injection. */
  data: Record<string, any>
  /** The original test fixture input and configuration. */
  input: any
  /** Configuration for strict validation (e.g., forbidding extra keys). */
  strict?: AIStrictOption
  /** Whether to allow unverified diff changes in non-strict mode. */
  diffPermissive?: boolean
  /** Whether to disable heuristic JSON Schema recognition. */
  disableHeuristicSchema?: boolean
  /** Custom validation operators. */
  operators?: Record<string, ValidationOperatorHandler>
  /** Whether to allow custom operators to override built-in ones. */
  allowOperatorOverride?: boolean
  /** Whether the current key is actually present in the parent object. */
  isKeyPresent?: boolean
  /** Scoring mode configuration. */
  scoring?: boolean | 'auto'
  /** The maximum possible score. */
  maxScore: number
  /** The minimum score required to pass. */
  passScore: number
  /** The default weight for unassigned items. */
  unassignedWeight?: number
  /** The score allocated to this validation node from its parent. */
  allocatedScore: number
  /** Whether the current validation branch is mandatory (critical). */
  isCriticalBranch: boolean
  /** The scoring strategy to use. */
  strategy?: ScoringStrategy
  /** The threshold for fuzzy matching. Only applicable for leaf nodes. */
  threshold?: number
  autoConfidence?: boolean|'force'
  /** The name of the current operator. */
  currentOperator?: string
  /** The virtual strategy of the current operator. */
  operatorStrategy?: boolean | string

  /**
   * Creates a new validation context.
   * @param options - Initial options for the context.
   */
  constructor(options: MatchValueOptions = {}) {
    this.key = options.key || ''
    this.data = options.data || {}
    this.input = options.input
    this.strict = options.strict
    this.diffPermissive = options.diffPermissive
    this.disableHeuristicSchema = options.disableHeuristicSchema
    this.operators = options.operators
    this.allowOperatorOverride = options.allowOperatorOverride
    this.isKeyPresent = options.isKeyPresent
    this.scoring = options.scoring
    this.maxScore = options.maxScore ?? 100
    this.passScore = options.passScore ?? this.maxScore
    this.unassignedWeight = options.unassignedWeight
    this.allocatedScore = options.allocatedScore ?? this.maxScore
    this.isCriticalBranch = !!options.isCriticalBranch
    this.strategy = options.strategy
    this.threshold = options.threshold
    this.autoConfidence = options.autoConfidence
    this.currentOperator = options.currentOperator
    this.operatorStrategy = options.operatorStrategy
  }

  /**
   * Creates a sub-context for a nested property or array element.
   * Handles path concatenation (e.g., appending '.prop' or '[index]').
   * @param subKey - The name of the sub-property or index (e.g., "name", "[0]").
   * @param options - Optional overrides for the sub-context.
   * @returns A new ValidationContext instance for the nested path.
   */
  createSubContext(
    subKey: string,
    options: Partial<MatchValueOptions> = {}
  ): ValidationContext {
    let newKey = this.key
    if (subKey) {
      if (subKey.startsWith('[') || !newKey) {
        newKey = `${newKey}${subKey}`
      } else {
        newKey = `${newKey}.${subKey}`
      }
    }
    return new ValidationContext({
      ...this,
      key: newKey,
      scoring: this.scoring,
      maxScore: this.maxScore,
      passScore: this.passScore,
      unassignedWeight: this.unassignedWeight,
      allocatedScore: this.allocatedScore,
      isCriticalBranch: this.isCriticalBranch,
      strategy: this.strategy,
      threshold: this.threshold,
      currentOperator: this.currentOperator,
      operatorStrategy: this.operatorStrategy,
      ...options,
    })
  }

  /**
   * Creates a high-level child context with automated path generation based on operator strategy.
   * 
   * @param keyOrIndex - The key or index of the child item.
   * @param count - Total number of items in the container (used for single-element optimization).
   * @param options - Additional options.
   */
  createChildContext(
    keyOrIndex: string | number,
    count: number,
    options: Partial<MatchValueOptions> = {}
  ): ValidationContext {
    // Default to true (Virtual) if not specified
    const strategy = this.operatorStrategy ?? true
    let subKey = ''

    if (strategy !== false) {
      // Virtual mode
      if (count > 1) {
        // Default template distinguishes operators: e.g., $and[0]
        const templateStr = typeof strategy === 'string' ? strategy : '$operator[$key]'

        subKey = this.formatPathTemplate(templateStr, {
          key: String(keyOrIndex),
          index: typeof keyOrIndex === 'number' ? keyOrIndex : 0,
          count,
          operator: this.currentOperator || '',
        })
      }
      // If count === 1, subKey remains empty (inherits parent path)
    } else {
      // Non-transparent mode: Use traditional operator path style if possible, 
      // or fall back to array-style for children
      subKey = `[${keyOrIndex}]`
    }

    return this.createSubContext(subKey, options)
  }

  private formatPathTemplate(tpl: string, data: any): string {
    try {
      // Use lodash template with custom interpolation for $key, $operator, etc.
      const compiled = template(tpl, { interpolate: /\$([a-zA-Z]+)/g })
      return compiled(data)
    } catch (e) {
      return `[${data.key}]` // Fallback
    }
  }

  /**
   * Calculates weights for a list of items using the current strategy and context.
   */
  distribute(items: (AIScoreConfig | null)[]): number[] {
    if (!this.strategy) {
      throw new Error('Scoring strategy not found in ValidationContext. Ensure it is initialized correctly.')
    }
    return this.strategy.distribute(items, {
      totalUnassignedWeight: this.unassignedWeight,
      maxScore: this.maxScore,
      autoConfidence: this.autoConfidence,
    })
  }

  /**
   * Aggregates multiple MatchResults using the current strategy.
   */
  aggregate(results: MatchResult[], weights: number[]): MatchResult {
    if (!this.strategy) {
      throw new Error('Scoring strategy not found in ValidationContext.')
    }
    return this.strategy.aggregate(results, weights)
  }
}

/**
 * Interface for a scoring strategy.
 * Defines how scores are distributed to children and aggregated back to the parent.
 */
export interface ScoringStrategy {
  /**
   * Calculates the weights for a list of items.
   * @param items - The items to distribute score to.
   * @param options - Contextual options.
   * @returns An array of normalized weights (0.0 - 1.0) summing to 1.0 (for weighted) or more (for independent).
   */
  distribute(
    items: (AIScoreConfig | null)[],
    options?: { totalUnassignedWeight?: number; maxScore?: number, autoConfidence?: boolean|'force' }
  ): number[]

  /**
   * Aggregates the results from child matches into a single result.
   * @param results - The results from child validations.
   * @param weights - The weights corresponding to each child.
   * @param options - Additional aggregation options.
   */
  aggregate(
    results: MatchResult[],
    weights: number[],
    options?: any
  ): MatchResult
}

/**
 * Signature for the core match validation function used recursively by operators.
 */
export type ValidateMatchFn = (
  actual: any,
  expected: any,
  ctx: ValidationContext
) => Promise<MatchResult>

/**
 * Result of a validation match operation.
 */
export interface MatchResult {
  /** The normalized confidence score (0.0 - 1.0). */
  score: number
  /** Whether the validation passed. */
  pass: boolean
  /** List of failures encountered during matching. */
  failures: AIValidationFailure[]
  /** Detailed scoring breakdown for sub-items. */
  details?: MatchResultDetail[]
  /** Optional title of the validation item. */
  title?: string
  /** Optional dimension/tag. */
  dimension?: string
  /** Whether this was a critical item. */
  critical?: boolean
}

/**
 * Detailed information about a single validation item's score.
 */
export interface MatchResultDetail {
  /** The key/path of the item. */
  key: string
  /** The descriptive title. */
  title?: string
  /** The dimension/tag. */
  dimension?: string
  /** The earned score (0.0 - 1.0, relative to allocated weight). */
  score: number
  /** The allocated weight (normalized 0.0 - 1.0). */
  weight: number
  /** Whether this specific item passed. */
  pass: boolean
  /** Whether this item was a critical/red-line item. */
  critical?: boolean
  /** Recursive sub-details for nested objects/arrays. */
  details?: MatchResultDetail[]
}

/**
 * Function signature for handling custom validation operators (e.g., $contains).
 */
export type ValidationOperatorHandler = ((
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
) => Promise<ValidationResult> | ValidationResult) & {
  virtual?: boolean | string
  strategy?: string
}

