[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateEach

# Function: validateEach()

> **validateEach**(`actual`, `expected`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/operators/each.ts:8](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/operators/each.ts#L8)

Validates that EVERY item in an array matches the specified expectation.

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
