import { EventEmitter } from '@isdk/ai-tool'
import { cloneDeep, defaultsDeep, omitBy } from 'lodash-es'
// @ts-ignore
import { getTemplateData } from '@isdk/ai-tool-agent'

import {
  AITestFixtureResult,
  AITestLogItem,
  AIExecutionContext,
  AIScriptExecutor,
  AITestRunnerOptions,
} from './types.js'
import { formatObject, validateMatch } from './validate/index.js'
import { loadOperators } from './validate/loader.js'
import { YamlTypeJsonSchema } from './yaml-types/index.js'

const ReasonNames = [
  'thinking',
  'reasonings',
  'reasoning',
  'reasons',
  'reason',
  'explanations',
  'explanation',
]

/**
 * Extracts a reasoning/explanation value from an object if it exists.
 *
 * @param obj - The object to extract reasoning from.
 * @returns The reasoning string or undefined.
 */
function getReasonValue(obj: any) {
  if (!obj || typeof obj !== 'object') return undefined
  const name = ReasonNames.find((name) => name in obj)
  return name && obj[name]
}

/**
 * Resolves a value with its default, handles deep merging for objects,
 * applies templating, and manages YamlTypeJsonSchema instances.
 *
 * @param value - The primary value.
 * @param defaultValue - The default value to fall back to or merge with.
 * @param data - Optional data context for templating.
 * @returns The resolved value.
 */
async function resolveDefaultValue(value: any, defaultValue?: any, data?: any) {
  const isYamlJsonSchema =
    value instanceof YamlTypeJsonSchema ||
    defaultValue instanceof YamlTypeJsonSchema

  if (value == null) {
    value = defaultValue
  } else if (
    typeof value === 'object' &&
    defaultValue &&
    typeof defaultValue === 'object'
  ) {
    value = defaultsDeep({}, value, defaultValue)
  }

  if (typeof value !== 'function') {
    if (data) {
      value = await formatObject(value, { data })
    }
    if (
      value &&
      !Array.isArray(value) &&
      typeof value === 'object' &&
      !(value instanceof RegExp)
    ) {
      value = omitBy(
        value,
        (v) => v == null || (typeof v === 'string' && v === '')
      )
    }

    if (isYamlJsonSchema) {
      value = YamlTypeJsonSchema.create(value)
    }
  }

  return value
}

/**
 * Checks if a string is a valid script identifier (not source code).
 *
 * @param script - The script string to check.
 * @returns True if it looks like an ID/filename.
 */
function isScriptId(script: string) {
  if (!script || typeof script !== 'string') return false
  // If it contains newlines or curly braces, it's likely source code
  return !/[\n\r{}]/.test(script) && script.length < 256
}

/**
 * Runner for executing AI script test fixtures and validating results.
 *
 * @fires AITestRunner#test:start - Fired before executing a fixture.
 * @fires AITestRunner#test:pass - Fired when a fixture passes all validations.
 * @fires AITestRunner#test:fail - Fired when a fixture fails validation.
 * @fires AITestRunner#test:error - Fired when an exception occurs during execution.
 * @fires AITestRunner#test:skip - Fired when a fixture is skipped.
 */
export class AITestRunner extends EventEmitter {
  /**
   * Creates a new AITestRunner instance.
   *
   * @param executor - The executor to use for running AI scripts.
   */
  constructor(private executor: AIScriptExecutor) {
    super()
  }

  /**
   * Runs a set of test fixtures against a specified script.
   *
   * @param script - The default script to run if not specified in fixtures.
   * @param fixtures - An array of test fixtures.
   * @param options - Global runner options.
   * @returns A promise that resolves to the overall test results.
   */
  async run(
    script: string,
    fixtures: any[],
    options: AITestRunnerOptions = {}
  ): Promise<AITestFixtureResult> {
    const {
      fixtureConfig: _initialFixtureConfig,
      userConfig = {},
      skips = {},
      scriptConfig = {},
    } = options
    let failedCount = 0
    let passedCount = 0
    let skippedCount = 0
    const logs: AITestLogItem[] = []

    const initialFixtureConfig = cloneDeep(_initialFixtureConfig || {})
    const hasOnly = fixtures.some((f) => f.only)
    const globalOperators = options.operators
      ? await loadOperators(options.operators, options.baseDir)
      : {}

    if (scriptConfig.output) {
      initialFixtureConfig.outputSchema = defaultsDeep(
        {},
        initialFixtureConfig.outputSchema,
        scriptConfig.output
      )
    }

    const startTotalTime = Date.now()

    for (let i = 0; i < fixtures.length; i++) {
      const fixture = cloneDeep(fixtures[i])

      if ((hasOnly && !fixture.only) || skips[i] || fixture.skip) {
        skippedCount++
        const logItem: AITestLogItem = {
          i,
          skipped: true,
          passed: false,
          input: fixture.input,
          actual: undefined,
          expected: fixture.output,
          duration: 0,
        }
        if (fixture.title) {
          logItem.title = fixture.title
        }
        logs.push(logItem)
        this.emit('test:skip', logItem)
        continue
      }

      const logItem = await this.runFixture(
        i,
        script,
        fixture,
        initialFixtureConfig,
        options,
        globalOperators
      )
      logs.push(logItem)

      if (logItem.passed) {
        passedCount++
        this.emit('test:pass', logItem)
      } else if (logItem.error) {
        failedCount++
        this.emit('test:error', logItem)
      } else {
        failedCount++
        this.emit('test:fail', logItem)
      }
    }

    return {
      passedCount,
      failedCount,
      skippedCount,
      logs,
      duration: Date.now() - startTotalTime,
    }
  }

