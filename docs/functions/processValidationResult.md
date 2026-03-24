[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / processValidationResult

# Function: processValidationResult()

> **processValidationResult**(`result`, `expected`, `actual`, `ctx`, `options`): [`MatchResult`](../interfaces/MatchResult.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/utils.ts:36](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/utils.ts#L36)

Processes the result of a validation function/operator and normalizes it to a MatchResult.
Performs "auto-backfill" of missing keys and context information for failures.
This is a pure function that does NOT modify the context.

## Parameters

### result

[`ValidationResult`](../type-aliases/ValidationResult.md)

The raw result from an operator or function.

### expected

`any`

The expected value used for matching.

### actual

`any`

The actual value received.

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

The current validation context.

### options

Additional normalization options.

#### key?

`string`

## Returns

[`MatchResult`](../interfaces/MatchResult.md)

MatchResult containing score, pass status and normalized failures.
