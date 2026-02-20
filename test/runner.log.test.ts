import { describe, it, expect } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult } from '../src/types.js'

class MockExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    const output = context.args.echo || 'default'
    const messages = [{ role: 'user', content: context.script }, { role: 'assistant', content: output }]
    return { output, messages }
  }
}

describe('AITestRunner Logging', () => {
  const executor = new MockExecutor()
  const runner = new AITestRunner(executor)

  it('should populate all basic and new fields in AITestLogItem', async () => {
    const fixtures = [
      {
        title: 'Complete Log Test',
        input: { echo: 'hello', extra: 'var' },
        output: 'hello',
        toolTester: 'custom-script',
        expect: {
          output: 'hello'
        },
        tools: ['tool1']
      }
    ]
    const result = await runner.run('default-script', fixtures)
    const log = result.logs[0]

    expect(log.title).toBe('Complete Log Test')
    expect(log.passed).toBe(true)
    expect(log.i).toBe(0)
    expect(log.input).toEqual({ echo: 'hello', extra: 'var' })
    expect(log.actual).toBe('hello')
    expect(log.expected).toBe('hello')
    expect(log.script).toBe('custom-script')
    expect(log.actualTrace).toBeDefined()
    expect(log.actualTrace).toHaveLength(2)
    expect(log.expectedTrace).toBeDefined()
    expect(log.tools).toEqual(['tool1'])
    expect(log.duration).toBeGreaterThanOrEqual(0)
  })

  it('should handle logVars: true (always include vars)', async () => {
    const fixtures = [
      {
        input: { echo: 'pass' },
        output: 'pass'
      },
      {
        input: { echo: 'fail' },
        output: 'mismatch'
      }
    ]
    const result = await runner.run('script', fixtures, { logVars: true })

    expect(result.logs[0].vars).toBeDefined()
    expect(result.logs[0].vars?.echo).toBe('pass')
    expect(result.logs[1].vars).toBeDefined()
    expect(result.logs[1].vars?.echo).toBe('fail')
  })

  it('should handle logVars: false (default, never include vars)', async () => {
    const fixtures = [{ input: { echo: 'test' }, output: 'test' }]
    const result = await runner.run('script', fixtures) // logVars defaults to false
    expect(result.logs[0].vars).toBeUndefined()
  })

  it('should handle logVars: "error" (include vars only on failure)', async () => {
    const fixtures = [
      {
        title: 'Success Case',
        input: { echo: 'pass' },
        output: 'pass'
      },
      {
        title: 'Failure Case',
        input: { echo: 'fail' },
        output: 'mismatch'
      }
    ]
    const result = await runner.run('script', fixtures, { logVars: 'error' })

    expect(result.logs[0].passed).toBe(true)
    expect(result.logs[0].vars).toBeUndefined()

    expect(result.logs[1].passed).toBe(false)
    expect(result.logs[1].vars).toBeDefined()
    expect(result.logs[1].vars?.echo).toBe('fail')
  })

  it('should include reason when available in output', async () => {
    const reasonExecutor: AIScriptExecutor = {
      async execute() {
        return { output: { result: 'ok', reasoning: 'I thought so' } }
      }
    }
    const reasonRunner = new AITestRunner(reasonExecutor)
    const result = await reasonRunner.run('script', [{ input: {}, output: { result: 'ok' } }])
    expect(result.logs[0].reason).toBe('I thought so')
  })

  it('should include expectedSchema in log', async () => {
    const fixtures = [
      {
        input: { echo: 'test' },
        outputSchema: { type: 'string' }
      }
    ]
    const result = await runner.run('script', fixtures)
    expect(result.logs[0].expectedSchema).toEqual({ type: 'string' })
  })

  it('should preserve fields in skipped tests', async () => {
    const fixtures = [
      {
        title: 'Skipped Test',
        input: { data: 1 },
        output: { data: 1 },
        skip: true
      }
    ]
    const result = await runner.run('script', fixtures)
    const log = result.logs[0]
    expect(log.skipped).toBe(true)
    expect(log.title).toBe('Skipped Test')
    expect(log.input).toEqual({ data: 1 })
    expect(log.expected).toEqual({ data: 1 })
  })

  it('should resolve and log "tools: true" correctly', async () => {
    const fixtures = [
      {
        title: 'Tools True Test',
        tools: true,
        input: { echo: 'ok' },
        output: 'ok'
      }
    ]
    // tools: true requires the script to be an ID, not source code
    const result = await runner.run('my-script-id', fixtures)
    const log = result.logs[0]

    expect(log.script).toBe('toolTester') // Default tool tester script
    expect(log.tools).toEqual(['my-script-id']) // Resolved from 'tools: true'
  })

  it('should log transformed sugar in expectedTrace', async () => {
    const fixtures = [
      {
        expect: {
          tools: ['search']
        }
      }
    ]
    const result = await runner.run('script', fixtures)
    const log = result.logs[0]

    // Verify the sugar transformation: tools: ['search'] -> messages: { $all: [...] }
    expect(log.expectedTrace.messages).toBeDefined()
    expect(log.expectedTrace.messages.$all).toContainEqual({
      tools: { $contains: 'search' }
    })
  })

  it('should capture final state of multi-level template variables in vars', async () => {
    const fixtures = [
      {
        customBase: 'prefix',
        customFull: '{{customBase}}-suffix',
        input: { data: '{{customFull}}' },
        output: 'prefix-suffix'
      }
    ]
    const result = await runner.run('script', fixtures, { logVars: true })
    const log = result.logs[0]

    expect(log.vars?.customFull).toBe('prefix-suffix')
    expect(log.vars?.input?.data).toBe('prefix-suffix')
  })
})
