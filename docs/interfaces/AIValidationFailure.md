[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIValidationFailure

# Interface: AIValidationFailure

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:49](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L49)

Represents a failure during AI validation.

## Properties

### actual?

> `optional` **actual**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:57](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L57)

The actual value received.

***

### diff?

> `optional` **diff**: [`AIDiffItem`](AIDiffItem.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:59](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L59)

Detailed diff information if applicable.

***

### expected?

> `optional` **expected**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:55](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L55)

The expected value.

***

### key?

> `optional` **key**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:51](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L51)

The key or path where the failure occurred.

***

### message?

> `optional` **message**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:53](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L53)

A descriptive message about the failure.
