# AI 测试评分策略架构与扩展指南

## 1. 引言

在 AI 应用的测试中，传统的二元验证（通过/失败）往往无法充分捕捉大型语言模型（LLM）输出的细微差别。模型的响应可能并非完美匹配预期，但其质量可能足以接受，或者在不同维度上表现出不同程度的正确性。

为了更精细化地评估 LLM 的表现，我们引入了一套灵活且可扩展的评分策略架构。这套架构旨在实现**验证结果（Pass/Fail）与得分（Score）的分离**。即使测试因为某些关键性失败（“红线”）而被标记为不通过，其计算出的得分仍然能提供有价值的信息，帮助我们理解模型表现的“程度”，而非简单的“有无”。

## 2. 核心理念

* **分数与结果分离**：
  * `critical` 标志（红线）：控制验证的**状态**。如果任何被标记为 `critical` 的项未通过，则整个测试被视为失败，无论其计算出的得分如何。
  * `score`：控制**匹配度量化**。它反映了模型输出与预期之间符合的程度，通常是一个 0 到 100 之间的值（或归一化到 0-1 之间）。
* **置信度量化**：自定义验证逻辑现在可以返回一个 0 到 1 之间的数值（置信度），而不仅仅是布尔值。这使得验证能够表达“部分匹配”的概念。
* **多维度评价 (Dimensions)**：支持按标签（如安全、准确性、格式）聚合得分。
* **双向评分 (Rewards & Penalties)**：支持正分（奖励）和负分（扣分）。

## 3. 架构概览

评分策略架构围绕以下几个核心组件构建：

1. **`AIScoreConfig`**: 用于在测试配置中定义评分参数，包括权重、红线标记、以及 `strategy` 和 `threshold`。
2. **`MatchResult`**: **(核心变更)** 校验操作的纯函数返回值，包含 `score` (0-1)、`pass` (状态)、`failures` (失败列表) 以及详情树。
3. **`ScoringStrategy` 接口**: 定义了分数的“分发（Distribution）”和“聚合（Aggregation）”逻辑。**现在作为纯函数处理子项结果的聚合。**
4. **`ValidationContext`**: 验证过程中的只读上下文对象，负责传递和管理配置（策略、阈值、权重分配）和路径信息。
5. **`processValidationResult` 辅助函数**: 将各种类型的 `ValidationResult`（布尔、置信度数字、对象等）归一化为标准的 `MatchResult`。
6. **`validate` (核心验证函数)**: 递归验证的入口，返回 `MatchResult`。

## 4. 详细设计

### 4.1. `AIScoreConfig` (位于 `src/types.ts`)

`AIScoreConfig` 可以是一个数字（表示权重），也可以是一个包含更多细节的对象。

```typescript
export type AIScoreConfig =
  | number
  | {
      value: number;          // 相对权重或数值。正数为奖励，负数为惩罚。
      dimension?: string;     // 维度名称（如 'security', 'accuracy'）
      critical?: boolean;      // 如果为 true，则该项必须通过（奖励项）或不准通过（惩罚项）
      strategy?: string;       // 指定用于此项及其子项的评分策略名称
      threshold?: number;      // 0-1 之间的数值，作为置信度通过的阈值
      [key: string]: any;
    }
```

### 4.2. `MatchResult` (位于 `src/validate/types.ts`)

这是所有校验函数的标准输出格式：

```typescript
export interface MatchResult {
  score: number;                // 归一化后的置信度分数 (0.0 - 1.0)
  pass: boolean;                 // 是否通过校验
  failures: AIValidationFailure[]; // 过程中产生的失败详情列表
  details?: MatchResultDetail[];   // 树状得分明细
  title?: string;                // 节点标题
  dimension?: string;            // 节点所属维度
  critical?: boolean;            // 是否为关键项
}
```

### 4.3. `ScoringStrategy` 接口 (位于 `src/validate/types.ts`)

此接口定义了分数的分配和结果的聚合逻辑：

