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
import { formatObject, validateMatch } from './validate-match.js'
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
async function defaultValue(value: any, defaultValue?: any, data?: any) {
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
 * Runner for executing AI script test fixtures and validating results.
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
   * @param script - The script (e.g., prompt template) to run.
   * @param fixtures - An array of test fixtures.
   * @param options - Runner options for this execution.
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
    const logs: AITestLogItem[] = []

    // Copy to avoid mutating original
    const initialFixtureConfig = cloneDeep(_initialFixtureConfig || {})
    const hasOnly = fixtures.some((f) => f.only)

    // Merge script output schema into fixture config if present
    if (scriptConfig.output) {
      initialFixtureConfig.outputSchema = defaultsDeep(
        {},
        initialFixtureConfig.outputSchema,
        scriptConfig.output
      )
    }

    const startTotalTime = Date.now()

    for (let i = 0; i < fixtures.length; i++) {
      let fixtureConfig = cloneDeep(initialFixtureConfig)
      const fixture = cloneDeep(fixtures[i])

      if (hasOnly && !fixture.only) {
        continue
      }

      if (skips[i] || fixture.skip) {
        continue
      }

      const input = await defaultValue(fixture.input, fixtureConfig?.input)
      const output = await defaultValue(fixture.output, fixtureConfig?.output)

      // Prepare data for templating

      fixtureConfig = await formatObject(fixtureConfig, {
        data: { ...(input && typeof input === 'object' ? input : { input }), ...fixtureConfig },
        input: fixture,
      })

      const tools = fixture.tools || fixtureConfig.tools
      const toolTester = fixture.toolTester || fixtureConfig.toolTester

      let templateData = {
        ...getTemplateData(scriptConfig),

        ...(input && typeof input === 'object' ? input : { input }),

        ...fixtureConfig,

        ...(userConfig.data || {}),
      }

      if (tools) {
        templateData.tools = tools
      }

      // Multi-pass resolution for deep dependencies (e.g., a -> b -> c)

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

      let currentScript = fixture.script || fixtureConfig.script || script
      if (tools && tools.length > 0) {
        currentScript = toolTester || 'toolTester'
      }

      const execContext: AIExecutionContext = {
        script: currentScript,
        args: templateData,
        options: {
          ...userConfig,
        },
      }

      const ts = Date.now()
      let resultOutput: any
      let error: any
      let passed = false
      let failures

      try {
        this.emit('test:start', { i, script: currentScript, input })

        const execResult = await this.executor.execute(execContext)
        resultOutput = execResult.output

        const duration = Date.now() - ts

        // Validation
        const checkSchema =
          userConfig.checkSchema ??
          fixture.checkSchema ??
          fixtureConfig.checkSchema
        const strict =
          fixture.strict ??
          fixtureConfig.strict ??
          userConfig.strict ??
          options.strict
        let expectedSchema: any

        failures = []

        if (checkSchema !== false) {
          expectedSchema = defaultsDeep(
            {},
            fixture.outputSchema,
            fixtureConfig.outputSchema
          )
          if (expectedSchema && expectedSchema.type) {
            // Ensure schema object itself can contain templates
            expectedSchema = await formatObject(expectedSchema, {
              data: templateData,
              input: fixture,
            })
            const schemaFailures = await validateMatch(
              resultOutput,
              YamlTypeJsonSchema.create(expectedSchema),
              { data: templateData, input: fixture, strict }
            )
            if (schemaFailures) failures.push(...schemaFailures)
          }
        }

        if (output !== undefined) {
          const formattedOutput =
            typeof output === 'function'
              ? output
              : await formatObject(cloneDeep(output), {
                  data: templateData,
                  input: fixture,
                })
          const matchFailures = await validateMatch(
            resultOutput,
            formattedOutput,
            {
              data: templateData,
              input: fixture,
              strict,
            }
          )

          if (matchFailures && matchFailures.length > 0) {
            failures.push(...matchFailures)
          }
        }

        const expect = fixture.expect || fixtureConfig.expect
        if (expect) {
          let expectedResult: any
          if (typeof expect === 'function') {
            expectedResult = expect
          } else {
            expectedResult = cloneDeep(expect)
            if (expectedResult.tools) {
              const toolsExpect = expectedResult.tools
              let toolsMatcher
              const tAll = Array.isArray(toolsExpect)
                ? toolsExpect
                : toolsExpect.$all
              if (tAll) {
                toolsMatcher = {
                  $all: tAll.map((t: any) => ({
                    tools: { $contains: t },
                  })),
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

            expectedResult = await formatObject(expectedResult, {
              data: templateData,
              input: fixture,
            })
          }

          const expectFailures = await validateMatch(
            execResult,
            expectedResult,
            {
              data: templateData,
              input: fixture,
              strict,
            }
          )
          if (expectFailures) failures.push(...expectFailures)
        }

        passed = failures.length === 0

        if (fixture.not) {
          passed = !passed
        }

        const reason =
          typeof resultOutput === 'object'
            ? getReasonValue(resultOutput)
            : undefined

        const logItem: AITestLogItem = {
          passed,
          input,
          actual: resultOutput,
          expected: output,
          reason,
          expectedSchema,
          failures: failures.length ? failures : undefined,
          i,
          duration,
          not: fixture.not,
        }

        logs.push(logItem)

        if (passed) {
          passedCount++
          this.emit('test:pass', logItem)
        } else {
          failedCount++
          this.emit('test:fail', logItem)
        }
      } catch (e: any) {
        error = e
        const duration = Date.now() - ts
        const logItem: AITestLogItem = {
          passed: false,
          input,
          actual: resultOutput,
          expected: output,
          error,
          i,
          duration,
        }
        logs.push(logItem)
        failedCount++
        this.emit('test:error', logItem)
      }
    }

    return {
      passedCount,
      failedCount,
      logs,
      duration: Date.now() - startTotalTime,
    }
  }
}
