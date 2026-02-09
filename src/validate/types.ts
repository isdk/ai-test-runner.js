import { AIValidationFailure, AIStrictOption } from '../types.js'

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
}

export type ValidationOperatorHandler = (
  actual: any[],
  expected: any,
  options: MatchValueOptions
) => Promise<AIValidationFailure[]>
