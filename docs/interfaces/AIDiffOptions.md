[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIDiffOptions

# Interface: AIDiffOptions

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:55](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L55)

Configuration options for string diffing.

## Properties

### ignoreCase?

> `optional` **ignoreCase**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:70](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L70)

Whether to ignore case differences.

***

### ignoreNewlineAtEof?

> `optional` **ignoreNewlineAtEof**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:74](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L74)

(lines) Whether to ignore a missing newline character at the end of the last line.

***

### ignoreWhitespace?

> `optional` **ignoreWhitespace**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:72](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L72)

(lines) Whether to ignore leading and trailing whitespace.

***

### intlSegmenter?

> `optional` **intlSegmenter**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:80](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L80)

(words) Optional Intl.Segmenter for word-level diffing.

***

### items?

> `optional` **items**: [`AIDiffItem`](AIDiffItem.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:63](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L63)

A list of expected diff items (whitelist) to match against the actual changes.

***

### newlineIsToken?

> `optional` **newlineIsToken**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:76](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L76)

(lines) Whether to treat the newline character at the end of each line as its own token.

***

### permissive?

> `optional` **permissive**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:68](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L68)

Whether to allow unverified diff changes in non-strict mode.
If true, changes not present in the `items` list will not cause a failure.

***

### stripTrailingCr?

> `optional` **stripTrailingCr**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:78](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L78)

(lines) Whether to remove all trailing CR characters.

***

### type?

> `optional` **type**: [`AIDiffType`](../type-aliases/AIDiffType.md)

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:61](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/types.ts#L61)

The diff strategy to use.
Defaults to 'auto' when no whitelist is provided for better readability,
or 'chars' when a whitelist is provided for precision.
