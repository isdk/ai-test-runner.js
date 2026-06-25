[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestRunnerOptions

# Interface: AITestRunnerOptions

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:366](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L366)

Options for the `AITestRunner.run` method.

## Properties

### allowOperatorOverride?

> `optional` **allowOperatorOverride?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:398](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L398)

Whether to allow custom operators to override built-in ones.

***

### baseDir?

> `optional` **baseDir?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:402](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L402)

Base directory for resolving relative paths in operators.

***

### disableHeuristicSchema?

> `optional` **disableHeuristicSchema?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:390](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L390)

Whether to disable heuristic JSON Schema recognition globally.

***

### fixtureConfig?

> `optional` **fixtureConfig?**: `Partial`\<[`AITestFixture`](AITestFixture.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:370](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L370)

Base configuration and default values for all fixtures in this run.

***

### logVars?

> `optional` **logVars?**: `boolean` \| `"error"`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:409](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L409)

Whether to include the resolved template variables (`vars`) in the log.
- `true`: Always include.
- `false`: Never include (default).
- `'error'`: Only include when the test fails.

***

### maxScore?

> `optional` **maxScore?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:418](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L418)

The maximum possible score for this fixture. Defaults to 1.

***

### operators?

> `optional` **operators?**: `Record`\<`string`, `any`\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:394](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L394)

Custom validation operators.

***

### passScore?

> `optional` **passScore?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:420](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L420)

The minimum score required for the fixture to pass. Defaults to maxScore.

***

### scoring?

> `optional` **scoring?**: `boolean` \| `"auto"`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:416](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L416)

Scoring mode configuration.
- `true`: Enable scoring.
- `false`: Disable scoring.
- `'auto'`: Automatically enable if 'score' properties are found.

***

### scriptConfig?

> `optional` **scriptConfig?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:382](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L382)

Metadata about the script itself, such as output schema definitions.

***

### skips?

> `optional` **skips?**: `object`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:378](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L378)

A map of fixture indices to skip during execution.

#### Index Signature

\[`k`: `number`\]: `boolean`

***

### strict?

> `optional` **strict?**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:386](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L386)

Global strict mode configuration. Individual fixtures can override this.

***

### unassignedWeight?

> `optional` **unassignedWeight?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:422](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L422)

The default relative weight for items that do not have an explicit 'score' property.

***

### userConfig?

> `optional` **userConfig?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:374](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L374)

User-provided runtime configuration, often passed down to the executor.
