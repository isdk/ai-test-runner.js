[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestFixtureResult

# Interface: AITestFixtureResult

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:265](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L265)

Summary result of running a set of test fixtures.

## Properties

### duration

> **duration**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:275](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L275)

Total wall-clock time for the entire run in milliseconds.

***

### failedCount

> **failedCount**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:267](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L267)

Total number of fixtures that failed validation.

***

### logs

> **logs**: [`AITestLogItem`](AITestLogItem.md)[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:273](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L273)

Array of detailed logs for each executed fixture.

***

### passedCount

> **passedCount**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:269](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L269)

Total number of fixtures that passed validation.

***

### skippedCount

> **skippedCount**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:271](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L271)

Total number of fixtures that were skipped.
