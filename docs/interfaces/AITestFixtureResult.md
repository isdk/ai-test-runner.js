[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestFixtureResult

# Interface: AITestFixtureResult

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:93](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L93)

The overall result of running a set of AI test fixtures.

## Properties

### duration

> **duration**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:101](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L101)

Total duration of all tests in milliseconds.

***

### failedCount

> **failedCount**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:95](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L95)

Number of failed tests.

***

### logs

> **logs**: [`AITestLogItem`](AITestLogItem.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:99](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L99)

Detailed logs for each test.

***

### passedCount

> **passedCount**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:97](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L97)

Number of passed tests.
