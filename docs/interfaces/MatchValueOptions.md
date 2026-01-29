[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / MatchValueOptions

# Interface: MatchValueOptions

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:17](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L17)

Options for matching and validating values.

## Properties

### data?

> `optional` **data**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:23](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L23)

Data context for template formatting.

***

### failures?

> `optional` **failures**: [`AIValidationFailure`](AIValidationFailure.md)[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:19](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L19)

Accumulator for validation failures.

***

### input?

> `optional` **input**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:25](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L25)

The test fixture input/configuration.

***

### key?

> `optional` **key**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:21](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L21)

The current key or path being validated.

***

### strict?

> `optional` **strict**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate-match.ts:27](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/validate-match.ts#L27)

Strict validation mode configuration.
