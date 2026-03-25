[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / MatchValueOptions

# Interface: MatchValueOptions

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:7](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L7)

Options for matching and validating values.

## Properties

### allocatedScore?

> `optional` **allocatedScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:35](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L35)

The score allocated to this validation node from its parent.

***

### allowOperatorOverride?

> `optional` **allowOperatorOverride**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:23](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L23)

Whether to allow custom operators to override built-in ones. Defaults to false.

***

### autoConfidence?

> `optional` **autoConfidence**: `boolean` \| `"force"`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:42](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L42)

***

### currentOperator?

> `optional` **currentOperator**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:44](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L44)

The name of the operator currently being executed.

***

### data?

> `optional` **data**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:11](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L11)

Data context for template formatting.

***

### diffPermissive?

> `optional` **diffPermissive**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:17](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L17)

Whether to allow unverified diff changes in non-strict mode.

***

### disableHeuristicSchema?

> `optional` **disableHeuristicSchema**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:19](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L19)

Whether to disable heuristic JSON Schema recognition. Defaults to false.

***

### input?

> `optional` **input**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:13](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L13)

The test fixture input/configuration.

***

### isCriticalBranch?

> `optional` **isCriticalBranch**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:37](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L37)

Whether the current validation branch is mandatory (Critical).

***

### isKeyPresent?

> `optional` **isKeyPresent**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:25](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L25)

Whether the current key is actually present in the parent object.

***

### key?

> `optional` **key**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:9](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L9)

The current key or path being validated.

***

### maxScore?

> `optional` **maxScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:29](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L29)

The maximum possible score.

***

### operators?

> `optional` **operators**: `Record`\<`string`, [`ValidationOperatorHandler`](../type-aliases/ValidationOperatorHandler.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:21](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L21)

Custom validation operators.

***

### operatorStrategy?

> `optional` **operatorStrategy**: `string` \| `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:46](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L46)

The virtual/path strategy of the current operator.

***

### passScore?

> `optional` **passScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:31](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L31)

The minimum score required to pass.

***

### scoring?

> `optional` **scoring**: `boolean` \| `"auto"`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:27](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L27)

Scoring mode configuration.

***

### strategy?

> `optional` **strategy**: [`ScoringStrategy`](ScoringStrategy.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:39](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L39)

The scoring strategy to use.

***

### strict?

> `optional` **strict**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:15](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L15)

Strict validation mode configuration.

***

### threshold?

> `optional` **threshold**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:41](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L41)

The threshold for fuzzy matching. Only applicable for leaf nodes.

***

### unassignedWeight?

> `optional` **unassignedWeight**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:33](https://github.com/isdk/ai-test-runner.js/blob/377c15407b6bafe4f8a761af78baade4190788a4/src/validate/types.ts#L33)

The default weight for unassigned items.
