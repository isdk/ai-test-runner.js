import { describe, it, expect, vi } from 'vitest'
import { AITestRunner } from '../src/ai-test-runner.js'
import { AIScriptExecutor } from '../src/types.js'

describe('AITestRunner tools: true', () => {
  const mockExecutor: AIScriptExecutor = {
    execute: vi.fn().mockResolvedValue({ output: 'done' }),
  }

  it('should support tools: true by using script name as tool', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [{ input: 'test', tools: true }]

    await runner.run('my-tool.ai.yaml', fixtures)

    expect(mockExecutor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        script: 'toolTester',
        args: expect.objectContaining({
          tools: ['my-tool.ai.yaml']
        })
      })
    )
  })

  it('should support tools as a single string', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [{ input: 'test', tools: 'other-tool' }]

    await runner.run('my-tool.ai.yaml', fixtures)

    expect(mockExecutor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        script: 'toolTester',
        args: expect.objectContaining({
          tools: ['other-tool']
        })
      })
    )
  })

  it('should throw error if tools: true and script is source code', async () => {
    const runner = new AITestRunner(mockExecutor)
    const fixtures = [{ input: 'test', tools: true }]

    const result = await runner.run('{{ some code }}', fixtures)
    expect(result.logs[0].error.message).toContain(`Cannot use 'tools: true' when script is source code`)
  })

    it('should use toolTester from config if provided', async () => {
      const runner = new AITestRunner(mockExecutor)
      const fixtures = [{ input: 'test', tools: true, toolTester: 'customTester' }]

      await runner.run('my-tool.ai.yaml', fixtures)

      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          script: 'customTester'
        })
      )
    })

    it('should support tools: true in fixtureConfig', async () => {
      const runner = new AITestRunner(mockExecutor)
      const fixtures = [{ input: 'test' }]

      await runner.run('global-tool.ai.yaml', fixtures, {
        fixtureConfig: { tools: true }
      })

      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.objectContaining({
            tools: ['global-tool.ai.yaml']
          })
        })
      )
    })

    it('should allow overriding global tools: true with tools: false', async () => {
      const runner = new AITestRunner(mockExecutor)
      const fixtures = [{ input: 'test', tools: false }]

      await runner.run('global-tool.ai.yaml', fixtures, {
        fixtureConfig: { tools: true }
      })

      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          script: 'global-tool.ai.yaml'
        })
      )
    })

    it('should support a single tool object', async () => {
      const runner = new AITestRunner(mockExecutor)
      const toolObj = { name: 'calc', description: 'test' }
      const fixtures = [{ input: 'test', tools: toolObj }]

      await runner.run('script.ai.yaml', fixtures)

      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.objectContaining({
            tools: [toolObj]
          })
        })
      )
    })

    it('should use script defined in fixture for tools: true', async () => {
      const runner = new AITestRunner(mockExecutor)
      const fixtures = [{ input: 'test', script: 'fixture-tool.ai.yaml', tools: true }]

      await runner.run('default.ai.yaml', fixtures)

      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.objectContaining({
            tools: ['fixture-tool.ai.yaml']
          })
        })
      )
    })
  })
