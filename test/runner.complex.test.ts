import { describe, it, expect } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult, AITestFixture } from '../src/types.js'
import { YamlTypeJsonSchema } from '../src/yaml-types/index.js'

class DynamicMockExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    const { args } = context
    if (args.jsonObj) {
      return { output: args.jsonObj }
    }
    if (args.content) {
      return { output: args.content }
    }
    return { output: 'default' }
  }
}

describe('AITestRunner Deep Template & Boundary Tests', () => {
  const executor = new DynamicMockExecutor()
  const runner = new AITestRunner(executor)

  it('should resolve variables from fixtureConfig (front-matter)', async () => {
    const fixtures = [{ input: { content: '{{globalVar}}' }, output: 'fixed-value' }]
    const result = await runner.run('test', fixtures, {
      fixtureConfig: { globalVar: 'fixed-value' }
    })
    expect(result.passedCount).toBe(1)
  })

  it('should resolve variables from userConfig.data', async () => {
    const fixtures = [{ input: { content: '{{envVar}}' }, output: 'from-env' }]
    const result = await runner.run('test', fixtures, {
      userConfig: { data: { envVar: 'from-env' } }
    })
    expect(result.passedCount).toBe(1)
  })

  it('should resolve self-referencing variables in input', async () => {
    const fixtures = [
      {
        input: {
          base: 'foo',
          content: '{{base}}-bar'
        },
        output: 'foo-bar'
      }
    ]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should resolve variables in nested output object', async () => {
    const fixtures = [
      {
        input: { name: 'Alice', content: { info: { user: 'Alice' } } },
        output: { info: { user: '{{name}}' } }
      }
    ]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should resolve variables in JSON Schema pattern', async () => {
    // Note: We need to ensure YamlTypeJsonSchema itself supports or is provided with formatted data
    // Currently, validateMatch for schema doesn't format the schema.
    // But defaultValue formats it if data is provided.
    // However, in AITestRunner.run, defaultValue is called without data for outputSchema.

    const fixtures: AITestFixture[] = [
      {
        input: { prefix: 'abc', content: 'abc-123' },
        outputSchema: {
          type: 'string',
          pattern: '^{{prefix}}'
        }
      }
    ]
    // This might fail currently because we don't format the schema object in validateMatch
    // Let's see. If it fails, we know we need to fix validateMatch or AITestRunner.
    let result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
    fixtures[0].disableHeuristicSchema = true
    result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)

    fixtures[0].input.prefix = 'none'
    result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(0)
    expect(result.failedCount).toBe(1)
  })

  it('should handle missing variables by keeping them as is (or as empty depending on template engine)', async () => {
    const fixtures = [{ input: { content: '{{missing}}' }, output: '{{missing}}' }]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should handle mixed sources with priority: userConfig > input > fixtureConfig', async () => {
    const fixtures = [
      {
        input: { var: 'input-val', content: '{{var}}' },
        output: 'user-val'
      }
    ]
    const result = await runner.run('test', fixtures, {
      fixtureConfig: { var: 'fixture-val' },
      userConfig: { data: { var: 'user-val' } }
    })
    expect(result.passedCount).toBe(1)
  })

  it('should support templates in diff config', async () => {
    const fixtures = [
      {
        input: { content: 'hello\nworld', nl: '\n', sp: ' ' },
        output: 'hello world',
        diff: [
          { value: '{{sp}}', removed: true },
          { value: '{{nl}}', added: true }
        ]
      }
    ]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should be failed in JSON Schema pattern', async () => {
    const fixtures = [
      {
        input: {
          content: [
            "@now()",
            "@weather(location=\"重庆\")",
          ]
        },
        outputSchema: {
          "type": "array",
          "minItems": 1,
          "maxItems": 1,
          "allOf": [
            {
              "contains": {
                "type": "string",
                "regexp": "/^@weather\\(location=([\"'])(重庆|Chongqing)(?:,\\s*(?:(?:重庆|Chongqing|四川|Sichuan),\\s*)?(中国|China))?\\1\\)$/i"
              }
            }
          ]
        },
      }
    ]
    // This might fail currently because we don't format the schema object in validateMatch
    // Let's see. If it fails, we know we need to fix validateMatch or AITestRunner.
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(0)
    expect(result.failedCount).toBe(1)
  })

})
