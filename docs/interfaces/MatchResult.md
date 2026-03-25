[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / MatchResult

# Interface: MatchResult

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:271](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L271)

Result of a validation match operation.

## Properties

### critical?

> `optional` **critical**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:285](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L285)

Whether this was a critical item.

***

### details?

> `optional` **details**: [`MatchResultDetail`](MatchResultDetail.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:279](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L279)

Detailed scoring breakdown for sub-items.

***

### dimension?

> `optional` **dimension**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:283](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L283)

Optional dimension/tag.

***

### failures

> **failures**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:277](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L277)

List of failures encountered during matching.

***

### pass

> **pass**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:275](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L275)

Whether the validation passed.

***

### score

> **score**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:273](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L273)

The normalized confidence score (0.0 - 1.0).

***

### title?

> `optional` **title**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:281](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/types.ts#L281)

Optional title of the validation item.
