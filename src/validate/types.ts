import { AIValidationFailure, AIStrictOption, AIScoreConfig } from '../types.js'

/**
 * Options for matching and validating values.
 */
export interface MatchValueOptions {
  /** Accumulator for validation failures. */
  failures?: AIValidationFailure[]
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
  /** Whether the current validation branch is mandatory (required). */
  isRequiredBranch?: boolean
  /** Accumulator for failures in 'required' (critical) items. */
  failedRequired?: AIValidationFailure[]
}

/**
 * Manages the state and context of a validation process.
 * Tracks failures, current path, data context, and strictness settings.
 */
export class ValidationContext {
  /** Accumulator for validation failures discovered during the process. */
  failures: AIValidationFailure[]
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
  /** The total score earned at this level (and its children). */
  earnedScore: number = 0
  /** Whether the current validation branch is mandatory (required). */
  isRequiredBranch: boolean
  /** Accumulator for failures in 'required' (critical) items. */
  failedRequired: AIValidationFailure[]

  /**
   * Creates a new validation context.
   * @param options - Initial options for the context.
   */
  constructor(options: MatchValueOptions = {}) {
    this.failures = options.failures || []
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
    this.isRequiredBranch = !!options.isRequiredBranch
    this.failedRequired = options.failedRequired || []
  }

  /**
   * Adds a validation failure to the current context.
   * The current `key` from the context is automatically added to the failure if not provided.
   * @param failure - Partial failure information to add.
   * @param options - Additional options, e.g., if this failure is in a 'required' item.
   */
  addFailure(
    failure: Partial<AIValidationFailure>,
    options: { required?: boolean } = {}
  ) {
    const fullFailure = {
      key: this.key,
      ...failure,
    }
    this.failures.push(fullFailure)
    if (options.required || this.isRequiredBranch) {
      this.failedRequired.push(fullFailure)
    }
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
      failures: this.failures,
      key: newKey,
      scoring: this.scoring,
      maxScore: this.maxScore,
      passScore: this.passScore,
      unassignedWeight: this.unassignedWeight,
      allocatedScore: this.allocatedScore,
      isRequiredBranch: this.isRequiredBranch,
      failedRequired: this.failedRequired,
      ...options,
    })
  }
}

/**
 * Function signature for handling custom validation operators (e.g., $contains).
 */
export type ValidationOperatorHandler = (
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: (
    actual: any,
    expected: any,
    ctx: ValidationContext
  ) => Promise<AIValidationFailure[]>
) => Promise<AIValidationFailure[]>
