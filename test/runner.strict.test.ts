import { describe, it, expect } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult } from '../src/types.js'

class SimpleExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    return { output: context.args.output }
  }
}

describe('AITestRunner Strict/Partial Matching', () => {
  const executor = new SimpleExecutor()
  const runner = new AITestRunner(executor)

  describe('Object Matching', () => {
    it('should pass partial object match by default', async () => {
      const fixtures = [{
        input: { output: { a: 1, b: 2, c: 3 } },
        output: { a: 1, b: 2 }
      }]
      const result = await runner.run('test', fixtures)
      expect(result.passedCount).toBe(1)
    })

    it('should fail strict object match if extra keys exist', async () => {
      const fixtures = [{
        input: { output: { a: 1, b: 2, c: 3 } },
        output: { a: 1, b: 2 },
        strict: 'object'
      }]
      const result = await runner.run('test', fixtures)
      expect(result.passedCount).toBe(0)
      expect(result.logs[0].failures![0].message).toContain('Extra key')
    })
  })

    describe('Diff Matching', () => {
      const original = "Hello World"
      const actual = "Hello\nBeautiful World!"
      // Diffs:
      // - "Hello" (common)
      // - "\nBeautiful" (added)
      // - " World" (common)
      // - "!" (added)

      it('should pass partial diff match if specified items are found', async () => {
        const fixtures = [{
          input: { output: actual, diffPermissive: true },
          output: original,
          diff: [
              { value: "\nBeautiful", added: true }
          ]
        }]
        const result = await runner.run('test', fixtures)
        // Permissive mode: "!" is ignored, only "\nBeautiful" is checked
        expect(result.passedCount).toBe(1)
      })

      it('should fail strict diff match if unverified changes exist', async () => {
        const fixtures = [{
          input: { output: actual },
          output: original,
          diff: [
              { value: "\nBeautiful", added: true }
          ],
          strict: 'diff'
        }]
        const result = await runner.run('test', fixtures)
        // Strict mode: "!" is unverified, so it fails
        expect(result.passedCount).toBe(0)
        expect(result.logs[0].failures![0].message).toContain('unverified changes')
      })
      it('should fail if expected diff item is NOT found (even in partial mode)', async () => {
      const fixtures = [{
        input: { output: "Hello World" },
        output: "Hello World", // Identical strings
        diff: [
            { value: "Extra", added: true, required: true } // This item won't be found in identical strings
        ]
      }]
      const result = await runner.run('test', fixtures)
      // Result should be FAILED because "Extra" was not added
      expect(result.passedCount).toBe(0)
      expect(result.logs[0].failures![0].message).toContain('missing required diff items')
    })
  })
})