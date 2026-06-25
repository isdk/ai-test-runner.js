[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / ValidateMatchFn

# Type Alias: ValidateMatchFn

> **ValidateMatchFn** = (`actual`, `expected`, `ctx`) => `Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/types.ts:262](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/types.ts#L262)

Signature for the core match validation function used recursively by operators.

## Parameters

### actual

`any`

### expected

`any`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

## Returns

`Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>
