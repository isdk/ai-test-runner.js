[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateLast

# Function: validateLast()

> **validateLast**(`actual`, `expected`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/operators/nth.ts:105](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/operators/nth.ts#L105)

Syntactic sugar for getting the last element.
Equivalent to $nth with $index: -1

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
