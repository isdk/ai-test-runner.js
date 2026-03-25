[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / ValidationContext

# Class: ValidationContext

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:52](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L52)

Manages the read-only configuration and context of a validation process.

## Constructors

### Constructor

> **new ValidationContext**(`options`): `ValidationContext`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:97](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L97)

Creates a new validation context.

#### Parameters

##### options

[`MatchValueOptions`](../interfaces/MatchValueOptions.md) = `{}`

Initial options for the context.

#### Returns

`ValidationContext`

## Properties

### allocatedScore

> **allocatedScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:80](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L80)

The score allocated to this validation node from its parent.

***

### allowOperatorOverride?

> `optional` **allowOperatorOverride**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:68](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L68)

Whether to allow custom operators to override built-in ones.

***

### autoConfidence?

> `optional` **autoConfidence**: `boolean` \| `"force"`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:87](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L87)

***

### currentOperator?

> `optional` **currentOperator**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:89](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L89)

The name of the current operator.

***

### data

> **data**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:56](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L56)

Data context used for template formatting and variable injection.

***

### diffPermissive?

> `optional` **diffPermissive**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:62](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L62)

Whether to allow unverified diff changes in non-strict mode.

***

### disableHeuristicSchema?

> `optional` **disableHeuristicSchema**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:64](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L64)

Whether to disable heuristic JSON Schema recognition.

***

### input

> **input**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:58](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L58)

The original test fixture input and configuration.

***

### isCriticalBranch

> **isCriticalBranch**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:82](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L82)

Whether the current validation branch is mandatory (critical).

***

### isKeyPresent?

> `optional` **isKeyPresent**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:70](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L70)

Whether the current key is actually present in the parent object.

***

### key

> **key**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:54](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L54)

The current hierarchical key or dot-separated path being validated.

***

### maxScore

> **maxScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:74](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L74)

The maximum possible score.

***

### operators?

> `optional` **operators**: `Record`\<`string`, [`ValidationOperatorHandler`](../type-aliases/ValidationOperatorHandler.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:66](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L66)

Custom validation operators.

***

### operatorStrategy?

> `optional` **operatorStrategy**: `string` \| `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:91](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L91)

The virtual strategy of the current operator.

***

### passScore

> **passScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:76](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L76)

The minimum score required to pass.

***

### scoring?

> `optional` **scoring**: `boolean` \| `"auto"`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:72](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L72)

Scoring mode configuration.

***

### strategy?

> `optional` **strategy**: [`ScoringStrategy`](../interfaces/ScoringStrategy.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:84](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L84)

The scoring strategy to use.

***

### strict?

> `optional` **strict**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:60](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L60)

Configuration for strict validation (e.g., forbidding extra keys).

***

### threshold?

> `optional` **threshold**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:86](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L86)

The threshold for fuzzy matching. Only applicable for leaf nodes.

***

### unassignedWeight?

> `optional` **unassignedWeight**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:78](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L78)

The default weight for unassigned items.

## Methods

### aggregate()

> **aggregate**(`results`, `weights`): [`MatchResult`](../interfaces/MatchResult.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:222](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L222)

Aggregates multiple MatchResults using the current strategy.

#### Parameters

##### results

[`MatchResult`](../interfaces/MatchResult.md)[]

##### weights

`number`[]

#### Returns

[`MatchResult`](../interfaces/MatchResult.md)

***

### createChildContext()

> **createChildContext**(`keyOrIndex`, `count`, `options`): `ValidationContext`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:163](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L163)

Creates a high-level child context with automated path generation based on operator strategy.

#### Parameters

##### keyOrIndex

The key or index of the child item.

`string` | `number`

##### count

`number`

Total number of items in the container (used for single-element optimization).

##### options

`Partial`\<[`MatchValueOptions`](../interfaces/MatchValueOptions.md)\> = `{}`

Additional options.

#### Returns

`ValidationContext`

***

### createSubContext()

> **createSubContext**(`subKey`, `options`): `ValidationContext`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:127](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L127)

Creates a sub-context for a nested property or array element.
Handles path concatenation (e.g., appending '.prop' or '[index]').

#### Parameters

##### subKey

`string`

The name of the sub-property or index (e.g., "name", "[0]").

##### options

`Partial`\<[`MatchValueOptions`](../interfaces/MatchValueOptions.md)\> = `{}`

Optional overrides for the sub-context.

#### Returns

`ValidationContext`

A new ValidationContext instance for the nested path.

***

### distribute()

> **distribute**(`items`): `number`[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:208](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/types.ts#L208)

Calculates weights for a list of items using the current strategy and context.

#### Parameters

##### items

([`AIScoreConfig`](../type-aliases/AIScoreConfig.md) \| `null`)[]

#### Returns

`number`[]
