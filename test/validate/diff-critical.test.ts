import { describe, it, expect } from 'vitest'
import { AITestRunner } from '../../src/ai-test-runner.js'
import { AIScriptExecutor } from '../../src/types.js'

const mockExecutor: AIScriptExecutor = {
  execute: async (context) => {
    return { output: context.args.input }
  }
}

describe('Critical vs Diff Required Independence', () => {
  const runner = new AITestRunner(mockExecutor)

  it('should mark as critical failure when diff.required missing AND branch is critical', async () => {
    const fixture = {
      input: 'hello', // Missing 'world' which is required
      output: {
        $diff: {
          value: 'hello world',
          items: [{ value: ' world', added: true, required: true }],
          permissive: true
        },
        score: { value: 10, critical: true }
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('any', [fixture])
    const log = result.logs[0]

    expect(log.passed).toBe(false)
    // Should be in failedCritical because score.critical is true
    expect(log.failedCritical).toBeDefined()
    expect(log.failedCritical!.length).toBeGreaterThan(0)
    expect(log.failedCritical![0].message).toContain('missing required diff items')
  })

  it('should NOT mark as critical failure when diff.required missing but branch is NOT critical', async () => {
    const fixture = {
      input: 'hello', // Missing 'world' which is required
      output: {
        $diff: {
          value: 'hello world',
          items: [{ value: ' world', added: true, required: true }],
          permissive: true
        }
        // score.critical is NOT set here
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('any', [fixture])
    const log = result.logs[0]

    expect(log.passed).toBe(false)
    // Should NOT be in failedCritical because this branch is not critical
    expect(log.failedCritical).toBeUndefined()
    
    // But it should still be a regular failure
    expect(log.failures).toBeDefined()
    expect(log.failures!.length).toBeGreaterThan(0)
    expect(log.failures![0].message).toContain('missing required diff items')
  })

  it('should mark as critical failure for any mismatch if branch is critical', async () => {
    const fixture = {
      input: 'wrong',
      output: {
        $expect: 'correct',
        score: { value: 10, critical: true }
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('any', [fixture])
    const log = result.logs[0]

    expect(log.passed).toBe(false)
    expect(log.failedCritical).toBeDefined()
    expect(log.failedCritical!.length).toBeGreaterThan(0)
  })
})
