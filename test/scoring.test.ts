import { describe, it, expect } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor } from '../src/types.js'

const mockExecutor: AIScriptExecutor = {
  execute: async (context) => {
    if (context.script === 'return-input') {
      return { output: context.args.input }
    }
    return { output: 'default output' }
  }
}

describe('Scoring Strategy', () => {
  const runner = new AITestRunner(mockExecutor)

  it('should calculate basic relative weights', async () => {
    const fixture = {
      input: { a: 'spring', b: 'flower' },
      output: {
        $and: [
          { $expect: /spring/, score: 8 },
          { $expect: /flower/, score: 2 }
        ]
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    const log = result.logs[0]
    expect(log.score).toBe(100)
    expect(log.passed).toBe(true)

    // Partial match
    const fixture2 = {
      ...fixture,
      input: { a: 'spring', b: 'rock' }
    }
    const result2 = await runner.run('return-input', [fixture2])
    const log2 = result2.logs[0]
    // 8/(8+2) * 100 = 80
    expect(log2.score).toBe(80)
    expect(log2.passed).toBe(false) // Default passScore is maxScore (100)
  })

  it('should support passScore', async () => {
    const fixture = {
      input: { a: 'spring', b: 'rock' },
      output: {
        $and: [
          { $expect: /spring/, score: 8 },
          { $expect: /flower/, score: 2 }
        ]
      },
      scoring: true,
      maxScore: 100,
      passScore: 70
    }

    const result = await runner.run('return-input', [fixture])
    const log = result.logs[0]
    expect(log.score).toBe(80)
    expect(log.passed).toBe(true)
  })

  it('should handle mandatory (critical) items', async () => {
    const fixture = {
      input: { a: 'winter', b: 'flower' },
      output: {
        $and: [
          { $expect: /spring/, score: { value: 2, critical: true } },
          { $expect: /flower/, score: 8 }
        ]
      },
      scoring: true,
      maxScore: 100,
      passScore: 50
    }

    const result = await runner.run('return-input', [fixture])
    const log = result.logs[0]
    // Score is 8/(2+8) * 100 = 80, which is > 50
    expect(log.score).toBe(80)
    // But it should fail because the critical item (spring) failed
    expect(log.passed).toBe(false)
    expect(log.failedCritical?.length).toBeGreaterThan(0)
  })

  it('should support hierarchical weights', async () => {
    const fixture = {
      input: {
        header: 'Summary',
        body: { text: 'The weather is nice', tags: ['sunny', 'warm'] }
      },
      output: {
        header: { $expect: 'Summary', score: 20 },
        body: {
          score: 80,
          text: { $expect: /weather/, score: 1 },
          tags: {
            score: 1,
            $contains: 'sunny'
          }
        }
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    const log = result.logs[0]
    expect(log.score).toBe(100)
    expect(log.passed).toBe(true)

    // Partial body match
    const fixture2 = {
      ...fixture,
      input: {
        header: 'Summary',
        body: { text: 'Bad text', tags: ['sunny'] }
      }
    }
    const result2 = await runner.run('return-input', [fixture2])
    const log2 = result2.logs[0]
    // header: 20
    // body: 80 allocated.
    //   Inside body: text (weight 1), tags (weight 1). Total weight 2.
    //   text failed (0). tags passed (1/2 * 80 = 40).
    // Total score: 20 + 40 = 60
    expect(log2.score).toBeCloseTo(60, 3)
  })

  it('should handle $or operator in scoring mode', async () => {
    const fixture = {
      input: 'apple',
      output: {
        $or: [
          { $expect: 'apple', score: 10 },
          { $expect: 'banana', score: 20 }
        ]
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    const log = result.logs[0]
    // $or returns the max score of matched branches.
    // Here only 'apple' matches. It gets 100% of the $or node's allocated score?
    // In $or, each branch can claim the full allocated score.
    // So 'apple' matched, it earned ctx.allocatedScore (100).
    expect(log.score).toBe(10)

    const fixture2 = {
      input: 'banana',
      output: {
        $or: [
          { $expect: 'apple', score: 10 },
          { $expect: 'banana', score: 20 }
        ]
      },
      scoring: true,
      maxScore: 100
    }
    const result2 = await runner.run('return-input', [fixture2])
    expect(result2.logs[0].score).toBe(20)
  })

  it('should support per-item scoring in diff validation', async () => {
    const fixture = {
      input: 'The quick brown fox jumps over the lazy dog',
      diff: {
        items: [
          { value: 'quick', added: true, score: 80 },
          { value: 'lazy', added: true, score: 20 }
        ],
        permissive: true
      },
      output: 'The quick brown fox jumps over the lazy dog',
      scoring: true,
      maxScore: 100
    }

    // Full match (whitelist items matched)
    const result = await runner.run('return-input', [{ ...fixture, input: 'The quick brown fox jumps over the lazy dog', output: 'The brown fox jumps over the dog' }])
    expect(result.logs[0].score).toBe(100)

    // Partial match
    const result2 = await runner.run('return-input', [{ ...fixture, input: 'The quick brown fox jumps over the dog', output: 'The brown fox jumps over the dog' }])
    // Only 'quick' matched. 80/(80+20) * 100 = 80
    expect(result2.logs[0].score).toBe(80)

    // Strict mode with unverified changes
    const fixtureStrict = {
      ...fixture,
      diff: {
        items: [
          { value: 'quick', added: true, score: 80 },
          { value: 'lazy', added: true, score: 20 }
        ],
        permissive: false
      }
    }
    const result3 = await runner.run('return-input', [{ ...fixtureStrict, input: 'The quick brown fox EXTRA jumps over the lazy dog', output: 'The brown fox jumps over the dog' }])
    // 'quick' and 'lazy' matched, but there is an 'EXTRA' unverified change.
    // Normalized weights: quick=0.8, lazy=0.2, strictness=1.0 (default for unassigned)
    // Wait, target was explicitSum + sWeight = 100 + 1 = 101? No, target = 100.
    // explicitSum = 80 + 20 = 100. target = 100.
    // remaining = 0. defaultWeight = 1.
    // finalWeights = [80, 20], sWeight = 1. total = 101.
    // quick = 80/101, lazy = 20/101, strictness = 1/101.
    // score = (80+20)/101 * 100 = 99.009...
    expect(result3.logs[0].score).toBeLessThan(100)
    expect(result3.logs[0].score).toBeGreaterThan(90)
  })

  it('should support unassigned Weight by default', async () => {
    const fixture = {
      input: { a: 'A', b: 'B' },
      output: {
        a: { $expect: 'A', score: 9 }, // explicit weight 9
        b: 'B'                         // unassigned
      },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(100)

    // Partial match: only the unassigned one matches
    const fixture2 = {
      ...fixture,
      input: { a: 'WRONG', b: 'B' }
    }
    const result2 = await runner.run('return-input', [fixture2])
    // b matches, weight is 100-9 = 91
    expect(result2.logs[0].score).toBe(91)
    const fixture3 = {
      ...fixture,
      unassignedWeight: 9,             // 这个不起作用，是因为还有剩下的分值
      input: { a: 'WRONG', b: 'B' }
    }
    const result3 = await runner.run('return-input', [fixture3])
    expect(result3.logs[0].score).toBe(91)

  })

  it('should support unassignedWeight configuration', async () => {
    const fixture = {
      input: { a: 'A', b: 'B', c: 'C' },
      output: {
        a: { $expect: 'A', score: 10 }, // explicit weight 9
        b: 'B',                         // unassigned
        c: 'C',
      },
      scoring: true,
      unassignedWeight: 1,
      maxScore: 10
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(10)

    // Partial match: only the unassigned one matches
    const fixture2 = {
      ...fixture,
      input: { a: 'WRONG', b: 'B' }
    }
    const result2 = await runner.run('return-input', [fixture2])
    expect(result2.logs[0].score).toBe(0.5)

    // With a different unassignedWeight
    const fixture3 = {
      ...fixture,
      unassignedWeight: 4,
      input: { a: 'WRONG', b: 'B' }
    }
    const result3 = await runner.run('return-input', [fixture3])
    expect(result3.logs[0].score).toBe(2)

    const fixture4 = {
      ...fixture,
      input: { a: 'WRONG', b: 'B', c: 'C' }
    }
    const result4 = await runner.run('return-input', [fixture4])
    expect(result4.logs[0].score).toBe(1)
  })

  it('should fail if a critical branch fails even with a high score', async () => {
    const fixture = {
      output: {
        important: { $expect: 'CRITICAL', score: { value: 10, critical: true } },
        optional: { $expect: 'YES', score: 90 }
      },
      input: { important: 'WRONG', optional: 'YES' },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    // score = 90 / (10+90) * 100 = 90
    expect(result.logs[0].score).toBe(90)
    // Even though 90 >= passScore(default 100), passed should be false because of critical branch
    expect(result.logs[0].passed).toBe(false)
    expect(result.logs[0].failedCritical!.some((f: any) => f.key === 'important')).toBe(true)
  })

  it('should support deep hierarchical scoring', async () => {
    const fixture = {
      output: {
        top: {
          $expect: {
            mid: {
              $expect: 'LEAF',
              score: 50 // 50% of mid
            },
            other: 'STUFF' // 50% of mid
          },
          score: 80 // 80% of top
        },
        side: 'BAR' // 20% of top
      },
      input: { top: { mid: 'LEAF', other: 'STUFF' }, side: 'BAR' },
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(100)

    // Partial match deep inside
    const fixture2 = {
      ...fixture,
      input: { top: { mid: 'WRONG', other: 'STUFF' }, side: 'BAR' }
    }
    const result2 = await runner.run('return-input', [fixture2])
    // top.other matches (40 pts) + side matches (20 pts) = 60
    // Calculation:
    // side = 1/(4+1) * 100 = 20
    // top = 4/5 * 100 = 80
    // top.mid = 1/2 * 80 = 40 (fails)
    // top.other = 1/2 * 80 = 40 (passes)
    expect(result2.logs[0].score).toBe(60)
  })

  it('should aggregate scores for logical operators', async () => {
    const fixture = {
      output: {
        $and: [
          { $expect: 'A', score: 70 },
          { $expect: 'B', score: 30 }
        ]
      },
      input: 'A', // Only A matches
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(70)

    const fixtureOr = {
      output: {
        $or: [
          { $expect: 'A', score: 40 },
          { $expect: 'B', score: 90 }
        ]
      },
      input: 'A', // Matches A (40)
      scoring: true,
      maxScore: 100
    }
    const resultOr = await runner.run('return-input', [fixtureOr])
    // $or takes the max score of matched branches
    expect(resultOr.logs[0].score).toBe(40)

    const resultOr2 = await runner.run('return-input', [{ ...fixtureOr, input: 'B' }])
    expect(resultOr2.logs[0].score).toBe(90)
  })

  it('should adapt to different scoring scales (0-1 vs 0-100)', async () => {
    // 0-1 scale
    const fixture1 = {
      output: {
        a: { $expect: 'A', score: 0.8 },
        b: { $expect: 'B', score: 0.2 }
      },
      input: 'A', // Error: output is object but input is string, but let's assume valid object input
      scoring: true,
      maxScore: 10
    }
    // Correcting input for object match
    const result1 = await runner.run('return-input', [{ ...fixture1, input: { a: 'A', b: 'WRONG' } }])
    expect(result1.logs[0].score).toBe(8)

    // 0-100 scale
    const fixture2 = {
      output: {
        a: { $expect: 'A', score: 80 },
        b: { $expect: 'B', score: 20 }
      },
      input: { a: 'A', b: 'WRONG' },
      scoring: true,
      maxScore: 10
    }
    const result2 = await runner.run('return-input', [fixture2])
    expect(result2.logs[0].score).toBe(8)
  })

  it('should default passScore to maxScore and fail if score is lower', async () => {
    const fixture = {
      output: {
        a: { $expect: 'A', score: 80 },
        b: { $expect: 'B', score: 20 }
      },
      input: { a: 'A', b: 'WRONG' },
      scoring: true,
      maxScore: 100
      // passScore is ABSENT, should default to 100
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(80)
    expect(result.logs[0].passed).toBe(false) // 80 < 100
  })

  it('should handle fully implicit scores (no maxScore, no passScore)', async () => {
    const fixture = {
      output: {
        a: { $expect: 'A', score: 3 },
        b: { $expect: 'B', score: 1 }
      },
      input: { a: 'A', b: 'WRONG' },
      scoring: true
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(75)
    expect(result.logs[0].maxScore).toBe(100)
    expect(result.logs[0].passed).toBe(false)
  })

  it('should respect global maxScore from runner options', async () => {
    const fixture = {
      output: { a: 'A' },
      input: { a: 'A' }
    }
    const result = await runner.run('return-input', [fixture], { maxScore: 50, scoring: true })
    expect(result.logs[0].score).toBe(50)
    expect(result.logs[0].maxScore).toBe(50)
  })

  it('should support unassignedWeight: 0 to ignore unlabelled items', async () => {
    const fixture = {
      output: {
        important: { $expect: 'A', score: 100 },
        extra: 'B'
      },
      input: { important: 'A', extra: 'WRONG' },
      scoring: true,
      unassignedWeight: 0,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBe(100)
    expect(result.logs[0].passed).toBe(true)
  })

  it('should handle adaptive scale with mixed fractional and large weights', async () => {
    const fixture = {
      output: {
        a: { $expect: 'A', score: 0.8 },
        b: { $expect: 'B', score: 20 }
      },
      input: { a: 'A', b: 'WRONG' },
      scoring: true
    }

    const result = await runner.run('return-input', [fixture])
    expect(result.logs[0].score).toBeCloseTo(80, 3)
  })

  it('should support scoring with explicit $diff operator', async () => {
    const fixture = {
      output: {
        $diff: {
          value: 'The brown fox jumps over the dog',
          items: [
            { value: 'quick', added: true, score: 80 },
            { value: 'lazy', added: true, score: 20 }
          ],
          permissive: true
        }
      },
      input: 'The quick brown fox jumps over the dog', // only 'quick' added
      scoring: true,
      maxScore: 100
    }

    const result = await runner.run('return-input', [fixture])
    // quick (80), lazy (20). Total = 100.
    // actual has 'quick', missing 'lazy'.
    // weight_quick = 80/100 * 100 = 80.
    expect(result.logs[0].score).toBe(80)
  })
})
