[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestTools

# Type Alias: AITestTools

> **AITestTools** = `boolean` \| [`AITestTool`](AITestTool.md) \| [`AITestTool`](AITestTool.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:347](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/types.ts#L347)

Configuration for tool usage in test fixtures.

- `true`: Automatically use the current script as the tool.
- `string`: A single tool ID or filename.
- `Record<string, any>`: A single tool definition object.
- `Array`: A collection of tool IDs or objects.
