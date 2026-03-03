# 评分系统修订历史记录 (2026-03-03)

## 1. 修订背景

为了支持更复杂的 AI 代理（Agent）评估需求，需要从单一的 Pass/Fail 验证转向多维度、可量化的评估体系。本次修订引入了多维度标签、直观扣分逻辑以及深层得分回溯能力。

## 2. 核心改动点

### A. 数据结构增强

- **MatchResult**: 增加了 `title`, `dimension`, `critical` 和 `details` 字段。
- **AIScoreConfig**: 增加了对负数 `value` 的支持，以及 `dimension` 属性。
- **AITestLogItem**: 增加了 `scoreDetails` 用于存储完整的得分树。

### B. 算法优化

- **calculateNormalizedWeights**:
  - 实现了正负分流逻辑。
  - 正数项（奖励）按 Balanced 模式瓜分 1.0 预算。
  - 负数项（惩罚）按相同 scale 独立计算，不参与预算瓜分。
- **weightedSumStrategy**:
  - 实现了负权重聚合。
  - 引入了**虚拟失败注入**逻辑：当 Critical 惩罚项匹配成功时，由于底层返回 pass: true，必须手动注入 failure 才能保证红线判定生效。

### C. 路径系统对齐

- **算子透明化**: 将 `$and` 和 `$or` 设为透明，但在其对应的 Handler 内部通过 `createSubContext('$and[i]')` 手动补全索引。
- **理由**: 解决了路径冗余（如 `$and[0].$or`）与诊断精确度之间的矛盾。

## 3. 核心业务逻辑锚点 (防误删/误改指南)

在后续维护中，请务必保留以下逻辑，除非有明确的架构重构计划：

1. **utils.ts / processValidationResult**:
    - **必须保留**: 即使 `pass: true` 也要提取 `details`、`dimension` 和 `title`。
    - **后果**: 移除会导致得分报告变为空白，多维度评分功能失效。

2. **strategies.ts / weightedSumStrategy**:
    - **必须保留**: 惩罚项匹配成功时的虚拟 failure 注入。
    - **后果**: 移除会导致标记为 `critical` 的负分项无法触发测试失败。

3. **core.ts / validateOperator**:
    - **必须保留**: 对 `res.details` 的原地修补逻辑（Patching）。
    - **后果**: 移除会导致详情树层级过深或丢失 `title`/`dimension` 元数据。

4. **operators/and.ts & or.ts**:
    - **必须保留**: 手动生成 `$and[${i}]` 路径。
    - **后果**: 由于算子已设为透明，移除此逻辑会导致所有分支路径冲突，报错信息将无法区分是哪个分支。

## 4. 验证情况

已通过以下全量测试：

- `test/validate/logic-operators.test.ts` (逻辑路径准确性)
- `test/scoring.details.test.ts` (新功能：扣分、维度、详情)
- `test/scoring.test.ts` (评分聚合一致性)
- `test/operators.test.ts` (路径追踪回归)
