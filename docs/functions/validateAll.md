[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateAll

# Function: validateAll()

> **validateAll**(`actual`, `expectedList`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/operators/all.ts:9](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/operators/all.ts#L9)

Validates that an array contains ALL items specified in the expectation list.

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
