[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateSequence

# Function: validateSequence()

> **validateSequence**(`actual`, `expectedList`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/sequence.ts:8](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/operators/sequence.ts#L8)

Validates that an array contains a sequence of matching items in the specified order.

## Parameters

### actual

`any`[]

### expectedList

`any`[]

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

### validateMatch

[`ValidateMatchFn`](../type-aliases/ValidateMatchFn.md)

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
