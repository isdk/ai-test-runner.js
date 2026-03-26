[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateSort

# Function: validateSort()

> **validateSort**(`actual`, `expected`, `ctx`, `validateMatch`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/operators/sort.ts:104](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/validate/operators/sort.ts#L104)

Validates that the remaining expectations pass after sorting the actual array.

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
"$sort": {
  "$by": "-createdAt", // or ["category", "-score"]
  "$sequence": [ ... ]
}

// Advanced usage:
"$sort": {
  "$by": [
    { "$expr": "item.score * 1.2", "order": "desc" },
    (item) => item.name
  ],
  "$first": { "name": "Best" }
}
```
