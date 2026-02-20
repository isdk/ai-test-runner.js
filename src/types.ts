import { Change } from 'diff'

/**
 * Represents a specific difference item in the validation process.
 * Extends the `Change` object from the `diff` library with additional validation metadata.
 */
export interface AIDiffItem extends Change {
  /**
   * The path in the object structure (e.g., "user.id" or "tags[0]").
   * Present when performing structured diffs (like JSON).
   */
  path?: string
  /**
   * The logical value associated with this change.
   * Present when performing structured diffs (like JSON).
   */
  val?: any
  /**
   * Indicates whether this specific change has been verified against the expected whitelist.
   * Internal use during the validation process.
   */
  verified?: boolean
  /**
   * If true, this change MUST be present in the actual output for the validation to pass.
   */
  required?: boolean
  /**
   * Scoring configuration for this specific diff item.
   */
  score?: AIScoreConfig
}

/**
 * Supported diff strategies for string comparison.
 * - `auto`: Automatically detect the best diff strategy based on content.
 * - `chars`: Character-level diffing.
 * - `words`: Word-level diffing (ignoring whitespace).
 * - `wordsWithSpace`: Word-level diffing (including whitespace).
 * - `lines`: Line-level diffing.
 * - `sentences`: Sentence-level diffing.
 * - `json`: JSON-level diffing (serializes objects to JSON first).
 */
export type AIDiffType =
  | 'auto'
  | 'chars'
  | 'words'
  | 'wordsWithSpace'
  | 'lines'
  | 'sentences'
  | 'json'

/**
 * Configuration options for string diffing.
 */
