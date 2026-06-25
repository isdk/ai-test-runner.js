[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIValidationFailure

# Interface: AIValidationFailure

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:135](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L135)

Represents a failure encountered during the validation of an AI output.

## Properties

### actual?

> `optional` **actual?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:143](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L143)

The actual value that was received.

***

### critical?

> `optional` **critical?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:147](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L147)

Indicates if this failure occurred in a critical validation path.

***

### diff?

> `optional` **diff?**: [`AIDiffItem`](AIDiffItem.md)[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:145](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L145)

Detailed diff information if the failure occurred during a string comparison.

***

### expected?

> `optional` **expected?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:141](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L141)

The value that was expected at the given key.

***

### key?

> `optional` **key?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:137](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L137)

The dot-separated path or array index where the failure occurred.

***

### message?

> `optional` **message?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:139](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L139)

A human-readable message describing the failure.
