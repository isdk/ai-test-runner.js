[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / calculateNormalizedWeights

# Function: calculateNormalizedWeights()

> **calculateNormalizedWeights**(`explicitWeights`, `options`): `number`[]

Defined in: [ai-tools/packages/ai-test-runner/src/validate/utils.ts:243](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/utils.ts#L243)

Calculates normalized weights for a set of items, balancing explicit scores and unassigned items.

【核心评分逻辑说明】
1. 奖励项 (score > 0): 参与 Balanced 模式归一化，总和为 1.0。
2. 扣分项 (score < 0): 不参与 1.0 预算的竞争，仅根据 scale 转换为绝对权重。
3. 混合模式: 允许用户同时使用百分比 (0~1) 和绝对分值 (>=1)，系统根据 maxScore 自动适配。

## Parameters

### explicitWeights

(`number` \| `null`)[]

### options

#### autoConfidence?

`boolean` \| `"force"`

Whether to automatically treat values between 0 and 1 as confidence scores. Defaults to true.

#### maxScore?

`number`

The maximum possible value for explicit weights, used for scaling. Defaults to 100.

#### normalize?

`boolean`

Whether to normalize the total sum of positive items to 1.0. Defaults to true.

#### totalUnassignedWeight?

`number`

The total weight budget reserved for all unassigned (null) items. Defaults to 0.1.

## Returns

`number`[]
