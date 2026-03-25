[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestFixtureResult

# Interface: AITestFixtureResult

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:261](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L261)

Summary result of running a set of test fixtures.

## Properties

### duration

> **duration**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:271](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L271)

Total wall-clock time for the entire run in milliseconds.

***

### failedCount

> **failedCount**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:263](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L263)

Total number of fixtures that failed validation.

***

### logs

> **logs**: [`AITestLogItem`](AITestLogItem.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:269](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L269)

Array of detailed logs for each executed fixture.

***

### passedCount

> **passedCount**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:265](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L265)

Total number of fixtures that passed validation.

***

### skippedCount

> **skippedCount**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:267](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L267)

Total number of fixtures that were skipped.
