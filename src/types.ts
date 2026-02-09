import { Change } from 'diff'

/**
 * Represents a diff item in an AI validation process.
 * Extends the basic `Change` object from the `diff` library.
 */
export interface AIDiffItem extends Change {
  /** Indicates whether this specific change has been verified. */
  verified?: boolean
}

/**
 * The context in which an AI script is executed.
 */
export interface AIExecutionContext {
  /** The script to be executed. */
  script: string
  /** Arguments to be passed to the script. */
  args: Record<string, any>
  /** Additional options for execution. */
  options?: any
}

/**
 * The result of an AI script execution.
 */
export interface AIExecutionResult {
  /** The output produced by the script execution. */
  output: any
  /** The full conversation messages or execution trace. */
  messages?: any[]
  // details?: any
}

/**
 * Interface for components that can execute AI scripts.
 */
export interface AIScriptExecutor {
  /**
   * Executes an AI script with the given context.
   *
   * @param context - The execution context.
   * @returns A promise that resolves to the execution result.
   */
  execute(context: AIExecutionContext): Promise<AIExecutionResult>
}

/**
 * Represents a failure during AI validation.
 */
export interface AIValidationFailure {
  /** The key or path where the failure occurred. */
  key?: string
  /** A descriptive message about the failure. */
  message?: string
  /** The expected value. */
  expected?: any
  /** The actual value received. */
  actual?: any
  /** Detailed diff information if applicable. */
  diff?: AIDiffItem[]
}

/**
 * Represents a single log item for an AI test.
 */
export interface AITestLogItem {
  /** Whether the test passed or failed. */
  passed: boolean
  /** The input provided to the test. */
  input: any
  /** The actual output produced. */
  actual: any
  /** The expected output. */
  expected: any
  /** The reason or explanation provided by the AI for its output. */
  reason?: string
  /** The JSON schema used for expectation validation, if any. */
  expectedSchema?: any
  /** A list of validation failures, if the test failed. */
  failures?: AIValidationFailure[]
  /** Any error that occurred during execution. */
  error?: any
  /** The index of the test fixture. */
  i: number
  /** The duration of the test in milliseconds. */
  duration: number
  /** Whether the test expectation was negated. */
  not?: boolean
}

/**
 * The overall result of running a set of AI test fixtures.
 */
export interface AITestFixtureResult {
  /** Number of failed tests. */
  failedCount: number
  /** Number of passed tests. */
  passedCount: number
  /** Detailed logs for each test. */
  logs: AITestLogItem[]
  /** Total duration of all tests in milliseconds. */
  duration: number
}

/**
 * Options for strict validation mode.
 * Can be a boolean, a single string ('object', 'diff', or 'array'), or an array of these strings.
 */
export type AIStrictOption = boolean | string | string[]

/**
 * Configuration options for the AI test runner.
 */
export interface AITestRunnerOptions {
  /** Initial configuration for test fixtures. */
  fixtureConfig?: any
  /** User-provided configuration. */
  userConfig?: any
  /** Indices of fixtures to skip. */
  skips?: { [k: number]: boolean }
  /** Metadata and configuration for the script (e.g., output definitions). */
  scriptConfig?: any
  /** Strict validation mode configuration. */
  strict?: AIStrictOption
}
