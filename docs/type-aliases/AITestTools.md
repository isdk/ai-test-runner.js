[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestTools

# Type Alias: AITestTools

> **AITestTools** = `boolean` \| [`AITestTool`](AITestTool.md) \| [`AITestTool`](AITestTool.md)[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:351](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L351)

Configuration for tool usage in test fixtures.

- `true`: Automatically use the current script as the tool.
- `string`: A single tool ID or filename.
- `Record<string, any>`: A single tool definition object.
- `Array`: A collection of tool IDs or objects.
