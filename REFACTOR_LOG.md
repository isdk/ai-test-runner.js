# Validation Operators Refactoring Log (2026-02-23)

## 目标
本次重构旨在统一验证算子（Validation Operators）的接口与行为，使其与第三方（自定义）算子的约定保持一致，即所有算子都返回 `ValidationResult`，并通过 `MatchResult` 结构实现验证结果的“纯粹化”传递，而非直接修改 `ValidationContext`。

## 主要变更点

### 1. 核心类型定义 (`src/validate/types.ts`)
- **新增 `MatchResult` 接口**：
  ```typescript
  export interface MatchResult {
    score: number;    // 0 到 1 之间的归一化置信度
    pass: boolean;    // 是否通过验证
    failures: AIValidationFailure[]; // 本次匹配产生的错误
  }
  ```
- **修改 `ValidateMatchFn` 签名**：
  从 `Promise<AIValidationFailure[]>` 修改为 `Promise<MatchResult> | MatchResult`，以支持同步或异步返回 `MatchResult` 对象。
- **修改 `ValidationOperatorHandler` 签名**：
  从 `Promise<AIValidationFailure[]>` 修改为 `Promise<ValidationResult> | ValidationResult`，要求所有算子返回更灵活的 `ValidationResult` 类型。

### 2. `processValidationResult` 功能增强 (`src/validate/utils.ts`)
- `processValidationResult` 函数现在返回一个 `MatchResult` 对象。
- 引入 `updateCtx` 选项（默认为 `true`），允许调用者控制是否将 `MatchResult` 的结果应用到 `ValidationContext` 上，从而实现更纯粹的算子行为。

### 3. `validateStringDiff` 重构 (`src/validate/diff.ts`)
- `validateStringDiff` 函数不再直接修改 `ctx.earnedScore` 和 `ctx.failures`。
- 其返回类型修改为 `Promise<MatchResult>`，将所有分数计算和失败信息封装在 `MatchResult` 对象中返回。

### 4. `validateJsonSchema` 重构 (`src/validate/schema.ts`)
- `validateJsonSchema` 函数不再直接修改 `ctx.earnedScore` 和 `ctx.failures`。
- 其返回类型修改为 `Promise<MatchResult>`，将验证结果和失败信息封装在 `MatchResult` 对象中返回。

### 5. 所有内置算子重构 (`src/validate/operators/*.ts`)
包括 `$exists`, `$expect`, `$schema` (operator), `$or`, `$and`, `$all`, `$not`, `$diff` (operator), `$sequence`。
- 所有这些算子的返回类型都修改为 `Promise<ValidationResult>`。
- 算子内部不再直接调用 `ctx.addFailure` 或修改 `ctx.earnedScore`。
- 算子现在关注于计算其逻辑结果，并以 `ValidationResult` 的形式返回，最终由调用链上层（`_validateMatch` 和 `processValidationResult`）统一处理和应用到 `ctx`。
- **特别地**：
    - `$expect` 现在直接返回 `validateMatch` 的结果。
    - `$or` 和 `$and` 等逻辑算子现在通过组合子匹配的 `MatchResult` 来计算自身的得分和失败。
    - `$contains` 和 `$sequence` 等也调整为返回 `MatchResult`，并聚合其子匹配的结果。

### 6. `wrapCustomOperator` 调整 (`src/validate/loader.ts`)
- `wrapCustomOperator` 现在直接返回 `processValidationResult` 的结果，以适配新的 `ValidationOperatorHandler` 签名。

### 7. `_validateMatch` 核心逻辑重构 (`src/validate/core.ts`)
- `_validateMatch` 现在返回 `Promise<MatchResult>`。
- 所有内部递归调用（包括对算子、`validateStringDiff`、`validateJsonSchema` 等的调用）都获取并处理其返回的 `MatchResult`。
- `_validateMatch` 内部通过组合子匹配的 `MatchResult` 来计算自身的最终得分和失败列表。
- 不再直接修改传入 `ctx` 的 `earnedScore` 和 `failures`。

### 8. 顶层 `validateMatch` 函数 (`src/validate/core.ts`)
- `validateMatch` 函数作为外部入口，负责调用 `_validateMatch` 获取最终的 `MatchResult`。
- 它将 `_validateMatch` 返回的 `MatchResult` 的 `score` 和 `failures` 应用到传入的 `ValidationContext` (即 `ctx.earnedScore += ctx.allocatedScore * result.score; ctx.failures.push(...result.failures);`)，从而保持与外部接口的兼容性。

