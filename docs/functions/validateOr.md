[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateOr

# Function: validateOr()

> **validateOr**(`actual`, `expectedList`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/or.ts:13](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/operators/or.ts#L13)

Validates that a value matches at least ONE of the specified expectations.

## Parameters

### actual

`any`

The value to validate.

### expectedList

`any`[]

Array of expectations.

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

Validation context.

### validateMatch

[`ValidateMatchFn`](../type-aliases/ValidateMatchFn.md)

Recursive validation function.

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
