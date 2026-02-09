import { Change } from 'diff'

/**
 * Represents a specific difference item in the validation process.
 * Extends the `Change` object from the `diff` library with additional validation metadata.
 */
export interface AIDiffItem extends Change {
  /** 
   * Indicates whether this specific change has been verified against the expected whitelist. 
   * Internal use during the validation process.
   */
  verified?: boolean
  /** 
   * If true, this change MUST be present in the actual output for the validation to pass. 
   */
  required?: boolean
}

/**
 * The execution context passed to an `AIScriptExecutor`.
 * Contains all necessary information to run an AI script or agent.
 */
export interface AIExecutionContext {
  /** The identifier or content of the script/prompt to be executed. */
  script: string
  /** 
   * Arguments and variables to be injected into the script. 
   * These are typically resolved from templates.
   */
  args: Record<string, any>
  /** 
   * Additional execution-level options (e.g., model parameters, temperature). 
   */
  options?: any
}

/**
 * The result returned by an `AIScriptExecutor`.
 */
export interface AIExecutionResult {
  /** 
   * The primary output produced by the script (e.g., a generated string or a structured object). 
   */
  output: any
  /** 
   * The full interaction history or execution trace, often used for complex assertions 
   * like validating tool call sequences.
   */
  messages?: any[]
}

/**
 * Interface for components capable of executing AI scripts or interacting with LLMs.
 * Custom executors (e.g., for LangChain, OpenAI, or local models) must implement this.
 */
export interface AIScriptExecutor {
  /**
   * Executes an AI script within the provided context.
   *
   * @param context - The execution context including script and arguments.
   * @returns A promise resolving to the execution result.
   */
  execute(context: AIExecutionContext): Promise<AIExecutionResult>
}

/**
 * Represents a failure encountered during the validation of an AI output.
 */
export interface AIValidationFailure {
  /** The dot-separated path or array index where the failure occurred. */
  key?: string
  /** A human-readable message describing the failure. */
  message?: string
  /** The value that was expected at the given key. */
  expected?: any
  /** The actual value that was received. */
  actual?: any
  /** Detailed diff information if the failure occurred during a string comparison. */
  diff?: AIDiffItem[]
}

/**
 * Detailed log entry for a single test fixture execution.
 */
export interface AITestLogItem {
  /** True if all validations passed for this fixture. */
  passed: boolean
  /** The resolved input provided to the AI script. */
  input: any
  /** The actual output produced by the executor. */
  actual: any
  /** The expected output or matcher used for validation. */
  expected: any
  /** 
   * Extracted reasoning or explanation from the AI output, if available 
   * (e.g., from a 'reasoning' field in JSON).
   */
  reason?: string
  /** The JSON schema used for validation, if any. */
  expectedSchema?: any
  /** A list of specific validation failures if the test did not pass. */
  failures?: AIValidationFailure[]
  /** Any technical error that occurred during the execution process. */
  error?: any
  /** Whether the test was skipped. */
  skipped?: boolean
  /** The 0-based index of the fixture in the input array. */
  i: number
  /** The duration of this specific test execution in milliseconds. */
  duration: number
  /** Whether the test expectation was negated (passes if validation fails). */
  not?: boolean
}

/**
 * Summary result of running a set of test fixtures.
 */
export interface AITestFixtureResult {
  /** Total number of fixtures that failed validation. */
  failedCount: number
  /** Total number of fixtures that passed validation. */
  passedCount: number
  /** Total number of fixtures that were skipped. */
  skippedCount: number
  /** Array of detailed logs for each executed fixture. */
  logs: AITestLogItem[]
  /** Total wall-clock time for the entire run in milliseconds. */
  duration: number
}

/**
 * Configuration for strict validation mode.
 * 
 * - `true`: Enable strict mode for all types.
 * - `false`: Disable strict mode (partial matching).
 * - `'object' | 'diff' | 'array'`: Enable strict mode only for the specified type.
 * - `string[]`: Array of types to enable strict mode for.
 */
export type AIStrictOption = boolean | string | string[]

/**
 * Options for the `AITestRunner.run` method.
 */
export interface AITestRunnerOptions {
  /** 
   * Base configuration and default values for all fixtures in this run. 
   */
  fixtureConfig?: any
  /** 
   * User-provided runtime configuration, often passed down to the executor. 
   */
  userConfig?: any
  /** 
   * A map of fixture indices to skip during execution. 
   */
  skips?: { [k: number]: boolean }
  /** 
   * Metadata about the script itself, such as output schema definitions. 
   */
  scriptConfig?: any
  /** 
   * Global strict mode configuration. Individual fixtures can override this. 
   */
  strict?: AIStrictOption
  /**
   * Whether to disable heuristic JSON Schema recognition globally.
   */
  disableHeuristicSchema?: boolean
}