[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateAnd

# Function: validateAnd()

> **validateAnd**(`actual`, `expectedList`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/and.ts:13](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/validate/operators/and.ts#L13)

Validates that a value matches ALL specified expectations.

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