## 达成目标
通过以上重构，我们实现了：
- **统一的返回约定**：所有算子和核心匹配逻辑都通过 `MatchResult` 或 `ValidationResult` 传递结果。
- **纯粹的算子行为**：算子内部不再直接操作全局上下文状态，而是专注于计算和返回自身的结果。
- **清晰的职责分离**：分数累积和失败收集的逻辑统一在 `_validateMatch` 和 `processValidationResult` 中处理。
- **更好的可维护性**：逻辑更清晰，副作用更少，单元测试更容易编写。

---

# Phase 2 & 3: True Pure Function Implementation (2026-02-23 Evening)

## 核心架构升级：彻底的“真·纯函数”模式
在初步重构的基础上，我们发现依然存在“上下文副作用”导致的评分失效和错误信息重复问题。因此，我们执行了更彻底的架构升级，完全移除了 `ValidationContext` 的可变状态，转为纯粹的 Input/Output 流。

### 1. `ValidationContext` 变为只读环境 (`src/validate/types.ts`)
- **移除**：`failures`, `failedCritical`, `earnedScore`, `addFailure()`。
- **保留**：`key`, `strict`, `operators`, `scoring`, `strategy` 等配置信息。
- **角色转变**：不再作为状态容器，仅作为环境上下文（Scope & Config）传递给下游。

### 2. `ScoringStrategy` 纯逻辑化 (`src/validate/types.ts` & `strategies.ts`)
- **接口变更**：`aggregate(parentCtx, childrenCtxs)` -> `aggregate(results: MatchResult[], weights: number[]): MatchResult`。
- **实现变更**：
  - `weighted`: 计算加权平均分，如果任意子项失败（pass=false），则整体 fail（除非配置允许部分成功，目前逻辑倾向于严格）。收集所有子项的 `failures`。
  - `max`: 取最高分子项的结果。如果所有子项都失败，返回最高分对应的结果（及所有失败详情）。

### 3. 错误处理机制升级：Auto-Backfill (`src/validate/utils.ts`)
- **移除**：`processValidationResult` 中的 `updateCtx` 选项（副作用被彻底移除）。
- **增强**：引入“自动回填”机制。
  - 当算子返回 `failures` 时，不需要显式填写 `key`。
  - `processValidationResult` 会自动将当前 `ctx.key` 填充到所有未指定 key 的 failure 中。
  - 根据 `ctx.isCriticalBranch` 自动标记 `failure.critical = true`。

### 4. 核心路由纯粹化 (`src/validate/core.ts`)
- **`validateMatch` (Public API)**：
  - 负责创建初始 `Context`。
  - 调用 `_validateMatch` 获取最终 `MatchResult`。
  - **兼容性处理**：如果传入的 `options` 包含 `failures` 数组，则将结果 push 进去（保留对旧调用方式的兼容）。
  - 返回 `result.failures`。
- **`_validateMatch` (Internal Router)**：
  - 完全重写为纯路由（Router）。
  - 拆分为独立处理函数：`validateObject`, `validateArray`, `validateOperator`, `validatePrimitive`。
  - 所有逻辑分支（包括 Template formatting）都通过返回值传递结果，绝不修改 Context。

### 5. 算子全量适配 (`src/validate/operators/*.ts`)
- **通用变更**：移除所有 `ctx.earnedScore` 读取和修改；移除 `processValidationResult` 的 `updateCtx` 参数。
- **`$and`**: 收集所有子项 `MatchResult` -> `strategy.aggregate`。
- **`$or`**: 收集所有子项 `MatchResult` -> `maxStrategy.aggregate`。
- **`$not`**: 调用 `validateMatch` -> 反转 `score` 和 `pass`。
- **`$all`**: 迭代 Expected List -> 调用 `validateContains` -> 收集结果 -> `strategy.aggregate`。
- **`$contains`**: 迭代 Actual Array -> 寻找最佳匹配 -> 返回最佳结果。
- **`$sequence`**: 顺序匹配逻辑保持不变，但内部使用纯函数调用。

