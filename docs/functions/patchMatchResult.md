[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / patchMatchResult

# Function: patchMatchResult()

> **patchMatchResult**(`res`, `metadata`, `key?`): [`MatchResult`](../interfaces/MatchResult.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/utils.ts:250](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/utils.ts#L250)

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
