[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestLogItem

# Interface: AITestLogItem

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:198](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L198)

Detailed log entry for a single test fixture execution.

## Properties

### actual

> **actual**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:216](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L216)

The actual output produced by the executor.

***

### actualMeta?

> `optional` **actualMeta?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:259](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L259)

***

### actualTrace?

> `optional` **actualTrace?**: `any`[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:244](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L244)

The full interaction history or execution trace (from AIExecutionResult.messages).
Useful for debugging tool calls and message sequences.

***

### duration

> **duration**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:235](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L235)

The duration of this specific test execution in milliseconds.

***

### error?

> `optional` **error?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:229](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L229)

Any technical error that occurred during the execution process.

***

### expected

> **expected**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:218](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L218)

The expected output or matcher used for validation.

***

### expectedSchema?

> `optional` **expectedSchema?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:225](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L225)

The JSON schema used for validation, if any.

***

### expectedTrace?

> `optional` **expectedTrace?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:248](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L248)

The resolved and formatted expectation for the execution trace (from AITestFixture.expect).

***

### failedCritical?

> `optional` **failedCritical?**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:212](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L212)

A list of validation failures that were marked as 'critical' but failed.

***

### failures?

> `optional` **failures?**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:227](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L227)

A list of specific validation failures if the test did not pass.

***

### i

> **i**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:233](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L233)

The 0-based index of the fixture in the input array.

***

### input

> **input**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:214](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L214)

The resolved input provided to the AI script.

***

### maxScore?

> `optional` **maxScore?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:208](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L208)

The maximum possible score for this test.

***

### not?

> `optional` **not?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:237](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L237)

Whether the test expectation was negated (passes if validation fails).

***

### passed

> **passed**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:202](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L202)

True if all validations passed for this fixture.

***

### passScore?

> `optional` **passScore?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:210](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L210)

The minimum score required for the test to pass.

***

### reason?

> `optional` **reason?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:223](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L223)

Extracted reasoning or explanation from the AI output, if available
(e.g., from a 'reasoning' field in JSON).

***

### score?

> `optional` **score?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:204](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L204)

The final calculated score (0.0 to maxScore).

***

### scoreDetails?

> `optional` **scoreDetails?**: `any`[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:206](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L206)

Detailed breakdown of scores for each validation item.

***

### script?

> `optional` **script?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:239](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L239)

The specific script ID or source code executed.

***

### skipped?

> `optional` **skipped?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:231](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L231)

Whether the test was skipped.

***

### title?

> `optional` **title?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:200](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L200)

The name of the test fixture.

***

### tools?

> `optional` **tools?**: `any`[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:252](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L252)

The final set of tools provided to the executor after resolving IDs and 'tools: true'.

***

### vars?

> `optional` **vars?**: `Record`\<`string`, `any`\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:257](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L257)

The final resolved template data (variables) used during execution and validation.
Inclusion depends on `AITestRunnerOptions.logVars`.
