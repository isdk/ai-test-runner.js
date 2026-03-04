# AI 测试评分策略架构与扩展指南

## 1. 引言

在 AI 应用的测试中，传统的二元验证（通过/失败）往往无法充分捕捉大型语言模型（LLM）输出的细微差别。本架构旨在实现**验证结果（Pass/Fail）与得分（Score）的分离**。即使测试因为某些关键性失败（“红线”）而被标记为不通过，其计算出的得分仍然能提供量化的表现评估。

## 2. 核心理念

* **分数与结果分离**：`critical` 标志（红线）控制状态；`score` 控制匹配度（0.0 - 1.0）。
* **多维度评价 (Dimensions)**：支持按标签（如安全、准确性）聚合得分。
* **双向评分 (Rewards & Penalties)**：支持正分（奖励）和负分（惩罚）。
* **虚拟容器 (Virtual Containers)**：逻辑算子默认作为虚拟层级存在，其子项结果直接容纳在父级，物理路径保持扁平。

## 3. 数据结构定义

### 3.1 AIScoreConfig (配置定义)

```typescript
export type AIScoreConfig =
  | number
  | {
      value: number;          // 权重或数值。正数为奖励，负数为惩罚。
      dimension?: string;     // 维度名称
      critical?: boolean;      // 红线标记
      strategy?: string;       // 指定聚合策略
      threshold?: number;      // 置信度通过阈值
      [key: string]: any;
    }
```

### 3.2 MatchResult (结果输出)

```typescript
export interface MatchResult {
  score: number;                // 0.0 - 1.0
  pass: boolean;
  failures: AIValidationFailure[];
  details?: MatchResultDetail[];   // 详情树
  title?: string;
  dimension?: string;
  critical?: boolean;
}
```

## 4. 执行环境 (ValidationContext)

`ValidationContext` 提供了极致 KISS 的算子开发助手：

* **`ctx.createChildContext(keyOrIndex, count)`**: 核心路径生成器。
    * **变量模板系统**：支持在 `operatorStrategy` (string) 中使用变量。
        * `$key`: 元素的键名或数组索引。
        * `$operator`: 容器算子的名称（如 `$and`）。
        * `$index`: 纯数字索引。
        * `$count`: 子元素总数。
    * **幽灵层优化**：当 `count === 1` 且处于虚拟模式时，自动穿透，不增加路径层级。
* **`ctx.distribute(items)`**: 权重分配器。自动根据当前策略计算各子项的归一化权重（0.0-1.0）。
* **`ctx.aggregate(results, weights)`**: 结果聚合器。执行当前上下文关联的策略（如 `weighted` 或 `max`）进行结果归并。

## 5. 开发自定义算子

算子在逻辑上分为两类，其开发模式略有不同：

### 5.1 原子断言算子 (Atomic Assertions)

这类算子直接对 `actual` 进行校验，通常作为叶子节点。

* **示例**: `$exists`, `$schema`, 模糊匹配算子。
* **开发模板**:

    ```javascript
    export async function myAssertion(actual, expected, ctx) {
      const isMatch = check(actual, expected);
      // 返回布尔、数字或 MatchResult
      return { score: isMatch ? 1 : 0, pass: isMatch };
    }
    // myAssertion.virtual = true; // 默认为虚拟以减少路径层级
    ```

### 5.2 逻辑容器算子 (Logic Containers)

这类算子负责组织多个子项的校验逻辑，通常包含递归调用。

* **示例**: `$and`, `$or`, `$all`。
* **开发模板**:

    ```javascript
    export async function myContainer(actual, expectedList, ctx, validateMatch) {
      const weights = ctx.distribute(expectedList);
      const results = [];
      for (let i = 0; i < expectedList.length; i++) {
        // 使用 createChildContext 自动处理变量替换
        const subCtx = ctx.createChildContext(i, expectedList.length);
        results.push(await validateMatch(actual, expectedList[i], subCtx));
      }
      return ctx.aggregate(results, weights);
    }
    myContainer.virtual = true; // 声明为虚拟容器（逻辑容纳）
    myContainer.strategy = 'weighted'; // 锁定其本质聚合逻辑
    ```

## 6. 路径自动化契约 (递归修补)

系统遵循 **“每一层递归负责自身身份标识”** 的原则：

1. **策略层 (Strategy)**：仅负责子项结果收集，禁止修改或猜测路径 Key。
2. **核心层 (Core)**：`validate` 函数在出口处通过 `patchMatchResult` 固化身份。
    * **物理层 (Physical)**：若当前 Key 有值且未被子项代表，则包装一层 `MatchResultDetail`。
    * **虚拟层 (Virtual)**：若当前 Key 为空，直接渗透元数据，实现路径穿透。

## 7. 核心分发逻辑顺序 (Dispatch Order) - 业务红线

**教训复盘**：严禁随意调整 `core.ts` 中的 `validate` 分发顺序。分发优先级必须遵循 **“从特异到通用”** 的原则，否则会导致逻辑拦截失效。

### 正确的优先级顺序

1. **算子探测 (Operator Detection)**：若对象符合算子特征（只有算子键），优先进入算子逻辑。
2. **正则探测 (Regex)**：必须优先于字符串，支持 `RegExp` 对象和特定格式字符串。
3. **字符串匹配 (String)**。
4. **数组递归 (Array)**：必须在通用对象判定之前（JS 中 `typeof [] === 'object'`）。
5. **自定义函数 (Function)**。
6. **模型验证 (JSON Schema)**：必须在通用对象判定之前，因为 Schema 本身是对象。
7. **普通对象校验 (Object)**：通用属性比对，作为对象的兜底。
8. **原始值校验 (Primitive)**：最终兜底。

## 8. 技术实现规范

1. **元数据持久化**：即使验证通过，也必须透传 `details` 和 `dimension`。
2. **空键含义**：`""` (空键) 代表“透明/虚拟”，不得随意合并或删除。
3. **算子主权**：算子内置策略优于用户配置，防止逻辑语义被篡改。
