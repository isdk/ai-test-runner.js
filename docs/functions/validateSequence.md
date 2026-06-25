[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateSequence

# Function: validateSequence()

> **validateSequence**(`actual`, `expectedList`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/operators/sequence.ts:8](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/operators/sequence.ts#L8)

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
