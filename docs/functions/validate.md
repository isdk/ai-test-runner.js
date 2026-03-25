[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validate

# Function: validate()

> **validate**(`actual`, `expected`, `ctx`): `Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/core.ts:31](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/core.ts#L31)

Validates that an actual value matches an expected value.
This is the public entry point that returns MatchResult (Pure).

## Parameters

### actual

`any`

### expected

`any`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

## Returns

`Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>
