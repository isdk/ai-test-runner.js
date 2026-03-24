[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateMatch

# ~~Function: validateMatch()~~

> **validateMatch**(`actual`, `expected`, `options`): `Promise`\<[`AIValidationFailure`](../interfaces/AIValidationFailure.md)[]\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/core.ts:134](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/core.ts#L134)

Legacy wrapper for backward compatibility.

## Parameters

### actual

`any`

### expected

`any`

### options

[`MatchValueOptions`](../interfaces/MatchValueOptions.md) | [`ValidationContext`](../classes/ValidationContext.md)

## Returns

`Promise`\<[`AIValidationFailure`](../interfaces/AIValidationFailure.md)[]\>

## Deprecated

Use validate() instead. validate() is a pure function that returns a MatchResult.
