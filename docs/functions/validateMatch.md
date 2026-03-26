[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateMatch

# ~~Function: validateMatch()~~

> **validateMatch**(`actual`, `expected`, `options`): `Promise`\<[`AIValidationFailure`](../interfaces/AIValidationFailure.md)[]\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/core.ts:134](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/validate/core.ts#L134)

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