  /**
   * Executes a single test fixture.
   *
   * @private
   */
  private async runFixture(
    i: number,
    defaultScript: string,
    fixture: any,
    initialFixtureConfig: any,
    options: AITestRunnerOptions,
    globalOperators: any = {}
  ): Promise<AITestLogItem> {
    const ts = Date.now()
    let fixtureConfig = cloneDeep(initialFixtureConfig)
    const { userConfig = {} } = options

    let input: any
    let output: any
    const result: any = {}
    if (fixture.title) {
      result.title = fixture.title
    }

    try {
      input = await resolveDefaultValue(fixture.input, fixtureConfig?.input)
      output = await resolveDefaultValue(fixture.output, fixtureConfig?.output)

      fixtureConfig = await formatObject(fixtureConfig, {
        data: {
          ...(input && typeof input === 'object' ? input : { input }),
          ...fixtureConfig,
        },
        input: fixture,
      })

      const targetScript =
        fixture.script || fixtureConfig.script || defaultScript
      const currentScript = this.resolveScript(
        fixture,
        fixtureConfig,
        defaultScript
      )
      const templateData = await this.resolveTemplateData(
        fixture,
        fixtureConfig,
        input,
        options,
        targetScript
      )

      const execContext: AIExecutionContext = {
        script: currentScript,
        args: templateData,
        options: { ...userConfig },
      }

      this.emit('test:start', { i, script: currentScript, input })

      const execResult = await this.executor.execute(execContext)
      const duration = Date.now() - ts
      const failures = await this.validateFixture(
        fixture,
        fixtureConfig,
        templateData,
        execResult,
        options,
        globalOperators
      )

      let passed = failures.length === 0
      if (fixture.not) passed = !passed

      const reason =
        typeof execResult.output === 'object'
          ? getReasonValue(execResult.output)
          : undefined

      return {
        ...result,
        passed,
        input,
        actual: execResult.output,
        expected: output,
        reason,
        expectedSchema: await this.getExpectedSchema(
          fixture,
          fixtureConfig,
          templateData
        ),
        failures: failures.length ? failures : undefined,
        i,
        duration,
        not: fixture.not,
      }
    } catch (error: any) {
      return {
        ...result,
        passed: false,
        input,
        actual: undefined,
        expected: output,
        error,
        i,
        duration: Date.now() - ts,
      }
    }
  }

  /**
   * Resolves the final template data with multi-pass resolution for deep dependencies.
   * Handles automatic tool resolution when `tools: true` is set.
   *
   * @param fixture - The current test fixture.
   * @param fixtureConfig - The merged fixture configuration.
   * @param input - The resolved input data.
   * @param options - Global runner options.
   * @param currentScript - The target script ID or source code.
   * @returns A promise resolving to the final template data.
   * @throws Error if `tools: true` is used with source code instead of a script ID.
   * @private
   */
  private async resolveTemplateData(
    fixture: any,
    fixtureConfig: any,
    input: any,
    options: AITestRunnerOptions,
    currentScript?: string
  ) {
    const { scriptConfig = {}, userConfig = {} } = options
    let tools = fixture.tools ?? fixtureConfig.tools

    if (tools === true) {
      if (currentScript && isScriptId(currentScript)) {
        tools = [currentScript]
      } else if (currentScript) {
        throw new Error(
          `Cannot use 'tools: true' when script is source code: ${currentScript.slice(0, 50)}...`
        )
      }
    } else if (tools && !Array.isArray(tools) && typeof tools !== 'boolean') {
      tools = [tools]
    }

    let templateData = {
      ...getTemplateData(scriptConfig),
      ...fixture,
      ...(input && typeof input === 'object' ? input : { input }),
      ...fixtureConfig,
      ...(userConfig.data || {}),
    }

    if (tools) templateData.tools = tools

    let lastDataStr = ''
    for (let pass = 0; pass < 5; pass++) {
      templateData = await formatObject(templateData, {
        data: templateData,
        input: fixture,
      })
      const currentDataStr = JSON.stringify(templateData)
      if (currentDataStr === lastDataStr) break
      lastDataStr = currentDataStr
    }
    return templateData
  }

  /**
   * Determines which script or tool tester to execute.
   * Automatically switches to `toolTester` if tools are configured.
   *
   * @param fixture - The current test fixture.
   * @param fixtureConfig - The merged fixture configuration.
   * @param defaultScript - The default script from the runner.
   * @returns The script ID or source code to be executed.
   * @private
   */
  private resolveScript(
    fixture: any,
    fixtureConfig: any,
    defaultScript: string
  ) {
    const tools = fixture.tools ?? fixtureConfig.tools
    const toolTester = fixture.toolTester ?? fixtureConfig.toolTester

    if (
      tools === true ||
      (Array.isArray(tools) && tools.length > 0) ||
      (tools && !Array.isArray(tools) && typeof tools !== 'boolean')
    ) {
      return toolTester || 'toolTester'
    }
    return fixture.script || fixtureConfig.script || defaultScript
  }

