[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIScriptExecutor

# Interface: AIScriptExecutor

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:122](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L122)

Interface for components capable of executing AI scripts or interacting with LLMs.
Custom executors (e.g., for LangChain, OpenAI, or local models) must implement this.

## Methods

### execute()

> **execute**(`context`): `Promise`\<[`AIExecutionResult`](AIExecutionResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:129](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L129)

Executes an AI script within the provided context.

#### Parameters

##### context

[`AIExecutionContext`](AIExecutionContext.md)

The execution context including script and arguments.

#### Returns

`Promise`\<[`AIExecutionResult`](AIExecutionResult.md)\>

A promise resolving to the execution result.
