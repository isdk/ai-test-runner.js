[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIExecutionResult

# Interface: AIExecutionResult

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:104](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L104)

The result returned by an `AIScriptExecutor`.

## Properties

### messages?

> `optional` **messages?**: `any`[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:113](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L113)

The full interaction history or execution trace, often used for complex assertions
like validating tool call sequences.

***

### meta?

> `optional` **meta?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:115](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L115)

***

### output

> **output**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:108](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L108)

The primary output produced by the script (e.g., a generated string or a structured object).
