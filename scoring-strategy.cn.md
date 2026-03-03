# AI 测试评分策略架构与扩展指南

## 1. 引言

在 AI 应用的测试中，传统的二元验证（通过/失败）往往无法充分捕捉大型语言模型（LLM）输出的细微差别。模型的响应可能并非完美匹配预期，但其质量可能足以接受，或者在不同维度上表现出不同程度的正确性。为了更精细化地评估 LLM 的表现，我们引入了一套灵活且可扩展的评分策略架构。

这套架构旨在实现**验证结果（Pass/Fail）与得分（Score）的分离**。即使测试因为某些关键性失败（“红线”）而被标记为不通过，其计算出的得分仍然能提供有价值的信息，帮助我们理解模型表现的“程度”，而非简单的“有无”。

## 2. 核心理念

* **分数与结果分离**：
  * `critical` 标志（红线）：控制验证的**状态**。如果任何被标记为 `critical` 的项未通过，则整个测试被视为失败，无论其计算出的得分如何。
  * `score`：控制**匹配度量化**。它反映了模型输出与预期之间符合的程度，通常是一个 0 到 100 之间的值（或归一化到 0-1 之间）。
* **置信度量化**：自定义验证逻辑现在可以返回一个 0 到 1 之间的数值（置信度），而不仅仅是布尔值。这使得验证能够表达“部分匹配”的概念。

## 3. 架构概览

新的评分策略架构围绕以下几个核心组件构建：

1. **`AIScoreConfig`**: 用于在测试配置中定义评分参数，包括权重、红线标记、以及 `strategy` 和 `threshold`。
2. **`MatchResult`**: **(核心变更)** 校验操作的纯函数返回值，包含 `score` (0-1)、`pass` (状态) 和 `failures` (失败列表)。
3. **`ScoringStrategy` 接口**: 定义了分数的“分发（Distribution）”和“聚合（Aggregation）”逻辑。**现在作为纯函数处理子项结果的聚合。**
4. **`ValidationContext`**: 验证过程中的只读上下文对象，负责传递和管理配置（策略、阈值、权重分配）和路径信息，不再存储校验结果。
5. **`processValidationResult` 辅助函数**: 将各种类型的 `ValidationResult`（布尔、置信度数字、对象等）归一化为标准的 `MatchResult`。
6. **`validate` (核心验证函数)**: 替代了旧的 `validateMatch`，作为递归验证的入口，返回 `MatchResult`。
7. **算子 (`$and`, `$or` 等)**: 调整为调用 `validate` 并返回聚合后的 `MatchResult`。

## 4. 详细设计

### 4.1. `AIScoreConfig` (位于 `src/types.ts`)

`AIScoreConfig` 可以是一个数字（表示权重），也可以是一个包含更多细节的对象。

