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

1. **`AIScoreConfig`**: 用于在测试配置中定义评分参数，包括权重、红线标记、以及新的 `strategy` 和 `threshold`。
2. **`ValidationResult`**: 定义了自定义验证函数或算子可以返回的多种类型，以表达其验证结果的置信度。
3. **`ScoringStrategy` 接口**: 抽象了分数的“分发（Distribution）”和“聚合（Aggregation）”逻辑。
4. **`ValidationContext`**: 验证过程中的上下文对象，负责传递和管理当前的评分策略、阈值、已分配得分和已获得得分。
5. **`processValidationResult` 辅助函数**: 统一处理 `ValidationResult`，并据此更新 `ValidationContext` 中的得分和失败信息。
6. **`validateMatch` (核心验证函数)**: 协调整个验证流程，根据配置加载和应用评分策略。
7. **算子 (`$and`, `$or` 等)**: 调整为使用 `ValidationContext` 中定义的策略进行分数计算。

## 4. 详细设计

### 4.1. `AIScoreConfig` (位于 `src/types.ts`)

`AIScoreConfig` 现在可以是一个数字（表示权重），也可以是一个包含更多细节的对象。

```typescript
export type AIScoreConfig =
  | number
  | {
      value?: number;          // 相对权重或数值，默认为 1
      critical?: boolean;      // 如果为 true，则该项必须通过，否则整个测试失败
      strategy?: string;       // 指定用于此项及其子项的评分策略名称
      threshold?: number;      // 0-1 之间的数值，作为置信度通过的阈值，仅对叶子节点验证结果有效
      [key: string]: any;      // 策略可能需要的额外配置
    }
```

* `strategy`: 允许用户为特定节点（如对象、数组或算子）指定其子项的分数应该如何分发和聚合。如果未指定，将根据上下文（如算子类型）采用默认策略，或继承父级的策略。
* `threshold`: 当自定义验证返回置信度分数（0-1 之间）时，此阈值用于判断该项是否被视为“通过”。例如，如果 `threshold: 0.8` 且置信度为 `0.7`，则该项被标记为失败，但仍会保留 `0.7` 的得分。

### 4.2. `ValidationResult` (位于 `src/types.ts`)

为了支持自定义验证的置信度量化，我们扩展了验证函数或算子的返回值类型。

```typescript
export type ValidationResult =
  | boolean                  // true -> 通过 (100% 置信度); false -> 失败 (0% 置信度)
  | string                   // 失败消息 (0% 置信度)
  | number                   // 0-1 之间的置信度分数
  | {
      score: number;         // 0-1 之间的置信度分数
      message?: string;      // 失败消息
      pass?: boolean;        // 显式指定是否通过，覆盖阈值判断。如果未指定，则根据 `threshold` 判断
      [key: string]: any;
    }
```

### 4.3. `ScoringStrategy` 接口 (位于 `src/validate/types.ts`)

此接口定义了任何评分策略都必须实现的两个核心方法：

```typescript
export interface ScoringStrategy {
  /**
   * 计算一组项的权重。
   * @param items - 要分配得分的项列表（AIScoreConfig 或 null）。
   * @param totalCount - 项的总数。
   * @param options - 选项，例如 unassignedWeight。
   * @returns 归一化后的权重数组 (0.0 - 1.0)。
   */
  distribute(
    items: (AIScoreConfig | null)[],
    totalCount: number,
    options?: { unassignedWeight?: number }
  ): number[]

  /**
   * 将子上下文的结果聚合到父上下文。
   * @param parentCtx - 父上下文。
   * @param childrenCtxs - 已完成验证的子上下文列表。
   */
  aggregate(
    parentCtx: ValidationContext,
    childrenCtxs: ValidationContext[]
  ): void
}
```

* **`distribute`**: 负责计算每个子项应从父级 `allocatedScore` 中分配到的比例。
* **`aggregate`**: 负责根据所有子项的 `earnedScore`，计算并更新父级的 `earnedScore`。

**默认实现 (位于 `src/validate/strategies.ts`)**:

* **`weightedSumStrategy`**:
  * `distribute`: 根据 `AIScoreConfig.value` 字段进行归一化权重分配，所有权重之和为 1。
  * `aggregate`: 简单地将所有子项的 `earnedScore` 相加。适用于 `$and`、对象、数组等需要累加子项得分的场景。
* **`maxStrategy`**:
  * `distribute`: 每个子项都获得完整权重（权重为 1），意味着每个子项都可以尝试获得父级的全部 `allocatedScore`。
  * `aggregate`: 选取所有子项中最高的 `earnedScore`。适用于 `$or`、`$contains` 等只需要一个最佳匹配的场景。

这些策略通过 `getStrategy(name?: string): ScoringStrategy` 函数进行获取和管理。

