import { describe, it, expect, vi } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult } from '../src/types.js'
import { YamlTypeJsonSchema } from '../src/yaml-types/index.js'

class MockExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    if (context.args.echo) {
        return { output: context.args.echo }
    }
    return { output: 'default output' }
  }
}

describe('AITestRunner', () => {
  const executor = new MockExecutor()
  const runner = new AITestRunner(executor)

  it('should run basic test and pass', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: 'hello'
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.failedCount).toBe(0)
    expect(result.logs[0].passed).toBe(true)
    expect(result.logs[0].actual).toBe('hello')
  })

  it('should fail when output mismatch', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: 'world'
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(0)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].passed).toBe(false)
    expect(result.logs[0].failures).toBeDefined()
  })

  it('should support RegExp output', async () => {
    const fixtures = [
      {
        input: { echo: 'hello world' },
        output: /hello/
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support functional output', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: (actual: any) => actual === 'hello' ? true : 'should be hello'
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support JSON Schema validation', async () => {
    const schema = YamlTypeJsonSchema.create({
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name']
    })

    const fixtures = [
      {
        input: { echo: { name: 'test' } },
        outputSchema: schema
      },
      {
        input: { echo: { age: 20 } },
        outputSchema: schema
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.failedCount).toBe(1)
  })

  it('should support "not" flag', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: 'world',
        not: true
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.logs[0].not).toBe(true)
  })

  it('should emit events during run', async () => {
    const fixtures = [{ input: { echo: 'hi' }, output: 'hi' }]
    const startSpy = vi.fn()
    const passSpy = vi.fn()

    runner.on('test:start', startSpy)
    runner.on('test:pass', passSpy)

    await runner.run('test-script', fixtures)

    expect(startSpy).toHaveBeenCalled()
    expect(passSpy).toHaveBeenCalled()
  })

  it('should support skip flag and skippedCount', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: 'hello'
      },
      {
        input: { echo: 'skip me' },
        output: 'skip me',
        skip: true
      }
    ]
    const skipSpy = vi.fn()
    runner.on('test:skip', skipSpy)

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.skippedCount).toBe(1)
    expect(result.failedCount).toBe(0)
    expect(result.logs.length).toBe(2)
    expect(result.logs[1].skipped).toBe(true)
    expect(skipSpy).toHaveBeenCalled()
  })

  it('should support skips option', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: 'hello'
      },
      {
        input: { echo: 'skip me' },
        output: 'skip me'
      }
    ]
    const result = await runner.run('test-script', fixtures, { skips: { 1: true } })
    expect(result.passedCount).toBe(1)
    expect(result.skippedCount).toBe(1)
    expect(result.logs[1].skipped).toBe(true)
  })

  it('should support "only" flag', async () => {
    const fixtures = [
      {
        input: { echo: 'hello' },
        output: 'hello',
        only: true
      },
      {
        input: { echo: 'skip me' },
        output: 'skip me'
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.skippedCount).toBe(1)
    expect(result.logs[1].skipped).toBe(true)
  })

  it('should handle template data in output', async () => {
    const fixtures = [
      {
        input: { name: 'Alice', echo: 'Hello Alice' },
        output: 'Hello {{name}}'
      }
    ]
    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })
})