```typescript
export type AIScoreConfig =
  | number
  | {
      value?: number;          // 相对权重或数值，默认为 1
      critical?: boolean;      // 如果为 true，则该项必须通过，否则整个测试失败
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
  * **功能**: 将子项视为一个整体的组成部分。每个子项根据其权重分配父级分数的比例。最终得分为所有子项 `(score * weight)` 的加权总和。
  - **校验逻辑**: **所有项必须通过** (`allPassed`)。如果任何子项被标记为失败，父项即便得分很高，其 `pass` 状态也会被标记为 `false`。
  - **典型场景**:
    - **对象/数组校验**: 验证一个 JSON 对象的所有必填字段。
    - **多维度评分**: 评估 AI 输出的质量，如“格式正确性”占 30%，“内容准确性”占 70%。
    - **算子**: `$and` 的默认策略。

* **`maxStrategy` (`max`/`or`)**:
  - **功能**: 将子项视为彼此独立的竞争者。每个子项都会尝试争取父级的全部权重。最终得分取所有子项中最高的 `(score * weight)`。
  - **校验逻辑**: **任一匹配即可通过** (`anyPassed`)。只要有一个子项通过校验，父项就标记为 `pass` 且不包含失败列表。如果全未通过，则返回汇总所有分支失败原因的详细错误。
  - **典型场景**:
    - **模糊匹配/多选一**: 验证 AI 响应是否匹配多个预期答案中的任意一个。
    - **搜索结果验证**: 只要搜索出的列表包含特定目标项即视为成功。
    - **算子**: `$or`, `$any`, `$contains` 的核心逻辑。

### 4.4. `ValidationContext` (位于 `src/validate/types.ts`)

`ValidationContext` 现在主要充当**配置容器**。

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

### 4.5. `processValidationResult` (位于 `src/validate/utils.ts`)

该函数负责将自定义验证函数返回的 `ValidationResult`（可能是 `boolean`, `number`, `string` 或对象）转换为 `MatchResult`。它会自动：

1. 根据 `threshold` 判断 `pass` 状态。
2. 自动补充 `failures` 中的 `key`, `actual`, `expected` 等上下文信息。
3. 处理 `isCriticalBranch` 标记。

### 4.6. `validate` (位于 `src/validate/core.ts`)

这是核心递归入口。它不再修改外部状态，而是通过组合子项返回的 `MatchResult` 来构建最终结果。

```typescript
export async function validate(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<MatchResult>
```

## 5. 如何扩展

### 5.1. 新增自定义评分策略

1. **实现 `ScoringStrategy` 接口**:
    创建一个新的 TypeScript 文件 (例如 `src/validate/strategies/my-custom.ts`)，并实现 `distribute` 和 `aggregate` 方法。

    ```typescript
    // src/validate/strategies/my-custom.ts
    import { ScoringStrategy, MatchResult, AIScoreConfig } from '../types.js';

    export const myCustomStrategy: ScoringStrategy = {
      distribute(items: (AIScoreConfig | null)[], options?: { totalUnassignedWeight?: number }) {
        // 实现你的分数分发逻辑，例如：每个子项分配全额权重 (独立模式)
        return Array(items.length).fill(1.0);
      },
      aggregate(results: MatchResult[], weights: number[]) {
        // 实现你的分数聚合逻辑
        // 示例：基础分 - 失败项数量 * 0.1
        let earnedSum = 0;
        let failedCount = 0;
        let allFailures = [];

        for (const res of results) {
            earnedSum += res.score;
            if (!res.pass) {
                failedCount++;
            }
            allFailures.push(...res.failures);
        }

        const finalScore = Math.max(0, (earnedSum / results.length) - failedCount * 0.1);
        return {
            score: finalScore,
            pass: failedCount === 0,
            failures: allFailures
        };
      }
    };
    ```

2. **注册策略**:
    在 `src/validate/strategies.ts` 的 `strategies` 对象中注册你的新策略。

    ```typescript
    // src/validate/strategies.ts
    import { myCustomStrategy } from './strategies/my-custom.js'; // 导入你的策略
    // ...
    export const strategies: Record<string, ScoringStrategy> = {
      // ... 现有策略
      'my-custom': myCustomStrategy,
    };
    ```

### 5.2. 自定义算子 (Custom Operator) 与置信度返回

如果你有一个通过 `loadOperators` 加载的自定义算子：

```typescript
// custom-ops.js (或 .ts)
export function myFuzzyMatcher(actual, expected, ctx, validate) {
  // 假设这是一个文本相似度匹配器
  const similarity = calculateTextSimilarity(actual, expected);

  if (similarity > 0.95) {
    return true; // 完全匹配 -> score: 1.0, pass: true
  }
  if (similarity > 0.7) {
    return similarity; // 返回 0.7 到 0.95 之间的置信度 -> pass 取决于 ctx.threshold
  }
  // 如果你需要同时返回分数和消息
  if (similarity > 0.5) {
    return { score: similarity, message: `Partial match (similarity: ${similarity.toFixed(2)})` };
  }
  return `Similarity ${similarity.toFixed(2)} is too low.`; // 失败消息 -> score: 0.0, pass: false
}
```

系统会通过 `processValidationResult` 自动处理这些返回值，将其归一化为 `MatchResult`。

### 5.3. 配置评分策略

你可以在测试的预期值中，通过 `score` 字段来指定评分策略和阈值。

```yaml
# AITestFixture 示例
title: "使用自定义评分策略的测试"
input:
  text: "Hello world, this is a test."
expected:
  output:
    message:
      # 在这个字段上使用模糊匹配算子
      $myFuzzyMatcher:
        $value: "hello world, this is a sample text"
        score:
          value: 10              # 权重为 10
          strategy: weighted     # 显式指定聚合策略 (虽然此处可能不是容器)
          threshold: 0.8         # 阈值为 0.8，如果 $myFuzzyMatcher 返回分数低于 0.8 则标记失败
```

或者，你可以在一个容器（如对象或数组）上定义策略：

```yaml
# AITestFixture 示例
title: "对象评分策略"
input:
  data:
    propA: "valueA"
    propB: "valueB"
expected:
  data:
    score:
      value: 100
      strategy: weighted # 该对象内部的子项分数将按权重累加
    propA: "valueA"
    propB:
      $myCustomOperator: "expectedValueB"
      score:
        threshold: 0.7 # propB 的阈值
```

通过这套架构，我们可以更灵活、更精确地评估 AI 模型的输出，为测试结果提供更丰富的洞察。
