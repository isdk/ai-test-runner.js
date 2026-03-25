[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIExecutionContext

# Interface: AIExecutionContext

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:87](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L87)

The execution context passed to an `AIScriptExecutor`.
Contains all necessary information to run an AI script or agent.

## Properties

### args

> **args**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:94](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L94)

Arguments and variables to be injected into the script.
These are typically resolved from templates.

***

### options?

> `optional` **options**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:98](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L98)

Additional execution-level options (e.g., model parameters, temperature).

***

### script

> **script**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:89](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L89)

The identifier or content of the script/prompt to be executed.
