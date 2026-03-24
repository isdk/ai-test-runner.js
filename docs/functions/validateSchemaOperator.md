[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateSchemaOperator

# Function: validateSchemaOperator()

> **validateSchemaOperator**(`actual`, `expected`, `ctx`, `_validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/schema.ts:8](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/operators/schema.ts#L8)

Explicitly validates a value against a JSON Schema.

## Parameters

### actual

`any`

### expected

`any`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

### \_validateMatch

[`ValidateMatchFn`](../type-aliases/ValidateMatchFn.md)

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
