[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestLogItem

# Interface: AITestLogItem

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:65](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L65)

Represents a single log item for an AI test.

## Properties

### actual

> **actual**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:71](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L71)

The actual output produced.

***

### duration

> **duration**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:85](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L85)

The duration of the test in milliseconds.

***

### error?

> `optional` **error**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:81](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L81)

Any error that occurred during execution.

***

### expected

> **expected**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:73](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L73)

The expected output.

***

### expectedSchema?

> `optional` **expectedSchema**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:77](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L77)

The JSON schema used for expectation validation, if any.

***

### failures?

> `optional` **failures**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:79](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L79)

A list of validation failures, if the test failed.

***

### i

> **i**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:83](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L83)

The index of the test fixture.

***

### input

> **input**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:69](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L69)

The input provided to the test.

***

### not?

> `optional` **not**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:87](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L87)

Whether the test expectation was negated.

***

### passed

> **passed**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:67](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L67)

Whether the test passed or failed.

***

### reason?

> `optional` **reason**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:75](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L75)

The reason or explanation provided by the AI for its output.
