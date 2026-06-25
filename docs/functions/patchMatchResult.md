[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / patchMatchResult

# Function: patchMatchResult()

> **patchMatchResult**(`res`, `metadata`, `key?`): [`MatchResult`](../interfaces/MatchResult.md)

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/utils.ts:250](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/utils.ts#L250)

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
