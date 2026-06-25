[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIScoreConfig

# Type Alias: AIScoreConfig

> **AIScoreConfig** = `number` \| \{\[`key`: `string`\]: `any`; `critical?`: `boolean`; `dimension?`: `string`; `strategy?`: `string`; `threshold?`: `number`; `value`: `number`; \}

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:154](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L154)

Configuration for scoring a validation item.
Can be a simple number (weight) or a detailed object.

## Union Members

`number`

***

### Type Literal

\{\[`key`: `string`\]: `any`; `critical?`: `boolean`; `dimension?`: `string`; `strategy?`: `string`; `threshold?`: `number`; `value`: `number`; \}

### Index Signature

\[`key`: `string`\]: `any`

Additional options for the strategy.

#### critical?

> `optional` **critical?**: `boolean`

If true, this item must pass for the overall test to pass, regardless of the score(red-line).

#### dimension?

> `optional` **dimension?**: `string`

The dimension/tag this score belongs to (e.g. 'accuracy', 'security').

#### strategy?

> `optional` **strategy?**: `string`

The strategy used to calculate the score for this item's children.

#### threshold?

> `optional` **threshold?**: `number`

The threshold for fuzzy matching. Only applicable for leaf nodes.

#### value

> **value**: `number`

The relative weight or value of this item. Positive for rewards, negative for penalties.
