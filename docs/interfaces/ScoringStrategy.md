[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / ScoringStrategy

# Interface: ScoringStrategy

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:234](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/types.ts#L234)

Interface for a scoring strategy.
Defines how scores are distributed to children and aggregated back to the parent.

## Methods

### aggregate()

> **aggregate**(`results`, `weights`, `options?`): [`MatchResult`](MatchResult.md)

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:252](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/types.ts#L252)

Aggregates the results from child matches into a single result.

#### Parameters

##### results

[`MatchResult`](MatchResult.md)[]

The results from child validations.

##### weights

`number`[]

The weights corresponding to each child.

##### options?

`any`

Additional aggregation options.

#### Returns

[`MatchResult`](MatchResult.md)

***

### distribute()

> **distribute**(`items`, `options?`): `number`[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate/types.ts:241](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/types.ts#L241)

Calculates the weights for a list of items.

#### Parameters

##### items

([`AIScoreConfig`](../type-aliases/AIScoreConfig.md) \| `null`)[]

The items to distribute score to.

##### options?

Contextual options.

###### autoConfidence?

`boolean` \| `"force"`

###### maxScore?

`number`

###### totalUnassignedWeight?

`number`

#### Returns

`number`[]

An array of normalized weights (0.0 - 1.0) summing to 1.0 (for weighted) or more (for independent).
