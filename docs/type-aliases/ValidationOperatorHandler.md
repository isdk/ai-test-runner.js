[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / ValidationOperatorHandler

# Type Alias: ValidationOperatorHandler

> **ValidationOperatorHandler** = (`actual`, `expected`, `ctx`, `validateMatch`) => `Promise`\<[`ValidationResult`](ValidationResult.md)\> \| [`ValidationResult`](ValidationResult.md) & `object`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/types.ts:313](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/types.ts#L313)

Function signature for handling custom validation operators (e.g., $contains).

## Type Declaration

### strategy?

> `optional` **strategy?**: `string`

### virtual?

> `optional` **virtual?**: `boolean` \| `string`
