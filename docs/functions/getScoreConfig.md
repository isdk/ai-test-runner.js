[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / getScoreConfig

# Function: getScoreConfig()

> **getScoreConfig**(`item`): `object`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/utils.ts:32](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/utils.ts#L32)

Internal helper to extract weight and critical flag from a node.
Priorities & Exclusivity:
1. If $meta exists, ALL metadata is extracted from it. Shorthands are ignored.
2. If $meta is missing, shorthand keys ($score, $title, etc.) are used.

## Parameters

### item

`any`

## Returns

`object`

### critical

> **critical**: `boolean`

### dimension?

> `optional` **dimension**: `string`

### strategy?

> `optional` **strategy**: `string`

### threshold?

> `optional` **threshold**: `number`

### title?

> `optional` **title**: `string`

### weight

> **weight**: `number` \| `null`
