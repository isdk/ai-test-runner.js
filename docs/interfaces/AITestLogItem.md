[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestLogItem

# Interface: AITestLogItem

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:196](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L196)

Detailed log entry for a single test fixture execution.

## Properties

### actual

> **actual**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:214](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L214)

The actual output produced by the executor.

***

### actualTrace?

> `optional` **actualTrace**: `any`[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:242](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L242)

The full interaction history or execution trace (from AIExecutionResult.messages).
Useful for debugging tool calls and message sequences.

***

### duration

> **duration**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:233](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L233)

The duration of this specific test execution in milliseconds.

***

### error?

> `optional` **error**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:227](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L227)

Any technical error that occurred during the execution process.

***

### expected

> **expected**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:216](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L216)

The expected output or matcher used for validation.

***

### expectedSchema?

> `optional` **expectedSchema**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:223](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L223)

The JSON schema used for validation, if any.

***

### expectedTrace?

> `optional` **expectedTrace**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:246](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L246)

The resolved and formatted expectation for the execution trace (from AITestFixture.expect).

***

### failedCritical?

> `optional` **failedCritical**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:210](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L210)

A list of validation failures that were marked as 'critical' but failed.

***

### failures?

> `optional` **failures**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:225](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L225)

A list of specific validation failures if the test did not pass.

***

### i

> **i**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:231](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L231)

The 0-based index of the fixture in the input array.

***

### input

> **input**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:212](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L212)

The resolved input provided to the AI script.

***

### maxScore?

> `optional` **maxScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:206](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L206)

The maximum possible score for this test.

***

### not?

> `optional` **not**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:235](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L235)

Whether the test expectation was negated (passes if validation fails).

***

### passed

> **passed**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:200](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L200)

True if all validations passed for this fixture.

***

### passScore?

> `optional` **passScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:208](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L208)

The minimum score required for the test to pass.

***

### reason?

> `optional` **reason**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:221](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L221)

Extracted reasoning or explanation from the AI output, if available
(e.g., from a 'reasoning' field in JSON).

***

### score?

> `optional` **score**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:202](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L202)

The final calculated score (0.0 to maxScore).

***

### scoreDetails?

> `optional` **scoreDetails**: `any`[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:204](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L204)

Detailed breakdown of scores for each validation item.

***

### script?

> `optional` **script**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:237](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L237)

The specific script ID or source code executed.

***

### skipped?

> `optional` **skipped**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:229](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L229)

Whether the test was skipped.

***

### title?

> `optional` **title**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:198](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L198)

The name of the test fixture.

***

### tools?

> `optional` **tools**: `any`[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:250](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L250)

The final set of tools provided to the executor after resolving IDs and 'tools: true'.

***

### vars?

> `optional` **vars**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:255](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L255)

The final resolved template data (variables) used during execution and validation.
Inclusion depends on `AITestRunnerOptions.logVars`.