  /**
   * Performs all validations (Schema, Output, Expect) for a fixture.
   *
   * @private
   */
  private async validateFixture(
    fixture: any,
    fixtureConfig: any,
    templateData: any,
    execResult: any,
    options: AITestRunnerOptions,
    globalOperators: any = {}
  ) {
    const { userConfig = {} } = options
    const failures: any[] = []
    const checkSchema =
      userConfig.checkSchema ?? fixture.checkSchema ?? fixtureConfig.checkSchema
    const strict =
      fixture.strict ??
      fixtureConfig.strict ??
      userConfig.strict ??
      options.strict
    const disableHeuristicSchema =
      fixture.disableHeuristicSchema ??
      fixtureConfig.disableHeuristicSchema ??
      userConfig.disableHeuristicSchema ??
      options.disableHeuristicSchema
    const allowOperatorOverride =
      fixture.allowOperatorOverride ??
      fixtureConfig.allowOperatorOverride ??
      options.allowOperatorOverride

    const fixtureOps = fixture.operators || fixtureConfig.operators
    let operators = globalOperators
    if (fixtureOps) {
      const loadedFixtureOps = await loadOperators(fixtureOps, options.baseDir)
      operators = { ...globalOperators, ...loadedFixtureOps }
    }

    // 1. JSON Schema Validation
    if (checkSchema !== false) {
      const expectedSchema = await this.getExpectedSchema(
        fixture,
        fixtureConfig,
        templateData
      )
      if (expectedSchema && expectedSchema.type) {
        const schemaFailures = await validateMatch(
          execResult.output,
          expectedSchema,
          {
            data: templateData,
            input: fixture,
            strict,
            disableHeuristicSchema,
            operators,
            allowOperatorOverride,
          }
        )
        if (schemaFailures) failures.push(...schemaFailures)
      }
    }

    // 2. Output Matching
    const output =
      fixture.output !== undefined ? fixture.output : fixtureConfig.output
    if (output !== undefined) {
      const formattedOutput =
        typeof output === 'function'
          ? output
          : await formatObject(cloneDeep(output), {
              data: templateData,
              input: fixture,
            })
      const matchFailures = await validateMatch(
        execResult.output,
        formattedOutput,
        {
          data: templateData,
          input: fixture,
          strict,
          disableHeuristicSchema,
          operators,
          allowOperatorOverride,
        }
      )
      if (matchFailures) failures.push(...matchFailures)
    }

    // 3. Expect Trace Validation
    const expect = fixture.expect || fixtureConfig.expect
    if (expect) {
      const expectedResult = await this.prepareExpectation(
        expect,
        templateData,
        fixture
      )
      const expectFailures = await validateMatch(execResult, expectedResult, {
        data: templateData,
        input: fixture,
        strict,
        disableHeuristicSchema,
        operators,
        allowOperatorOverride,
      })
      if (expectFailures) failures.push(...expectFailures)
    }

    return failures
  }

  /**
   * Resolves and formats the expected JSON schema.
   *
   * @private
   */
  private async getExpectedSchema(
    fixture: any,
    fixtureConfig: any,
    templateData: any
  ) {
    let schema = defaultsDeep(
      {},
      fixture.outputSchema,
      fixtureConfig.outputSchema
    )
    if (schema && schema.type) {
      schema = await formatObject(schema, {
        data: templateData,
        input: fixture,
      })
    }
    return schema
  }

  /**
   * Prepares the expectation object, including tool call matching sugar.
   *
   * @private
   */
  private async prepareExpectation(
    expect: any,
    templateData: any,
    fixture: any
  ) {
    if (typeof expect === 'function') return expect

    const expectedResult = cloneDeep(expect)
    if (expectedResult.tools) {
      const toolsExpect = expectedResult.tools
      let toolsMatcher
      const tAll = Array.isArray(toolsExpect) ? toolsExpect : toolsExpect.$all

      if (tAll) {
        toolsMatcher = {
          $all: tAll.map((t: any) => ({ tools: { $contains: t } })),
        }
      } else if (toolsExpect.$sequence) {
        toolsMatcher = {
          $sequence: toolsExpect.$sequence.map((t: any) => ({
            tools: { $contains: t },
          })),
        }
      }

      if (toolsMatcher) {
        if (expectedResult.messages) {
          if (
            typeof expectedResult.messages === 'object' &&
            expectedResult.messages.$all
          ) {
            expectedResult.messages.$all.push(toolsMatcher)
          } else {
            expectedResult.messages = {
              $all: [expectedResult.messages, toolsMatcher],
            }
          }
        } else {
          expectedResult.messages = toolsMatcher
        }
      }
      delete expectedResult.tools
    }

    return formatObject(expectedResult, {
      data: templateData,
      input: fixture,
    })
  }
}
