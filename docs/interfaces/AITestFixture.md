[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestFixture

# Interface: AITestFixture

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:281](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L281)

Represents a single test fixture definition.

## Indexable

> \[`key`: `string`\]: `any`

Support for arbitrary custom properties used in templates.

## Properties

### allowOperatorOverride?

> `optional` **allowOperatorOverride?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:313](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L313)

Whether to allow custom operators to override built-in ones.

***

### checkSchema?

> `optional` **checkSchema?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:307](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L307)

Whether to perform JSON Schema validation.

***

### disableHeuristicSchema?

> `optional` **disableHeuristicSchema?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:309](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L309)

Whether to disable heuristic JSON Schema recognition.

***

### expect?

> `optional` **expect?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:303](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L303)

Expectations for the full execution trace (e.g., messages, tool calls).
Will be compared against `AIExecutionResult.messages`.

***

### input?

> `optional` **input?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:285](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L285)

The input data for the test, often used to populate script templates.

***

### maxScore?

> `optional` **maxScore?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:322](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L322)

The maximum possible score for this fixture. Defaults to 1.

***

### not?

> `optional` **not?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:332](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L332)

If true, the test passes if validation fails.

***

### only?

> `optional` **only?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:328](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L328)

If true, only this fixture (and others marked 'only') will run.

***

### operators?

> `optional` **operators?**: `Record`\<`string`, `any`\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:311](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L311)

Custom validation operators for this fixture.

***

### output?

> `optional` **output?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:287](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L287)

The expected primary output from the AI.

***

### outputSchema?

> `optional` **outputSchema?**: `any`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:289](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L289)

A JSON Schema to validate the AI output against.

***

### passScore?

> `optional` **passScore?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:324](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L324)

The minimum score required for the fixture to pass. Defaults to maxScore.

***

### scoring?

> `optional` **scoring?**: `boolean` \| `"auto"`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:320](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L320)

Scoring mode configuration.
- `true`: Enable scoring.
- `false`: Disable scoring.
- `'auto'`: Automatically enable if 'score' properties are found.

***

### script?

> `optional` **script?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:294](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L294)

The specific script or template ID to use for this test.
Overrides the default script provided to the runner.

***

### skip?

> `optional` **skip?**: `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:330](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L330)

If true, this fixture will be skipped.

***

### strict?

> `optional` **strict?**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:305](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L305)

Strict validation mode configuration for this fixture.

***

### title?

> `optional` **title?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:283](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L283)

A descriptive title for the test case.

***

### tools?

> `optional` **tools?**: [`AITestTools`](../type-aliases/AITestTools.md)

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:296](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L296)

Tools available to the AI during this test.

***

### toolTester?

> `optional` **toolTester?**: `string`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:298](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L298)

A specialized script/executor for testing tool calls.

***

### unassignedWeight?

> `optional` **unassignedWeight?**: `number`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:326](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L326)

The default relative weight for items that do not have an explicit 'score' property.
