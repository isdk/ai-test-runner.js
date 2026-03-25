[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIDiffItem

# Interface: AIDiffItem

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:7](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L7)

Represents a specific difference item in the validation process.
Extends the `Change` object from the `diff` library with additional validation metadata.

## Extends

- `Change`

## Properties

### added

> **added**: `boolean`

Defined in: ai-tools/node\_modules/.pnpm/diff@8.0.3/node\_modules/diff/libesm/types.d.ts:10

true if the value was inserted into the new string, otherwise false

#### Inherited from

`Change.added`

***

### count

> **count**: `number`

Defined in: ai-tools/node\_modules/.pnpm/diff@8.0.3/node\_modules/diff/libesm/types.d.ts:18

How many tokens (e.g. chars for `diffChars`, lines for `diffLines`) the value in the change object consists of

#### Inherited from

`Change.count`

***

### path?

> `optional` **path**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:12](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L12)

The path in the object structure (e.g., "user.id" or "tags[0]").
Present when performing structured diffs (like JSON).

***

### removed

> **removed**: `boolean`

Defined in: ai-tools/node\_modules/.pnpm/diff@8.0.3/node\_modules/diff/libesm/types.d.ts:14

true if the value was removed from the old string, otherwise false

#### Inherited from

`Change.removed`

***

### required?

> `optional` **required**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:26](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L26)

If true, this change MUST be present in the actual output for the validation to pass.

***

### score?

> `optional` **score**: [`AIScoreConfig`](../type-aliases/AIScoreConfig.md)

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:30](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L30)

Scoring configuration for this specific diff item.

***

### val?

> `optional` **val**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:17](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L17)

The logical value associated with this change.
Present when performing structured diffs (like JSON).

***

### value

> **value**: `string`

Defined in: ai-tools/node\_modules/.pnpm/diff@8.0.3/node\_modules/diff/libesm/types.d.ts:6

The concatenated content of all the tokens represented by this change object - i.e. generally the text that is either added, deleted, or common, as a single string.
In cases where tokens are considered common but are non-identical (e.g. because an option like `ignoreCase` or a custom `comparator` was used), the value from the *new* string will be provided here.

#### Inherited from

`Change.value`

***

### verified?

> `optional` **verified**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:22](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L22)

Indicates whether this specific change has been verified against the expected whitelist.
Internal use during the validation process.