### 4.4. `ValidationContext` (位于 `src/validate/types.ts`)

`ValidationContext` 扩展了 `strategy` 和 `threshold` 属性，它们在上下文创建和子上下文生成时会自动继承或被覆盖。

```typescript
export class ValidationContext {
  // ... 其他属性
  strategy?: ScoringStrategy; // 当前节点的评分策略实例
  threshold?: number;         // 当前节点的阈值

  constructor(options: MatchValueOptions = {}) {
    // ... 初始化其他属性
    this.strategy = options.strategy;
    this.threshold = options.threshold;
  }

  createSubContext(
    subKey: string,
    options: Partial<MatchValueOptions> = {}
  ): ValidationContext {
    // ... 继承和覆盖 strategy 和 threshold
    return new ValidationContext({
      // ... 复制父级属性
      strategy: this.strategy,
      threshold: this.threshold,
      ...options,
    })
  }
  // ...
}
```

### 4.5. `processValidationResult` (位于 `src/validate/utils.ts`)

这个辅助函数统一了对 `ValidationResult` 的处理逻辑，包括：

1. 解析置信度分数和消息。
2. 根据 `ctx.threshold` 或 `ValidationResult.pass` 字段判断是否通过。
3. 计算并增加 `ctx.earnedScore` (`earnedScore += allocatedScore * confidence`)。
4. 如果未通过，则添加相应的 `AIValidationFailure`。

### 4.6. `validateMatch` (位于 `src/validate/core.ts`)

`validateMatch` 是核心验证入口，它会根据当前 `expected` 值的类型和 `AIScoreConfig` 中的 `strategy` 字段，动态选择合适的策略：

* **对于函数类型的 `expected`**: 直接调用函数，并通过 `processValidationResult` 处理其返回值。
* **对于数组和对象**: 首先通过 `getScoreConfig` 提取当前节点的 `strategy` 和 `threshold`。然后，使用 `ctx.strategy.distribute` 计算子项的 `allocatedScore`，再递归调用 `_validateMatch` 处理子项，最后使用 `ctx.strategy.aggregate` 汇总所有子项的得分。
* **对于其他匹配类型（如 RegExp, string）**: 直接计算得分，并可能通过 `processValidationResult` 处理。

## 5. 如何扩展

### 5.1. 新增自定义评分策略

1. **实现 `ScoringStrategy` 接口**:
    创建一个新的 TypeScript 文件 (例如 `src/validate/strategies/my-custom.ts`)，并实现 `distribute` 和 `aggregate` 方法。

    ```typescript
    // src/validate/strategies/my-custom.ts
    import { ScoringStrategy, ValidationContext, AIScoreConfig } from '../types.js';
    import { calculateNormalizedWeights } from '../utils.js'; // 如有需要

    export const myCustomStrategy: ScoringStrategy = {
      distribute(items: (AIScoreConfig | null)[], totalCount: number, options?: { unassignedWeight?: number }) {
        // 实现你的分数分发逻辑，例如：
        // - 如果 totalCount > 0，则每个项都分配 1.0 的权重（如果需要独立分数）
        // - 或根据特定规则计算权重
        return Array(totalCount).fill(1.0); // 示例：每个都分配全额权重
      },
      aggregate(parentCtx: ValidationContext, childrenCtxs: ValidationContext[]) {
        // 实现你的分数聚合逻辑，例如：
        // - 惩罚机制：从满分开始，每有一个失败子项扣除一定分数
        // - 平均分：所有子项的平均分
        let earnedSum = 0;
        let failedCount = 0;
        for (const child of childrenCtxs) {
            earnedSum += child.earnedScore;
            if (child.failures.length > 0) {
                failedCount++;
            }
        }
        // 示例：基础分 - 失败项数量 * 10
        // parentCtx.earnedScore += Math.max(0, parentCtx.allocatedScore - failedCount * 10);
        parentCtx.earnedScore += earnedSum; // 简单示例
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
export function myFuzzyMatcher(actual, expected, fixture) {
  // 假设这是一个文本相似度匹配器
  const similarity = calculateTextSimilarity(actual, expected);

  if (similarity > 0.95) {
    return true; // 完全匹配
  }
  if (similarity > 0.7) {
    return similarity; // 返回 0.7 到 0.95 之间的置信度
  }
  // 如果你需要同时返回分数和消息
  if (similarity > 0.5) {
    return { score: similarity, message: `Partial match (similarity: ${similarity.toFixed(2)})` };
  }
  return `Similarity ${similarity.toFixed(2)} is too low.`; // 失败消息
}
```

系统会通过 `processValidationResult` 自动处理这些返回值，根据分数更新 `earnedScore`，并根据 `threshold`（如果配置了）判断是否产生失败。

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
