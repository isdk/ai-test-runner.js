[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIScriptExecutor

# Interface: AIScriptExecutor

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:36](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L36)

Interface for components that can execute AI scripts.

## Methods

### execute()

> **execute**(`context`): `Promise`\<[`AIExecutionResult`](AIExecutionResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:43](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L43)

Executes an AI script with the given context.

#### Parameters

##### context

[`AIExecutionContext`](AIExecutionContext.md)

The execution context.

#### Returns

`Promise`\<[`AIExecutionResult`](AIExecutionResult.md)\>

A promise that resolves to the execution result.
