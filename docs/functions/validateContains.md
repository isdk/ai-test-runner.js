[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateContains

# Function: validateContains()

> **validateContains**(`actual`, `expected`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/contains.ts:7](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/operators/contains.ts#L7)

Validates that an array contains at least one item matching the expectation.

## Parameters

### actual

`any`[]

### expected

`any`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

### validateMatch

[`ValidateMatchFn`](../type-aliases/ValidateMatchFn.md)

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
