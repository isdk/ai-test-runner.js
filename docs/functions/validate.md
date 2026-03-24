[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validate

# Function: validate()

> **validate**(`actual`, `expected`, `ctx`): `Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/core.ts:31](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/core.ts#L31)

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
