import { Change } from 'diff'

export interface AIDiffItem extends Change {
  verified?: boolean
}

export interface AIExecutionContext {
  script: string
  args: Record<string, any>
  options?: any
}

export interface AIExecutionResult {
  output: any
  // details?: any
}

export interface AIScriptExecutor {
  execute(context: AIExecutionContext): Promise<AIExecutionResult>
}

export interface AIValidationFailure {
  key?: string
  message?: string
  expected?: any
  actual?: any
  diff?: AIDiffItem[]
}

export interface AITestLogItem {
  passed: boolean
  input: any
  actual: any
  expected: any
  reason?: string
  expectedSchema?: any
  failures?: AIValidationFailure[]
  error?: any
  i: number
  duration: number // ms
  not?: boolean
}

export interface AITestFixtureResult {
  failedCount: number
  passedCount: number
  logs: AITestLogItem[]
  duration: number
}

export type AIStrictOption = boolean | string | string[]

export interface AITestRunnerOptions {
  fixtureConfig?: any
  userConfig?: any
  skips?: { [k: number]: boolean }
  scriptConfig?: any // Metadata of the script (e.g. output definitions)
  strict?: AIStrictOption
}
