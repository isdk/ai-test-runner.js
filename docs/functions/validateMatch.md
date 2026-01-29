[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateMatch

# Function: validateMatch()

> **validateMatch**(`actual`, `expected`, `options`): `Promise`\<[`AIValidationFailure`](../interfaces/AIValidationFailure.md)[]\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:136](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L136)

Validates that an actual value matches an expected value.
Supports various matching logic: equality, RegExp, Array comparison,
custom functions, and JSON Schema.

## Parameters

### actual

`any`

The actual value produced.

### expected

`any`

The expected value or matcher.

### options

[`MatchValueOptions`](../interfaces/MatchValueOptions.md) = `{}`

Validation options.

## Returns

`Promise`\<[`AIValidationFailure`](../interfaces/AIValidationFailure.md)[]\>

A promise that resolves to an array of validation failures.