```typescript
export interface ScoringStrategy {
  /**
   * 计算一组项的归一化权重。
   */
  distribute(
    items: (AIScoreConfig | null)[],
    options?: { totalUnassignedWeight?: number; maxScore?: number }
  ): number[]

  /**
   * 将子项的 MatchResult 聚合为一个父项的 MatchResult。
   */
  aggregate(
    results: MatchResult[],
    weights: number[],
    options?: any
  ): MatchResult
}
```

**默认实现 (位于 `src/validate/strategies.ts`)**:

* **`weightedSumStrategy` (默认/`weighted`/`and`)**:
  * **功能**: 将子项视为一个整体的组成部分。最终得分为所有子项 `(score * weight)` 的加权总和。
  * **扣分支持**: 负权重项匹配成功时，将从总分中扣除相应分值。
  * **校验逻辑**: 所有奖励项必须通过。如果任何被标记为 `critical` 的项（奖励或惩罚）触发了红线，则父项标记为 `fail`。
  * **典型场景**: 对象属性校验、多维度评分。

* **`maxStrategy` (`max`/`or`)**:
  * **功能**: 取所有子项中最高的 `(score * weight)` 作为最终得分。
  * **校验逻辑**: 只要有一个子项通过校验，父项就标记为 `pass`。
  * **典型场景**: 模糊匹配、多选一验证、搜索结果验证。

### 4.4. `ValidationContext` (位于 `src/validate/types.ts`)

`ValidationContext` 负责传递和管理配置。

```typescript
export class ValidationContext {
  key: string;                // 当前路径 (如 "data.items[0]")
  strategy?: ScoringStrategy; // 继承或指定的策略
  threshold?: number;         // 校验阈值
  allocatedScore: number;     // 分配给当前节点的绝对分值上限 (默认 100)
  isCriticalBranch: boolean;  // 当前分支是否属于“红线”路径

  // 创建子路径上下文，同时继承或覆盖配置
  createSubContext(subKey: string, options: Partial<MatchValueOptions>): ValidationContext;
}
```

### 4.5. 扣分机制 (Penalties)

`score` 支持负数。负数分值被视为“绝对扣分偏移量”，不参与正权重项的比例分配。

* **归一化规则**：与奖励项一致，绝对值 `< 1` 视为百分比，`>= 1` 视为绝对分值。
* **虚拟失败注入**：如果惩罚项设置 `critical: true`，一旦触发该扣分规则，系统会手动生成一个虚拟失败项（Virtual Failure）以触发红线逻辑。

## 5. 技术实现细节 (业务逻辑锚点)

为了保证系统稳定性和诊断的精确度，以下逻辑具有特定的存在理由，修改时请务必小心：

### 5.1. 算子透明度 (Transparency)

`$and` 和 `$or` 在路径生成中是“透明”的。

* **理由**：避免出现 `output.$and[0].$or` 这种冗余路径。具体索引由算子 Handler 内部显式补全。

### 5.2. 详情树持久化

即使验证通过（`pass: true`），`processValidationResult` 也必须保留并透传 `dimension` 和 `details`。

* **理由**：否则顶层日志无法回溯评分细节。

## 6. 如何扩展

### 6.1. 新增自定义评分策略

实现 `ScoringStrategy` 接口并注册到 `strategies` 对象中。

### 6.2. 自定义算子返回分数

自定义算子可以返回数字（0~1 置信度）或包含 `score` 属性的对象。

```javascript
export function myFuzzyMatcher(actual, expected, ctx) {
  const similarity = calculate(actual, expected);
  return {
    score: similarity,
    dimension: 'accuracy',
    title: '模糊匹配'
  };
}
```

### 6.3. 配置评分策略

你可以在测试预期中通过 `score` 字段指定策略和维度：

```yaml
expected:
  output:
    message:
      $myFuzzyMatcher: "hello world"
      score:
        value: 10
        dimension: 'fluency'
        threshold: 0.8
```
