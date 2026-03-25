[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateFirst

# Function: validateFirst()

> **validateFirst**(`actual`, `expected`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/nth.ts:87](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/operators/nth.ts#L87)

Syntactic sugar for getting the first element.
Equivalent to $nth with $index: 0

## Parameters

### actual

`any`

### expected

`any`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

### validateMatch

[`ValidateMatchFn`](../type-aliases/ValidateMatchFn.md)

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
