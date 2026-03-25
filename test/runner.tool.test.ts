import { vitest, it, expect, describe } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor } from '../src/types.js'

describe('AITestRunner Tool Testing', () => {
  it('should support tool testing with expect.tools sugar ($all)', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: 'The result is 6',
        messages: [
          { role: 'user', content: 'calculate 2+4' },
          { role: 'assistant', tools: [{ name: 'calculator', args: { a: 2, b: 4 }, result: 6 }] },
          { role: 'assistant', content: 'The result is 6' }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'calculate 2+4',
        tools: ['calculator'],
        expect: {
          tools: [
            { name: 'calculator', args: { a: 2, b: 4 } }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
    expect(result.failedCount).toBe(0)
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      args: expect.objectContaining({ tools: ['calculator'] })
    }))
  })

  it('should support $sequence operator in expect.tools', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: 'Done',
        messages: [
          { role: 'assistant', tools: [{ name: 'step1' }] },
          { role: 'assistant', tools: [{ name: 'step2' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'do steps',
        expect: {
          tools: {
            $sequence: [
              { name: 'step1' },
              { name: 'step2' }
            ]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail if tool call order is wrong in $sequence', async () => {
     const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: 'Done',
        messages: [
          { role: 'assistant', tools: [{ name: 'step2' }] },
          { role: 'assistant', tools: [{ name: 'step1' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'do steps',
        expect: {
          tools: {
            $sequence: [
              { name: 'step1' },
              { name: 'step2' }
            ]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(0)
    expect(result.failedCount).toBe(1)
  })

  it('should use toolTester when tools are present', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'ok' })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        tools: ['calc'],
        toolTester: 'my-tester.ai.yaml'
      }
    ]

    await runner.run('calc.ai.yaml', fixtures)
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      script: 'my-tester.ai.yaml'
    }))
  })

  it('should support templates in expect.tools', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'greet', args: { name: 'Alice' } }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: { user_name: 'Alice' },
        expect: {
          tools: [
            { name: 'greet', args: { name: '{{user_name}}' } }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support complex multi-step interaction with $sequence', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'user', content: 'Where am I and what is the weather?' },
          { role: 'assistant', content: 'Let me check your location first.' },
          { role: 'assistant', tools: [{ name: 'get_location', args: {} }] },
          { role: 'assistant', content: 'You are in Shanghai. Now checking weather.' },
          { role: 'assistant', tools: [{ name: 'get_weather', args: { loc: 'Shanghai' } }] },
          { role: 'assistant', content: 'It is sunny in Shanghai.' }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'check location and weather',
        expect: {
          messages: {
            $sequence: [
              { role: 'assistant', content: /check.*location/ },
              { tools: { $contains: { name: 'get_location' } } },
              { role: 'assistant', content: /Shanghai/ },
              { tools: { $contains: { name: 'get_weather', args: { loc: 'Shanghai' } } } }
            ]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail when $all conditions are not met', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'tool_a' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'call both',
        expect: {
          tools: [
            { name: 'tool_a' },
            { name: 'tool_b' }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
  })

  it('should support nested operators ($sequence containing $all)', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'login' }] },
          { role: 'assistant', tools: [{ name: 'op1' }, { name: 'op2' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'login and do ops',
        expect: {
          messages: {
            $sequence: [
              { tools: { $contains: { name: 'login' } } },
              {
                tools: {
                  $all: [
                    { name: 'op1' },
                    { name: 'op2' }
                  ]
                }
              }
            ]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should override front-matter tools in individual fixture', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'normal' })
    }
    const runner = new AITestRunner(executor)
    const fixtureConfig = {
      tools: ['global-tool'],
      toolTester: 'global-tester.ai.yaml'
    }
    const fixtures = [
      {
        input: 'test',
        tools: [] // Override to disable tool mode
      }
    ]

    await runner.run('script.ai.yaml', fixtures, { fixtureConfig })
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      script: 'script.ai.yaml'
    }))
  })

  it('should fail in strict mode if extra fields are present in messages', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', content: 'hello', extra: 'unexpected' }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'hi',
        strict: 'object',
        expect: {
          messages: {
            $contains: { role: 'assistant', content: 'hello' }
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
  })

  it('should support mixed output and expect validation', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: 'Final Answer',
        messages: [{ role: 'assistant', tools: [{ name: 'check' }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'go',
        output: 'Final Answer',
        expect: {
          messages: { $contains: { tools: { $contains: { name: 'check' } } } }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail gracefully if messages are missing when expected', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'no messages here' })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        expect: {
          messages: { $contains: { role: 'assistant' } }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].message).toContain('check failed')
  })

  it('should use default "toolTester" name if not specified but tools present', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'ok' })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [{ input: 'test', tools: ['calc'] }]

    await runner.run('my-func.ai.yaml', fixtures)
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      script: 'toolTester'
    }))
  })

  it('should support explicit $all in expect.tools sugar', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', tools: [{ name: 'a' }, { name: 'b' }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'do both',
        expect: {
          tools: {
            $all: [{ name: 'a' }, { name: 'b' }]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should pass $sequence with non-contiguous matches', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'first' }] },
          { role: 'assistant', content: 'thinking...' }, // Noise
          { role: 'assistant', tools: [{ name: 'second' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'steps',
        expect: {
          tools: { $sequence: [{ name: 'first' }, { name: 'second' }] }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail in strict array mode if length differs', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: [1, 2, 3]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'list',
        strict: 'array',
        output: [1, 2]
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].message).toContain('Array length mismatch')
  })

  it('should correctly format deep templates in expect', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', tools: [{ name: 'test', args: { val: 'nested-val' } }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: { outer: { inner: 'nested-val' } },
        expect: {
          messages: {
            $contains: {
              tools: {
                $contains: { name: 'test', args: { val: '{{outer.inner}}' } }
              }
            }
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support negation with expect using "not: true"', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', tools: [{ name: 'wrong_tool' }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        not: true,
        expect: {
          tools: [{ name: 'expected_tool' }]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1) // Passed because it did NOT match
  })

  it('should support variables in the tools list', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'ok' })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: { tool_name: 'dynamic_tool' },
        tools: ['{{tool_name}}']
      }
    ]

    await runner.run('test.ai.yaml', fixtures)
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      args: expect.objectContaining({ tools: ['dynamic_tool'] })
    }))
  })

  it('should match tool results in expect', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          {
            role: 'assistant',
            tools: [{ name: 'calculator', args: { a: 1, b: 2 }, result: 3 }]
          }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: '1+2',
        expect: {
          tools: [{ name: 'calculator', result: 3 }]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should handle multiple tools in a single message', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          {
            role: 'assistant',
            tools: [
              { name: 'tool1', args: { id: 1 } },
              { name: 'tool2', args: { id: 2 } }
            ]
          }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'call both',
        expect: {
          tools: [
            { name: 'tool1' },
            { name: 'tool2' }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail if $sequence is not met even if all tools are present out of order', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'tool2' }] },
          { role: 'assistant', tools: [{ name: 'tool1' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'ordered',
        expect: {
          tools: {
            $sequence: [{ name: 'tool1' }, { name: 'tool2' }]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
  })

  it('should support JsonSchema in tools matching', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'calc', args: { a: 10, b: 20 } }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'calc',
        expect: {
          tools: [
            {
              name: 'calc',
              args: {
                a: { type: 'number', minimum: 5 }
              }
            }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should aggregate tools across multiple assistant messages', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          { role: 'assistant', tools: [{ name: 'tool1' }] },
          { role: 'assistant', content: 'intermediate' },
          { role: 'assistant', tools: [{ name: 'tool2' }] }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'both',
        expect: {
          tools: [
            { name: 'tool1' },
            { name: 'tool2' }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support deep partial match in tool args', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          {
            role: 'assistant',
            tools: [
              {
                name: 'complex',
                args: {
                  user: { id: 1, profile: { name: 'Bob', age: 30 } },
                  tags: ['a', 'b']
                }
              }
            ]
          }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'complex',
        expect: {
          tools: [
            {
              name: 'complex',
              args: {
                user: { profile: { name: 'Bob' } }
              }
            }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should handle empty tools expectation', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', content: 'no tools' }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'nothing',
        expect: {
          messages: {
            $contains: { role: 'assistant', tools: undefined }
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support regex keys in objects (useful for ISDK dynamic tool keys)', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: {
          ' @weather(location="Shanghai")': { name: 'weather', result: 'sunny' }
        }
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'weather',
        output: {
          '/@weather/': { name: 'weather' }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support regex keys in strict mode', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: {
          'dynamic_123': 'value'
        }
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        strict: 'object',
        output: {
          '/^dynamic_/': 'value'
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1) // Should not fail for extra key because regex matched it
  })

  it('should support multiple levels of nesting with $contains', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [
          {
            role: 'assistant',
            tools: [
              { name: 't1', args: { items: [{ id: 'target' }, { id: 'other' }] } }
            ]
          }
        ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        expect: {
          messages: {
            $contains: {
              tools: {
                $contains: {
                  args: {
                    items: { $contains: { id: 'target' } }
                  }
                }
              }
            }
          }
        }
      }
    ]
    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support dynamic regex keys via templates', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: { 'user_123_data': 'ok' }
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: { id: '123' },
        output: {
          '/^user_{{id}}_/': 'ok'
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should provide clear failure messages for $sequence mismatches', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', tools: [{ name: 'only_one' }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        expect: {
          tools: {
            $sequence: [{ name: 'only_one' }, { name: 'missing_one' }]
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
    const failure = result.logs[0].failures![0]
    expect(failure.message).toContain('$sequence mismatch')
    expect(failure.message).toContain('item at index 1 not found')
  })

  it('should support deep nesting: $sequence containing $sequence', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: [ [1, 2], [3, 4], [5, 6] ]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'nested',
        output: {
          $sequence: [
            { $sequence: [1, 2] },
            { $sequence: [5, 6] }
          ]
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should handle $all with multiple identical requirements', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: ['a', 'b']
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        output: {
          $all: ['a', 'a', 'b']
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support $not operator to ensure a tool was NOT called', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', tools: [{ name: 'allowed_tool' }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        expect: {
          messages: {
            $not: { $contains: { tools: { $contains: { name: 'forbidden_tool' } } } }
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should fail if $not operator matches the actual value', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        messages: [{ role: 'assistant', tools: [{ name: 'forbidden_tool' }] }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        expect: {
          messages: {
            $not: { $contains: { tools: { $contains: { name: 'forbidden_tool' } } } }
          }
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.failedCount).toBe(1)
    expect(result.logs[0].failures![0].message).toContain('$not mismatch')
  })

  it('should support $not with simple values', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'error' })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'test',
        output: { $not: 'success' }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should respect "only" flag', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'ok' })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      { input: 'skip me', only: false },
      { input: 'run me', only: true }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
    expect(executor.execute).toHaveBeenCalledTimes(1)
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      args: expect.objectContaining({ input: 'run me' })
    }))
  })

  it('should use fixtureConfig.script as default', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({ output: 'ok' })
    }
    const runner = new AITestRunner(executor)
    const fixtureConfig = { script: 'config-default.ai.yaml' }
    const fixtures = [{ input: 'test' }]

    await runner.run('param-script.ai.yaml', fixtures, { fixtureConfig })
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      script: 'config-default.ai.yaml'
    }))
  })

  it('should support "expect" as a custom validation function', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: '42',
        messages: [{ role: 'assistant', content: 'thinking...' }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'query',
        expect: (actual: any) => {
          if (actual.output !== '42') return 'output mismatch'
          if (!actual.messages || actual.messages.length === 0) return 'missing messages'
          return true
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(1)
  })

  it('should support "expect" as a custom validation function 2', async () => {
    const executor: AIScriptExecutor = {
      execute: vitest.fn().mockResolvedValue({
        output: '43',
        messages: [{ role: 'assistant', content: 'thinking...' }]
      })
    }
    const runner = new AITestRunner(executor)
    const fixtures = [
      {
        input: 'query',
        expect: (actual: any) => {
          if (actual.output !== '42') return 'output mismatch'
          if (!actual.messages || actual.messages.length === 0) return 'missing messages'
          return true
        }
      }
    ]

    const result = await runner.run('test.ai.yaml', fixtures)
    expect(result.passedCount).toBe(0)
    expect(result.logs[0].failures![0].message).toContain('output mismatch')
  })
})
