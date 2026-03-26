[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIScriptExecutor

# Interface: AIScriptExecutor

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:120](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/types.ts#L120)

Interface for components capable of executing AI scripts or interacting with LLMs.
Custom executors (e.g., for LangChain, OpenAI, or local models) must implement this.

## Methods

### execute()

> **execute**(`context`): `Promise`\<[`AIExecutionResult`](AIExecutionResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:127](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/types.ts#L127)

Executes an AI script within the provided context.

#### Parameters

##### context

[`AIExecutionContext`](AIExecutionContext.md)

The execution context including script and arguments.

#### Returns

`Promise`\<[`AIExecutionResult`](AIExecutionResult.md)\>

A promise resolving to the execution result.
