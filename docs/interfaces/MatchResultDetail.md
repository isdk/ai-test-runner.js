[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / MatchResultDetail

# Interface: MatchResultDetail

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:291](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L291)

Detailed information about a single validation item's score.

## Properties

### critical?

> `optional` **critical**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:305](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L305)

Whether this item was a critical/red-line item.

***

### details?

> `optional` **details**: `MatchResultDetail`[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:307](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L307)

Recursive sub-details for nested objects/arrays.

***

### dimension?

> `optional` **dimension**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:297](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L297)

The dimension/tag.

***

### key

> **key**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:293](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L293)

The key/path of the item.

***

### pass

> **pass**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:303](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L303)

Whether this specific item passed.

***

### score

> **score**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:299](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L299)

The earned score (0.0 - 1.0, relative to allocated weight).

***

### title?

> `optional` **title**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:295](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L295)

The descriptive title.

***

### weight

> **weight**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:301](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L301)

The allocated weight (normalized 0.0 - 1.0).
