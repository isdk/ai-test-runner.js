[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / patchMatchResult

# Function: patchMatchResult()

> **patchMatchResult**(`res`, `metadata`, `key?`): [`MatchResult`](../interfaces/MatchResult.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/utils.ts:162](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/utils.ts#L162)

Patches a MatchResult with metadata (title, dimension, critical) and ensures details are consistent.
This is the main orchestration function called at each recursive exit.

## Parameters

### res

[`MatchResult`](../interfaces/MatchResult.md)

### metadata

#### critical?

`boolean`

#### dimension?

`string`

#### title?

`string`

### key?

`string`

## Returns

[`MatchResult`](../interfaces/MatchResult.md)
