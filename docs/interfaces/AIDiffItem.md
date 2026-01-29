[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIDiffItem

# Interface: AIDiffItem

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:7](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L7)

Represents a diff item in an AI validation process.
Extends the basic `Change` object from the `diff` library.

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

### removed

> **removed**: `boolean`

Defined in: ai-tools/node\_modules/.pnpm/diff@8.0.3/node\_modules/diff/libesm/types.d.ts:14

true if the value was removed from the old string, otherwise false

#### Inherited from

`Change.removed`

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

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:9](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L9)

Indicates whether this specific change has been verified.