export interface AIDiffOptions {
  /**
   * The diff strategy to use.
   * Defaults to 'auto' when no whitelist is provided for better readability,
   * or 'chars' when a whitelist is provided for precision.
   */
  type?: AIDiffType
  /** A list of expected diff items (whitelist) to match against the actual changes. */
  items?: AIDiffItem[]
  /**
   * Whether to allow unverified diff changes in non-strict mode.
   * If true, changes not present in the `items` list will not cause a failure.
   */
  permissive?: boolean
  /** Whether to ignore case differences. */
  ignoreCase?: boolean
  /** (lines) Whether to ignore leading and trailing whitespace. */
  ignoreWhitespace?: boolean
  /** (lines) Whether to ignore a missing newline character at the end of the last line. */
  ignoreNewlineAtEof?: boolean
  /** (lines) Whether to treat the newline character at the end of each line as its own token. */
  newlineIsToken?: boolean
  /** (lines) Whether to remove all trailing CR characters. */
  stripTrailingCr?: boolean
  /** (words) Optional Intl.Segmenter for word-level diffing. */
  intlSegmenter?: any
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
 * Configuration for scoring a validation item.
 * Can be a simple number (weight) or a detailed object.
 */
export type AIScoreConfig =
  | number
  | {
      /** The relative weight or value of this item. */
      value: number
      /** If true, this item must pass for the overall test to pass, regardless of the score(red-line). */
      critical?: boolean
    }

/**
 * Detailed log entry for a single test fixture execution.
 */
export interface AITestLogItem {
  /** The name of the test fixture. */
  title?: string
  /** True if all validations passed for this fixture. */
  passed: boolean
  /** The final calculated score (0.0 to maxScore). */
  score?: number
  /** The maximum possible score for this test. */
  maxScore?: number
  /** The minimum score required for the test to pass. */
  passScore?: number
  /** A list of validation failures that were marked as 'critical' but failed. */
  failedCritical?: AIValidationFailure[]
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
  /** The specific script ID or source code executed. */
  script?: string
  /**
   * The full interaction history or execution trace (from AIExecutionResult.messages).
   * Useful for debugging tool calls and message sequences.
   */
  actualTrace?: any[]
  /**
   * The resolved and formatted expectation for the execution trace (from AITestFixture.expect).
   */
  expectedTrace?: any
  /**
   * The final set of tools provided to the executor after resolving IDs and 'tools: true'.
   */
  tools?: any[]
  /**
   * The final resolved template data (variables) used during execution and validation.
   * Inclusion depends on `AITestRunnerOptions.logVars`.
   */
  vars?: Record<string, any>
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
 * Represents a single test fixture definition.
 */
export interface AITestFixture {
  /** A descriptive title for the test case. */
  title?: string
  /** The input data for the test, often used to populate script templates. */
  input?: any
  /** The expected primary output from the AI. */
  output?: any
  /** A JSON Schema to validate the AI output against. */
  outputSchema?: any
  /**
   * The specific script or template ID to use for this test.
   * Overrides the default script provided to the runner.
   */
  script?: string
  /** Tools available to the AI during this test. */
  tools?: AITestTools
  /** A specialized script/executor for testing tool calls. */
  toolTester?: string
  /**
   * Expectations for the full execution trace (e.g., messages, tool calls).
   * Will be compared against `AIExecutionResult.messages`.
   */
  expect?: any
  /** Strict validation mode configuration for this fixture. */
  strict?: AIStrictOption
  /** Whether to perform JSON Schema validation. */
  checkSchema?: boolean
  /** Whether to disable heuristic JSON Schema recognition. */
  disableHeuristicSchema?: boolean
  /** Custom validation operators for this fixture. */
  operators?: Record<string, any>
  /** Whether to allow custom operators to override built-in ones. */
  allowOperatorOverride?: boolean
  /**
   * Scoring mode configuration.
   * - `true`: Enable scoring.
   * - `false`: Disable scoring.
   * - `'auto'`: Automatically enable if 'score' properties are found.
   */
  scoring?: boolean | 'auto'
  /** The maximum possible score for this fixture. Defaults to 1. */
  maxScore?: number
  /** The minimum score required for the fixture to pass. Defaults to maxScore. */
  passScore?: number
  /** The default relative weight for items that do not have an explicit 'score' property. */
  unassignedWeight?: number
  /** If true, only this fixture (and others marked 'only') will run. */
  only?: boolean
  /** If true, this fixture will be skipped. */
  skip?: boolean
  /** If true, the test passes if validation fails. */
  not?: boolean
  /** Support for arbitrary custom properties used in templates. */
  [key: string]: any
}

/**
 * Represents a single tool definition for testing.
 * Can be a string (tool ID/filename) or a record (full tool definition).
 */
export type AITestTool = string | Record<string, any>

/**
 * Configuration for tool usage in test fixtures.
 *
 * - `true`: Automatically use the current script as the tool.
 * - `string`: A single tool ID or filename.
 * - `Record<string, any>`: A single tool definition object.
 * - `Array`: A collection of tool IDs or objects.
 */
export type AITestTools = boolean | AITestTool | AITestTool[]

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
  fixtureConfig?: Partial<AITestFixture>
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
  /**
   * Custom validation operators.
   */
  operators?: Record<string, any>
  /**
   * Whether to allow custom operators to override built-in ones.
   */
  allowOperatorOverride?: boolean
  /**
   * Base directory for resolving relative paths in operators.
   */
  baseDir?: string
  /**
   * Whether to include the resolved template variables (`vars`) in the log.
   * - `true`: Always include.
   * - `false`: Never include (default).
   * - `'error'`: Only include when the test fails.
   */
  logVars?: boolean | 'error'
  /**
   * Scoring mode configuration.
   * - `true`: Enable scoring.
   * - `false`: Disable scoring.
   * - `'auto'`: Automatically enable if 'score' properties are found.
   */
  scoring?: boolean | 'auto'
  /** The maximum possible score for this fixture. Defaults to 1. */
  maxScore?: number
  /** The minimum score required for the fixture to pass. Defaults to maxScore. */
  passScore?: number
  /** The default relative weight for items that do not have an explicit 'score' property. */
  unassignedWeight?: number
}
