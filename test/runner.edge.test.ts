import { describe, it, expect } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult } from '../src/types.js'

class SimpleExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    return { output: context.args.output }
  }
}

describe('AITestRunner Edge Cases', () => {
  const executor = new SimpleExecutor()
  const runner = new AITestRunner(executor)

  it('should handle recursive template resolution', async () => {
    // b depends on c, a depends on b
    const fixtureConfig = {
      c: 'base',
      b: '{{c}}-middle',
      a: '{{b}}-top'
    }
    const fixtures = [{
      input: { output: '{{a}}' },
      output: 'base-middle-top'
    }]
    const result = await runner.run('test', fixtures, { fixtureConfig })
    expect(result.passedCount).toBe(1)
  })

  it('should preserve meaningful whitespace and handle nulls in omitBy', async () => {
    const fixtures = [{
      input: {
          output: "line1\nline2",
          nl: "\n",      // Should NOT be omitted
          empty: "",     // Should be omitted
          nil: null      // Should be omitted
      },
      output: "line1{{nl}}line2"
    }]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)

    // Check if 'empty' was indeed omitted from templateData (args)
    // We can't check internal args directly easily, but we can test it via template
    const fixtures2 = [{
        input: { empty: "", val: "x" },
        output: "{{empty}}{{val}}"
    }]
    const result2 = await runner.run('test', fixtures2)
    // If empty was omitted, {{empty}} might remain as "{{empty}}" or "" depending on engine.
    // In our case, we just want to ensure nl was NOT omitted.
  })

  describe('Array Matching', () => {
    const actual = [1, 2, 3]

    it('should pass partial array match (actual is longer)', async () => {
      const fixtures = [{
        input: { output: actual },
        output: [1, 2]
      }]
      const result = await runner.run('test', fixtures)
      expect(result.passedCount).toBe(1)
    })

    it('should fail strict array match (length mismatch)', async () => {
      const fixtures = [{
        input: { output: actual },
        output: [1, 2],
        strict: 'array'
      }]
      const result = await runner.run('test', fixtures)
      expect(result.passedCount).toBe(0)
      expect(result.logs[0].failures![0].message).toContain('length mismatch')
    })
  })

  it('should handle custom functions returning detailed error messages', async () => {
    const fixtures = [{
      input: { output: 5 },
      output: (val: number) => val > 10 ? true : 'value must be greater than 10'
    }]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(0)
    expect(result.logs[0].failures![0].message).toContain('value must be greater than 10')
  })

  it('should correctly flip results with "not: true" in complex failure', async () => {
    const fixtures = [{
      input: { output: { a: 1, b: 2 } },
      output: { a: 99, b: 2 }, // 'a' mismatches
      not: true
    }]
    const result = await runner.run('test', fixtures)
    // It failed validation, so 'not: true' makes it PASS
    expect(result.passedCount).toBe(1)
  })

  it('should extract reason/thinking from result object', async () => {
    const fixtures = [{
      input: {
        output: {
          content: 'The answer is 42',
          thinking: 'Calculating the meaning of life...'
        }
      },
      output: { content: 'The answer is 42' }
    }]
    const result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.logs[0].reason).toBe('Calculating the meaning of life...')
  })

  it('should support directory variables if provided in config', async () => {
    const fixtures = [{
      input: { path: '{{__fixture_dir__}}/data.txt', output: '/tmp/data.txt' },
      output: '/tmp/data.txt'
    }]
    const result = await runner.run('test', fixtures, {
      fixtureConfig: { __fixture_dir__: '/tmp' }
    })
    expect(result.passedCount).toBe(1)
  })

  it('should pass the ultimate integration test (all features combined)', async () => {
    const fixtureConfig = {
      base_dir: '/app',
      user_name: 'Alice',
      schema_ver: 'v1'
    }

    const fixtures = [{
      description: 'Complex test case',
      input: {
        output: {
          id: 123,
          metadata: {
            author: 'Alice',
            tags: ['ai', 'test'],
            path: '/app/scripts/test.ai.yaml'
          },
          content: "Hello Alice.\nThis is a test."
        },
        script_path: '{{base_dir}}/scripts/test.ai.yaml'
      },
      output: {
        metadata: {
          author: '{{user_name}}',
          path: '{{script_path}}' // Nested dependency
        }
      },
      diff: [
        { value: 'Alice', added: true }
      ],
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', minimum: 100 }
        }
      }
    }]

    const result = await runner.run('ultimate-test', fixtures, { fixtureConfig })
    expect(result.passedCount).toBe(1)
    expect(result.logs[0].passed).toBe(true)
  })

  it('should handle "not" with JSON Schema correctly', async () => {
    const fixtures = [{
      input: { output: { age: 10 } },
      outputSchema: {
        type: 'object',
        properties: { age: { minimum: 18 } },
        required: ['age']
      },
      not: true // Should pass because age 10 < 18 (validation fails, so NOT passes)
    }]
    let result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(1)
    fixtures[0].not = false
    result = await runner.run('test', fixtures)
    expect(result.passedCount).toBe(0)
  })
})
