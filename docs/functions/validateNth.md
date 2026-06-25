[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateNth

# Function: validateNth()

> **validateNth**(`actual`, `expected`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/operators/nth.ts:14](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/operators/nth.ts#L14)

Validates that an array element at a specific index matches expectations.

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

## Example

```ts
"$nth": {
  "$index": 0, // 0 for the first element, -1 for the last element
  "status": "published"
}
```
