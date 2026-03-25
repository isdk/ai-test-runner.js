import { describe, it, expect, vi } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'

describe('Scoring Details and Penalties', () => {
  const mockExecutor = {
    execute: vi.fn(),
  }

  function findInDetails(details: any[] | undefined, predicate: (d: any) => boolean): any {
    if (!details) return undefined
    for (const d of details) {
      if (predicate(d)) return d
      const found = findInDetails(d.details, predicate)
      if (found) return found
    }
    return undefined
  }

  it('should collect scoring details and dimensions', async () => {
    mockExecutor.execute.mockResolvedValue({
      output: {
        answer: 'Paris',
        meta: { safe: true }
      },
    })

    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'Capital of France',
        scoring: true,
        output: {
          answer: { $expect: 'Paris', $title: 'Correct Answer', $dimension: 'accuracy', $score: 80 },
          meta: {
            safe: { $expect: true, $title: 'Safety Check', $dimension: 'security', $score: 20 }
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    const log = result.logs[0]

    expect(log.passed).toBe(true)
    expect(log.score).toBe(100)
    expect(log.scoreDetails).toBeDefined()

    // Use robust find helper
    const answerDetail = findInDetails(log.scoreDetails, d => d.dimension === 'accuracy')
    expect(answerDetail).toBeDefined()
    expect(answerDetail.title).toBe('Correct Answer')
    expect(answerDetail.score).toBe(1)
    expect(answerDetail.weight).toBe(0.8)
  })

  it('should handle negative scores (penalties)', async () => {
    mockExecutor.execute.mockResolvedValue({
      output: 'Bad word detected: kill',
    })

    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'prompt',
        scoring: true,
        output: {
          $and: [
            { $expect: /Bad word/, $score: 100 },
            { $expect: /kill/, $score: -50, $title: 'Deduction for violence' }
          ]
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    const log = result.logs[0]

    expect(log.score).toBe(50)
    // Negative weight should be found in details
    const penaltyDetail = findInDetails(log.scoreDetails, d => d.weight < 0)
    expect(penaltyDetail).toBeDefined()
    expect(penaltyDetail.title).toBe('Deduction for violence')
  })

  it('should fail if a critical penalty is triggered', async () => {
    mockExecutor.execute.mockResolvedValue({
      output: 'Sensitive info: password123',
    })

    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'prompt',
        scoring: true,
        output: {
          $and: [
            { $expect: /Sensitive info/, $score: 100 },
            { $expect: /password/, $score: { value: -20, critical: true }, $title: 'Leakage' }
          ]
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    const log = result.logs[0]

    expect(log.passed).toBe(false)
    expect(log.score).toBe(80)
    expect(log.failedCritical).toBeDefined()
    expect(log.failedCritical?.[0].message).toBe('Leakage')
  })
})
