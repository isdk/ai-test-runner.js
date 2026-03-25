[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateStringDiff

# Function: validateStringDiff()

> **validateStringDiff**(`actual`, `expected`, `ctx`, `options?`): `Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/diff.ts:290](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/diff.ts#L290)

Validates a string mismatch using structured diff analysis.

The score reflects the confidence based on matched diff items. Even if the validation
fails (pass: false) due to strict mode or unverified changes, the score will still
represent the sum of weights of successfully matched items.

If no explicit diff items are provided, a mismatch results in score 0.

## Parameters

### actual

`string`

### expected

`string`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

### options?

[`AIDiffOptions`](../interfaces/AIDiffOptions.md)

## Returns

`Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>
