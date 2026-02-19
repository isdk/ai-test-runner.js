import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor } from '../src/types.js'
import { join } from 'node:path'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'

describe('AITestRunner Operators', () => {
  const mockExecutor: AIScriptExecutor = {
    execute: vi.fn().mockImplementation(async (ctx) => {
      const { script, args } = ctx
      const input = args.input !== undefined ? args.input : args

      if (script === 'return-input' || script === 'echo') {
        return { output: input, messages: [] }
      }

      if (args.greeting && typeof args.greeting === 'string') {
        return { output: args.greeting, messages: [] }
      }
      if (args.val && typeof args.val === 'string') {
        return { output: args.val, messages: [] }
      }

      if (Array.isArray(input) || (typeof input === 'object' && input !== null)) {
        return { output: input, messages: [] }
      }

      return { output: 'console.log("hello")', messages: [] }
    }),
  }

  const absPath = join(tmpdir(), 'abs-operator.js')

  beforeAll(() => {
    writeFileSync(absPath, `
      export function checkAbs(actual) { return actual === 'abs' || 'not abs' }
      export default function(actual) { return actual === 'default' || 'not default' }
    `)
  })

  afterAll(() => {
    try { unlinkSync(absPath) } catch (e) {}
  })

  it('should support absolute paths in js:// protocol', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'abs',
        operators: { $abs: `js://${absPath}#checkAbs` },
        expect: { output: { $abs: true } }
      }
    ]
    // 使用 return-input 明确要求回显以测试路径加载机制
    const result = await runner.run('return-input', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support default export in js:// protocol', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'default',
        operators: { $def: `js://${absPath}` },
        expect: { output: { $def: true } }
      }
    ]
    const result = await runner.run('return-input', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should report correct path keys for nested operators', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: { user: { profile: { bio: 'short' } } },
        operators: {
          $longEnough: (actual: string) => actual.length > 10 || 'too short'
        },
        expect: {
          output: {
            user: {
              profile: {
                bio: { $longEnough: true }
              }
            }
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].key).toBe('output.user.profile.bio')
  })

  it('should use custom operators from options', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'test',
        expect: {
          output: {
            $myOp: 'hello'
          }
        }
      }
    ]

    const operators = {
      $myOp: (actual: any, expected: any) => actual.includes(expected) || 'mismatch'
    }

    const result = await runner.run('test-script', fixtures, { operators })
    expect(result.passedCount).toBe(1)
  })

  it('should use custom operators from fixture', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'test',
        operators: {
          $myOp: (actual: any, expected: any) => actual.includes(expected) || 'mismatch'
        },
        expect: {
          output: {
            $myOp: 'hello'
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail when custom operator returns error message', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'test',
        operators: {
          $myOp: () => 'custom error'
        },
        expect: {
          output: {
            $myOp: 'anything'
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].message).toBe('custom error')
  })

  it('should load operators using js:// protocol', async () => {
    const runner = new AITestRunner(mockExecutor)
    const baseDir = join(process.cwd(), 'test', 'op-assets')
    const fixtures = [
      {
        input: 'test',
        operators: {
          $check: 'js://./dummy-operator.js#checkCode'
        },
        options: { lang: 'ts' },
        expect: {
          output: {
            $check: { strict: true }
          }
        }
      }
    ]

    // This should fail because mock output doesn't have ':' for TS
    const result = await runner.run('test-script', fixtures, { baseDir })
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].message).toBe('TypeScript requires type annotations')
  })

  it('should support default export with js:// protocol', async () => {
    const runner = new AITestRunner(mockExecutor)
    const baseDir = join(process.cwd(), 'test', 'op-assets')
    const fixtures = [
      {
        input: 'test',
        operators: {
          $equal: 'js://./dummy-operator.js'
        },
        expect: {
          output: {
            $equal: 'console.log("hello")'
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures, { baseDir })
    expect(result.passedCount).toBe(1)
  })

  it('should not override built-in operators by default', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: ['a', 'b'],
        operators: {
          $contains: () => true // Always pass
        },
        expect: {
          output: {
            $contains: 'c' // Built-in $contains will fail
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.failedCount).toBe(1)
  })

  it('should override built-in operators if allowOperatorOverride is true', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: ['a', 'b'],
        allowOperatorOverride: true,
        operators: {
          $contains: () => true // Always pass
        },
        expect: {
          output: {
            $contains: 'c'
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support async custom operators', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'console.log("test")',
        operators: {
          $asyncOp: async (actual: string) => {
            await new Promise(resolve => setTimeout(resolve, 10))
            return actual.includes('console') || 'should contain console'
          }
        },
        expect: {
          output: { $asyncOp: true }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should pass rendered data and original fixture to operator', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: { name: 'world' },
        operators: {
          $checkContext: (actual: any, expected: any, fixture: any) => {
            // fixture.$data should have rendered template data
            if (fixture.$data.greeting !== 'hello world') return 'Template not rendered'
            // fixture.input should have original input
            if (fixture.input.name !== 'world') return 'Original input missing'
            return true
          }
        },
        greeting: 'hello {{name}}',
        expect: {
          output: { $checkContext: true }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should work in deep nested structures (e.g., messages)', async () => {
    const complexExecutor: AIScriptExecutor = {
      execute: vi.fn().mockResolvedValue({
        output: 'ok',
        messages: [
          { role: 'assistant', content: 'thought...', metadata: { code: '123' } }
        ]
      }),
    }
    const runner = new AITestRunner(complexExecutor)
    const fixtures = [
      {
        input: 'test',
        operators: {
          $matchCode: (actual: any, expected: any) => actual === expected || `Code ${actual} != ${expected}`
        },
        expect: {
          messages: {
            $contains: {
              metadata: {
                code: { $matchCode: '123' }
              }
            }
          }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should throw error before run if js:// path is invalid', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [{ input: 'test', expect: { output: 'test' } }]
    const options = {
      operators: { $fail: 'js://./non-existent.js' },
      baseDir: process.cwd()
    }

    await expect(runner.run('test-script', fixtures, options)).rejects.toThrow()
  })

  it('should allow fixture-level operators to override global operators', async () => {
    const runner = new AITestRunner(mockExecutor)
    const globalOperators = {
      $op: () => 'global error'
    }
    const fixtures = [
      {
        input: 'test',
        operators: {
          $op: () => true
        },
        expect: {
          output: { $op: true }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures, { operators: globalOperators })
    expect(result.passedCount).toBe(1)
  })

  it('should render templates in operator arguments', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: { val: 'hello' },
        operators: {
          $check: (actual: string, expected: string) => actual.includes(expected) || `Expected to include ${expected}`
        },
        expect: {
          output: { $check: '{{val}}' }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support not: true with custom operators', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'test',
        not: true,
        operators: {
          $fail: () => 'failed'
        },
        expect: {
          output: { $fail: true }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.passedCount).toBe(1) // not: true makes it pass if it fails
  })

  it('should support recursive validation via fixture.$validate', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: ['apple', 'banana'],
        operators: {
          $eachStartsWith: async (actual: any[], expected: string, fixture: any) => {
            for (const item of actual) {
              const failures = await fixture.$validate(item, new RegExp(`^${expected}`))
              if (failures.length > 0) return `Item ${item} does not start with ${expected}`
            }
            return true
          }
        },
        expect: {
          output: { $eachStartsWith: 'a' }
        }
      }
    ]

    const result = await runner.run('test-script', fixtures)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].message).toContain('banana')
  })

  it('should inherit operators from fixtureConfig', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtureConfig = {
      operators: { $configOp: (actual: any) => actual === 'config' || 'not config' }
    }
    const fixtures = [
      { input: 'config', expect: { output: { $configOp: true } } }
    ]

    const result = await runner.run('return-input', fixtures, { fixtureConfig })
    expect(result.passedCount).toBe(1)
  })

  it('should support standard 4-argument operators via js://', async () => {
    // Manually create a standard operator file
    const stdOpPath = join(tmpdir(), 'std-op.js')
    writeFileSync(stdOpPath,  `
      export function stdOp(actual, expected, ctx, validateMatch) {
        if (actual !== expected) {
          ctx.addFailure({ message: 'std mismatch', actual, expected })
        }
        return ctx.failures
      }
    `)

    const runner = new AITestRunner(mockExecutor)
    const fixtures = [
      {
        input: 'hello',
        operators: { $std: `js://${stdOpPath}#stdOp` },
        expect: { output: { $std: 'hello' } }
      }
    ]

    try {
      const result = await runner.run('return-input', fixtures)
      expect(result.passedCount).toBe(1)
    } finally {
      try { unlinkSync(stdOpPath) } catch (e) {}
    }
  })

  it('should resolve relative paths with ../ in operators', async () => {
    const runner = new AITestRunner(mockExecutor)
    const baseDir = join(process.cwd(), 'test', 'op-assets', 'subdir')
    const fixtures = [
      {
        input: 'abs',
        operators: { $rel: 'js://../dummy-operator.js#checkCode' },
        expect: { output: { $rel: true } }
      }
    ]

    const result = await runner.run('return-input', fixtures, { baseDir })
    expect(result.passedCount).toBe(1)
  })

  it('should support simplified protocol (no js://)', async () => {
    const runner = new AITestRunner(mockExecutor)
    const baseDir = join(process.cwd(), 'test', 'op-assets')
    const fixtures = [
      {
        input: 'abs',
        operators: { $rel: './dummy-operator.js#checkCode' },
        expect: { output: { $rel: true } }
      }
    ]

    const result = await runner.run('return-input', fixtures, { baseDir })
    expect(result.passedCount).toBe(1)
  })

    it('should support loading from npm packages (bare specifiers)', async () => {
      const runner = new AITestRunner(mockExecutor)
      const fixtures = [
        {
          input: { a: 1 },
          operators: {
            $eq: 'lodash-es#isEqual'
          },
          expect: { output: { $eq: { a: 1 } } }
        }
      ]

      const result = await runner.run('return-input', fixtures)
      expect(result.passedCount).toBe(1)
    })
  })

