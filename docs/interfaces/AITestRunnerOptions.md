[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestRunnerOptions

# Interface: AITestRunnerOptions

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:362](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L362)

Options for the `AITestRunner.run` method.

## Properties

### allowOperatorOverride?

> `optional` **allowOperatorOverride**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:394](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L394)

Whether to allow custom operators to override built-in ones.

***

### baseDir?

> `optional` **baseDir**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:398](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L398)

Base directory for resolving relative paths in operators.

***

### disableHeuristicSchema?

> `optional` **disableHeuristicSchema**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:386](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L386)

Whether to disable heuristic JSON Schema recognition globally.

***

### fixtureConfig?

> `optional` **fixtureConfig**: `Partial`\<[`AITestFixture`](AITestFixture.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:366](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L366)

Base configuration and default values for all fixtures in this run.

***

### logVars?

> `optional` **logVars**: `boolean` \| `"error"`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:405](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L405)

Whether to include the resolved template variables (`vars`) in the log.
- `true`: Always include.
- `false`: Never include (default).
- `'error'`: Only include when the test fails.

***

### maxScore?

> `optional` **maxScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:414](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L414)

The maximum possible score for this fixture. Defaults to 1.

***

### operators?

> `optional` **operators**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:390](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L390)

Custom validation operators.

***

### passScore?

> `optional` **passScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:416](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L416)

The minimum score required for the fixture to pass. Defaults to maxScore.

***

### scoring?

> `optional` **scoring**: `boolean` \| `"auto"`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:412](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L412)

Scoring mode configuration.
- `true`: Enable scoring.
- `false`: Disable scoring.
- `'auto'`: Automatically enable if 'score' properties are found.

***

### scriptConfig?

> `optional` **scriptConfig**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:378](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L378)

Metadata about the script itself, such as output schema definitions.

***

### skips?

> `optional` **skips**: `object`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:374](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L374)

A map of fixture indices to skip during execution.

#### Index Signature

\[`k`: `number`\]: `boolean`

***

### strict?

> `optional` **strict**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:382](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L382)

Global strict mode configuration. Individual fixtures can override this.

***

### unassignedWeight?

> `optional` **unassignedWeight**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:418](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L418)

The default relative weight for items that do not have an explicit 'score' property.

***

### userConfig?

> `optional` **userConfig**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:370](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L370)

User-provided runtime configuration, often passed down to the executor.
