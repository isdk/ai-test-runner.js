[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestFixture

# Interface: AITestFixture

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:277](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L277)

Represents a single test fixture definition.

## Indexable

\[`key`: `string`\]: `any`

Support for arbitrary custom properties used in templates.

## Properties

### allowOperatorOverride?

> `optional` **allowOperatorOverride**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:309](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L309)

Whether to allow custom operators to override built-in ones.

***

### checkSchema?

> `optional` **checkSchema**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:303](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L303)

Whether to perform JSON Schema validation.

***

### disableHeuristicSchema?

> `optional` **disableHeuristicSchema**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:305](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L305)

Whether to disable heuristic JSON Schema recognition.

***

### expect?

> `optional` **expect**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:299](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L299)

Expectations for the full execution trace (e.g., messages, tool calls).
Will be compared against `AIExecutionResult.messages`.

***

### input?

> `optional` **input**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:281](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L281)

The input data for the test, often used to populate script templates.

***

### maxScore?

> `optional` **maxScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:318](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L318)

The maximum possible score for this fixture. Defaults to 1.

***

### not?

> `optional` **not**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:328](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L328)

If true, the test passes if validation fails.

***

### only?

> `optional` **only**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:324](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L324)

If true, only this fixture (and others marked 'only') will run.

***

### operators?

> `optional` **operators**: `Record`\<`string`, `any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:307](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L307)

Custom validation operators for this fixture.

***

### output?

> `optional` **output**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:283](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L283)

The expected primary output from the AI.

***

### outputSchema?

> `optional` **outputSchema**: `any`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:285](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L285)

A JSON Schema to validate the AI output against.

***

### passScore?

> `optional` **passScore**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:320](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L320)

The minimum score required for the fixture to pass. Defaults to maxScore.

***

### scoring?

> `optional` **scoring**: `boolean` \| `"auto"`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:316](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L316)

Scoring mode configuration.
- `true`: Enable scoring.
- `false`: Disable scoring.
- `'auto'`: Automatically enable if 'score' properties are found.

***

### script?

> `optional` **script**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:290](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L290)

The specific script or template ID to use for this test.
Overrides the default script provided to the runner.

***

### skip?

> `optional` **skip**: `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:326](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L326)

If true, this fixture will be skipped.

***

### strict?

> `optional` **strict**: [`AIStrictOption`](../type-aliases/AIStrictOption.md)

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:301](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L301)

Strict validation mode configuration for this fixture.

***

### title?

> `optional` **title**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:279](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L279)

A descriptive title for the test case.

***

### tools?

> `optional` **tools**: [`AITestTools`](../type-aliases/AITestTools.md)

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:292](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L292)

Tools available to the AI during this test.

***

### toolTester?

> `optional` **toolTester**: `string`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:294](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L294)

A specialized script/executor for testing tool calls.

***

### unassignedWeight?

> `optional` **unassignedWeight**: `number`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:322](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L322)

The default relative weight for items that do not have an explicit 'score' property.