## 达成效果
1.  **评分逻辑修复**：通过 `aggregate(results, weights)`，分数的计算完全基于子节点返回值，解决了“EarnedScore 永远为 0”的 Bug。
2.  **错误信息去重**：由于 Context 不再共享 `failures` 数组，错误信息只在通过 `MatchResult` 向上冒泡时被收集一次，彻底消除了指数级重复。
3.  **调试友好**：每个算子返回的 `MatchResult` 包含了该算子视角下的完整结果，便于定位问题。
4.  **类型安全**：新的 `MatchResult` 接口强制要求 `pass` 和 `failures`，消除了模糊状态。

## 下一步计划
- **验证**：运行单元测试，验证新架构的正确性。
- **清理**：检查是否有未使用的旧代码或类型定义。

---

# Phase 4: Weight Calculation & Scoring Logic Refinement (2026-02-23 Night)

## 核心目标：量纲统一与智能分配
解决由于“原始分数”与“置信度（0-1）”混用导致的权重分配混乱，实现自洽的“保障性分配”策略，并修复 `max` 策略和 `diff` 验证中的分值污染问题。

## 主要变更点

### 1. 权重计算逻辑重构 (`src/validate/utils.ts`)
- **函数重构**：`calculateNormalizedWeights` 进行了彻底重写。
  - **参数简化**：移除 `totalCount`，直接以数组长度为准。
  - **量纲统一**：所有显式权重统一先除以 `scale` (max of `maxScore` and `maxExplicit`) 映射到 0-1 空间。
  - **智能启发式 (`autoConfidence`)**：自动识别 `[0, 1)` 区间的小数为置信度，而 `>= 1` 的值为原始分数。支持 `'force'` 模式强制跳过启发式。
  - **保障性分配**：引入 `totalUnassignedWeight`（原 `unassignedWeight` 重命名），为未定义项提供“低保”预算。如果空间不足，则同比压缩显式项权重。
  - **模式切换**：新增 `normalize` 选项（默认 `true`）。
    - `true`：确保总和为 1.0（用于 AND 逻辑）。
    - `false`：保持各分支独立置信度（用于 OR 逻辑）。

### 2. 接口与调用方同步更新
- **接口变更**：`ScoringStrategy.distribute` 移除了 `totalCount` 并更新了配置参数名。
- **全量适配**：更新了 `strategies.ts`, `core.ts`, `diff.ts` 及所有逻辑算子（`$and`, `$or`, `$all`, `$sequence`）的调用代码，移除了冗余参数。

### 3. 评分策略优化 (`src/validate/strategies.ts`)
- **`maxStrategy` 升级**：修改 `aggregate` 逻辑，从简单的 `max(score)` 变更为 `max(score * weight)`。这确保了在 OR 分支中，用户定义的权重分值能正确反映在最终得分上。

### 4. `diff` 验证逻辑精细化 (`src/validate/diff.ts`)
- **职责分离**：提取 `hasDiffChanges` 辅助函数。
- **结构化逻辑**：将 `validateStringDiff` 划分为四个明确场景：
  1. **复杂评分**：基于显式 `diff items` 列表进行加权置信度计算。
  2. **自定义验证**：执行用户函数并根据其结果评分。
  3. **基础匹配失败**：当仅使用 diff 作为报错展示（无 items 列表）时，若不匹配则强制 `score = 0`，避免了之前“失败也得满分”的 Bug。
  4. **完全匹配**：直接给满分。
- **部分分保留**：明确了即便 `pass: false`（如由于严格模式），只要有部分匹配项，对应的权重得分仍会保留并冒泡。

### 5. 测试用例验证
- 修复了 `scoring.test.ts` 中关于 `$or` 策略、`unassignedWeight` 自动缩放以及 `diff` 严格模式下的多个测试断言。
- 验证了混合使用“小数置信度”与“整数原始分”时，系统能正确进行自动换算和归一化。

## 达成效果
1.  **逻辑自洽**：彻底消除了 80 分与 0.1 置信度在同一个数组里加和的数学错误。
2.  **语义清晰**：参数命名（`totalUnassignedWeight`, `normalize`, `autoConfidence`）更符合业务直觉。
3.  **健壮性**：`diff` 验证不再意外污染总分，且支持在失败时保留部分匹配分，提高了 AI 评估的灵活性。
