[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestRunnerOptions

# Interface: AITestRunnerOptions

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:113](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L113)

Configuration options for the AI test runner.

## Properties

### fixtureConfig?

> `optional` **fixtureConfig**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:115](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L115)

Initial configuration for test fixtures.

***

### scriptConfig?

> `optional` **scriptConfig**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:121](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L121)

Metadata and configuration for the script (e.g., output definitions).

***

### skips?

> `optional` **skips**: `object`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:119](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L119)

Indices of fixtures to skip.

#### Index Signature

\[`k`: `number`\]: `boolean`

***

### strict?

> `optional` **strict**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:123](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L123)

Strict validation mode configuration.

***

### userConfig?

> `optional` **userConfig**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:117](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/types.ts#L117)

User-provided configuration.
