# @isdk/ai-test-runner

> 【[English](./README.md)|中文】
---

一个轻量级、完全解耦的 AI 脚本、智能体及提示词测试核心引擎。它通过一套强大的验证框架，帮助开发者高效、可靠地测试 LLM 输出。

## 核心特性

- **🧩 完全解耦**：核心逻辑独立于环境，可集成到任意 Node.js, 浏览器或 CI/CD 流水线。
- **📐 多样化验证**：支持字符串、正则、深度对象匹配，以及 $contains, $all, $sequence 等高级操作符。
- **🛠️ 专为工具优化**：内置 AI 函数（Tools）测试简化方案，支持验证复杂的工具调用序列。
- **📝 强大模板系统**：支持变量注入、深度递归解析和动态正则键名。
- **🌓 语义化差异匹配**：支持白名单模式定义“允许的输出偏差”，告别因换行或标点导致的测试失败。

## 安装

```bash
pnpm add @isdk/ai-test-runner
```

## 快速上手

只需三步，即可在项目中运行 AI 测试。我们推荐使用 `expect.output` 进行结果验证：

### 1. 实现执行器 (AIScriptExecutor)

```typescript
import { AITestRunner, AIScriptExecutor } from '@isdk/ai-test-runner';

const myExecutor: AIScriptExecutor = {
  async execute({ script, args }) {
    // 对接你的 AI 调用逻辑
    return { output: "Hello World", messages: [] };
  }
};
```

### 2. 定义测试用例 (Fixtures)

```typescript
const fixtures = [
  {
    input: "你好",
    expect: {
      output: /Hello/i  // 推荐：使用 expect.output 代替顶层 output
    }
  }
];
```

### 3. 运行测试

```typescript
const runner = new AITestRunner(myExecutor);
const result = await runner.run('my-script-id', fixtures);
```

---

## 详细功能指南

### 1. 验证引擎 (Validation Engine)

验证引擎是测试的核心，支持通过 `expect` 对象定义复杂的断言。注意，你可以在单个测试用例中同时使用顶层 `output` 和 `expect` 对象。

**示例：同时进行多种验证**

```yaml
- input: { name: 'Alice' }
  output: "Hello Alice"  # 验证主输出字符串
  expect:
    messages:            # 验证内部执行链路
      $contains: { role: 'assistant', content: /Alice/ }
```

#### 1.1 基础匹配 (`expect.output`)

支持字符串、正则表达式和数值校验。

- **正则示例**：验证输出是否包含特定模式。

  ```yaml
  expect:
    output: "/^Hello, .+\\!$/i" # 匹配 "Hello, Alice!"
  ```

- **正则模板支持**：你可以在正则对象或正则字符串中使用模板。

  ```yaml
  - input: { name: 'Alice' }
    output: "/{{name}}/i"  # 将被解析为 /Alice/i
  ```

#### 1.2 高级集合与逻辑操作符

针对复杂验证场景，提供强大的逻辑、集合以及特化断言能力：

**逻辑与集合：**

- **`$and`**: **逻辑与**。传入一个条件数组，实际值必须满足数组中的**所有**验证条件才能通过。适用于需要同时满足多个独立规则的场景。
- **`$or`**: **逻辑或**。传入一个条件数组，实际值只要满足数组中的**任意一个**验证条件即算通过。系统会尝试所有的分支，并在匹配成功时自动采用得分最高的分支。
- **`$not`**: **逻辑非（反向断言）**。如果实际值匹配了 `$not` 中定义的预期模式，则该断言失败；反之则通过。常用于黑名单检测，如 `$not: /敏感词/`。
- **`$contains`**: **包含性探测**。其行为会根据你验证的目标类型智能调整：
  - 若目标是**数组**，则验证数组中是否**至少包含一个**满足预期模式的项。
  - 若目标是**字符串**，则执行子串包含匹配。
  - 若目标是**对象**，则执行部分键值对（子集）匹配。
- **`$all`**: **全子集包含（无序）**。要求实际的**数组**必须包含 `$all` 中列出的**所有**预期项，无需关心元素在数组中出现的顺序，也不限制数组中是否存在其他未声明的额外元素。
- **`$each`**: **元素级遍历验证**。要求实际的**数组**中的**每一个元素**都必须符合给定的**单一**验证规则。如果数组为空则默认通过；评分时自动将权重均分给动态数量的每个数组项。非常适合进行一致性断言，例如：`$each: { status: 'active' }`。
- **`$sequence`**: **有序序列探测**。要求实际的**数组**必须按预期顺序依次出现指定的项。允许预期项之间安插了未声明的干扰项（即不是严格的连续匹配，而是相对顺序匹配）。适合用于校验大模型多轮按步骤的工具调用链路。
- **`$exists`**: **存在性校验**。验证对象的某个属性是否存在。支持多种模式：
  - 简写模式：`$exists: true | false`（用于验证值是否不为 `undefined`）。
  - 严格模式：`$exists: { $value: false, strict: true }`（严格检查该键是否存在于对象自身的键集合中）。

**数组处理与变幻算子 (Array Processing & Transformation)：**

- **`$sort`**: **数据排序**。在执行后续断言前，先对实际的数组数据进行排序。通过 `$by` 属性指定排序规则。排序完成后，算子会将剩余的期望断言规则继续应用在排好序的新数组上。非常适合与 `$first`, `$last` 提取或 `$sequence` 序列断言组合使用（即“流式包装处理”）。
  - **`$by`**: 定义排序标准。支持多种格式：
    - **字符串**：属性名。在字段名前加 `-` 前缀表示降序排列（如：`"-score"`）。
    - **函数**：自定义同步或异步 JavaScript 函数 `(item, index, array) => value`。
    - **表达式对象**：`{ "$expr": "string", "order": "asc" | "desc" }`。在表达式中可访问 `item`, `index`, `array`, `data`, `input` 和 `ctx` 等上下文变量。
    - **数组**：支持将上述格式组合为数组，进行多层级排序（例如：先按类型升序，再按分数降序）。
  - 用法示例：

    ```yaml
    $sort:
      $by:
        - { $expr: "item.score * 1.2", order: "desc" }
        - "-createdAt"
      $first: { status: "success" }
    ```

- **`$nth`**: **按索引提取元素**。从实际数组中取回指定 `$index` 位置的元素，并将其送入剩余的期望断言中进行独立校验。支持负数索引（如 `-1` 代表提取最后一个元素），并会在路径追踪引擎中精准补齐所在数组的索引层级，同时自带越界保护。
  - 用法示例：`$nth: { $index: 1, status: "success" }`
- **`$first`**: **提取第一个元素**。这是 `$nth: { $index: 0 }` 的便捷语法糖，极其符合自然语言直觉地提取数组首个元素进行断言。
- **`$last`**: **提取最后一个元素**。这是 `$nth: { $index: -1 }` 的便捷语法糖，用于快速提取数组末尾元素独立校验。

**关系与比较操作符（Comparison）：**

- **`$eq`, `$ne`**: **相等与不等**。严格验证实际值是否等于 (`$eq`) 或不等于 (`$ne`) 预期值。
- **`$gt`, `$gte`, `$lt`, `$lte`**: **数值范围比较**。验证实际值是否大于 (`$gt`)、大于等于 (`$gte`)、小于 (`$lt`) 或小于等于 (`$lte`) 预期值。尤其适合评估长短、打分、阈值等数值/关系约束。
- **`$in`, `$nin`**: **数组内包含**。验证实际值是否存在于 (`$in`) 或不存在于 (`$nin`) 给定的预期数组（列表）中。

**表达式算子（Expression）：**

- **`$expr`**: **动态表达式求值（Expression Operator）**。最符合前端直觉的语法，支持以 JavaScript 语法传入一段动态计算公式字符串，实现极度灵活的跨字段、算数运算或异步处理的逻辑判断。
  - 能向表达式沙盒中自动注入强大的上下文变量（如：`actual`, `expected`, `data`, `fixture`, `ctx` 等）。
    - `fixture`: 当前 fixture 的信息
      - `title`
      - `input`
      - `output`
      - `outputSchema`
      - etc
  - **进阶技巧：实现缺失的核心算子功能**
    由于框架目前不提供内置的 `$length`、`$keys` 或 `$values` 算子，你可以通过 `$expr` 轻松实现：
    - **检查数组长度**：`$expr: "actual.length === 5"` 或动态比较 `$expr: "actual.length >= data.minSize"`。
    - **提取并验证对象键（Keys）**：`$expr: "Object.keys(actual).includes('id')"` 或验证键的正则表达式 `$expr: "Object.keys(actual).some(k => /^user_/.test(k))"`。
    - **检查对象值（Values）是否存在**：`$expr: "Object.values(actual).includes('active')"`。
    - **复杂多属性联动**：`$expr: "actual.items.length > 0 && actual.status === 'success'"`。
  - 用法示例：相比冗长反直觉的嵌套算子，你可以简单地写 `$expr: "actual > data.min_score"` 或关联多属性 `$expr: "actual.price * actual.quantity >= 500 && data.userRole === 'admin'"`。

**特化操作符：**

- **`$expect`**: 虚拟容器，专门用于为任何验证节点注入评分元数据（权重、红线）或标题。[详见评分策略](#2-评分策略-scoring-strategy)。
- **`$diff`**: 强制使用特定策略或白名单进行语义化差分对比。[详见语义化差异匹配](#6-语义化差异匹配-diff)。
- **`$schema`**: 显式使用 JSON Schema 校验。 [详见 JSON Schema 验证](#5-json-schema-验证)。

**示例：使用逻辑与存在性操作符**

```yaml
expect:
  output:
    $and:
      - "/^Hello/"         # 必须以 Hello 开头
      - { $not: "/World/" } # 且不能包含 World
    metadata:
      author: { $exists: true }  # 必须有作者属性
      internal_id: { $exists: false } # 不能包含内部 ID
```

**示例：严格模式验证属性不存在**

```yaml
expect:
  output:
    legacy_field:
      $exists:
        $value: false
        strict: true  # 严格要求该键必须不在对象中（而不仅仅是值为 undefined）
```

**示例：使用逻辑操作符**

```yaml
expect:
  output:
    $and:
      - "/^Hello/"         # 必须以 Hello 开头
      - { $not: "/World/" } # 且不能包含 World
  messages:
    $or:
      - $contains: { role: 'assistant', tools: [{ name: 'get_user' }] }
      - $contains: { role: 'assistant', tools: [{ name: 'find_person' }] }
```

**示例：验证工具调用序列**

```yaml
expect:
  messages:
    $sequence:
      - { role: 'assistant', tools: [{ name: 'get_user' }] }
      - { role: 'assistant', tools: [{ name: 'send_email' }] }
```

#### 1.3 自定义校验函数

当声明式校验不足以覆盖需求时，可以使用函数：

```typescript
expect: {
  output: (actual, input) => actual.length > 10 || "输出长度不足"
}
```

#### 1.4 模板对象支持 (Template Object Support)

模板系统不仅支持字符串替换，还支持将“纯占位符”直接替换为原始对象。这在需要将输入数据中的复杂对象直接传递给验证器或作为预期输出时非常有用。

- **纯占位符替换**：如果模板字符串仅包含一个变量（例如 `{{user}}`），且数据中该变量是一个对象/数组/布尔值，则该模板将被替换为该值本身，而非字符串化的结果。
- **深度递归解析**：如果替换出的对象内部仍然包含模板，系统会自动进行递归解析。
- **复杂路径支持**：支持访问深层属性，如 `{{users[0].profile}}`。

**示例：直接验证对象**

```yaml
- input:
    user: { id: 1, name: 'Alice' }
  expect:
    output: "{{user}}"  # 结果直接为 { id: 1, name: 'Alice' }，支持深度对象匹配
```

### 2. 评分策略 (Scoring Strategy)

在 AI 这种非确定性（Non-deterministic）输出场景下，单纯的 Passed/Failed 往往过于武断。`ai-test-runner` 引入了一套强大的评分系统，能够量化 AI 的输出质量，并支持灵活的策略和模糊匹配。

#### 2.1 核心配置

你可以在 Fixture 或全局配置中开启评分：

- **`scoring`**: `true | false | 'auto'`。开启评分模式。
- **`maxScore`**: (默认 `100`) 本次测试的总分上限。该值也作为百分比权重分配的基准。
- **`passScore`**: (默认等于 `maxScore`) 判定测试通过（`passed: true`）所需的最低分值。
- **`unassignedWeight`**: (可选) `totalUnassignedWeight` 的别名。为没有显式设置 `score` 的验证项指定默认相对预算。
- **`totalUnassignedWeight`**: (可选，默认 `0.1`) 为所有未定义项预留的总预算。系统确保未定义项平分这一预算，避免权重被稀释。
- **`autoConfidence`**: (可选，默认 `true`) 自动将 0 到 1 之间的权重视为置信度。使用 `'force'` 可跳过启发式，强制视为置信度。

#### 2.2 分层相对权重与策略

评分系统采用 **“自上而下分配，自下而上聚合”** 的层级权重模型。分值会分配给子验证节点（例如，对象中的属性、数组中的元素、$and / $or 中的条件），然后聚合回父节点。具体的分配和聚合逻辑由 **评分策略 (Scoring Strategies)** 控制。

- **权重归一化**：在每一层级，Peer 项竞争分配父节点的 `allocatedScore`。
- **自动适配量级**：你可以使用 `0~1` 的百分比，也可以使用 `0~maxScore` 的整数分值，系统会自动识别并进行比例缩放。
- **动态分配**：如果某些项有分值而另一些没有，未标注项会根据所选策略和 `unassignedWeight` 分割剩余权重。

#### 2.3 分值元数据 (`$meta`) 与维度 (`$dimension`)

> **⚠️ 注意 (Breaking Change)**: 从 v1.x 开始，`score`, `title`, `critical`, `description`, `dimension` 等键名已回归业务数据，不再作为元数据过滤。
> **所有元数据必须通过 `$meta` 容器或带有 `$` 前缀的简写键定义。**

任何验证节点（字符串、正则、算子、对象字段）都可以通过 `$meta` 或直接在算子属性中注入分值元数据。

**推荐方式：使用 `$meta` 容器（显式模式）**
当存在 `$meta` 时，顶级命名空间保持清洁，您可以安全地校验同名的业务字段。

```yaml
someField:
  score: 100         # 业务数据：实际输出必须包含 score 字段
  $meta:
    score: 80        # 元数据：该项的验证权重
    title: "核心字段"
```

**快捷方式：使用 `$` 前缀（简写模式）**
当对象中**不含** `$meta` 时，可以使用 `$` 前缀的简写键：

```yaml
# score 可以是简写数字（奖励分或权重）
$score: 80

# 也可以是对象，支持负分（扣分）、维度标签和红线逻辑
$score:
  value: -20          # 负数表示扣分：匹配成功时从总分减去
  critical: true      # 红线项：如果此项不通过（奖励项）或匹配成功（惩罚项），passed 设为 false
$dimension: 'security' # 维度标签：用于生成多维度评估报告
$strategy: 'weighted'  # (可选) 子节点的评分策略
$threshold: 0.75      # (可选) 用于模糊匹配的置信度阈值
```

- **`$dimension`**: (可选 `string`) 定义该项所属的维度（如 `accuracy`, `fluency`, `security`）。
- **负分 (Penalties)**: 负值被视为绝对扣分偏移量。归一化规则与奖励项一致（`< 1` 为百分比，`>= 1` 为绝对分值）。

#### 2.4 $expect：评分包装算子

`$expect` 是一个虚拟容器，专门用于在任何地方注入评分元数据、标题和维度配置：

```yaml
output:
  $and:
    - $expect: /春天/
      $meta: { score: 80, dimension: 'accuracy', critical: true }
      $title: "核心关键词"
    - $expect: /花/
      $score: 20
      $threshold: 0.5 # 如果“花”的匹配置信度低于 50%，则失败。
    - $expect: /敏感词/
      $score: { value: -50, dimension: 'security' }
      $title: "安全扣分"
```

#### 2.5 $diff：差异分值化

对于长文本或复杂的 JSON 变化，你可以对 Diff 白名单中的每一项进行打分：

```yaml
expect:
  $diff:
    items:
      - value: "核心结论"
        added: true
        $score: { value: 90, critical: true }
      - value: "修饰词"
        added: true
        $score: 10
    permissive: true # 宽容模式：仅根据白名单项评分，忽略未声明的其它变化。
```

#### 2.6 日志反馈

在执行结果的 `logItem` 中，你会看到：

- **`score`**: 最终得出的量化总分。
- **`scoreDetails`**: **(新)** 树状得分明细，记录了每一项的 key、标题、维度、权重及实际得分。
- **`passScore`**: 及格线参考。
- **`failedCritical`**: 如果测试因为触碰“红线”而失败（包括触发了 Critical 扣分项），这里会列出具体原因。

### 3. 自定义验证操作符 (Custom Operators)

当声明式校验或简单的自定义函数不足以满足需求时，你可以通过 `operators` 定义可复用的验证逻辑。自定义操作符现在已完全集成到评分系统中，支持返回置信度分数。

#### 3.1 定义与引用

自定义操作符可以在 YAML 的 Front-matter（文件级）或单个测试用例（用例级）中定义。

支持以下两种配置格式：

- **对象形式 (显式命名)**: 通过键 pair 指定操作符名称。

  ```yaml
  operators:
    checkCode: "./checkers.js#checkCode"
    isEqual: "lodash-es#isEqual"
  ```

- **数组形式 (自动推断)**: 直接列出路径，由框架自动推断名称。

  ```yaml
  operators:
    - "js://./checkers.js#checkCode" # 自动推断为 $checkCode
  ```

**名称推断与 $ 前缀：**

- **自动补齐**: 无论使用哪种形式，框架都会自动为操作符补齐 `$` 前缀（如 `checkCode` 变为 `$checkCode`），以确保与内置操作符风格一致。
- **推断逻辑**: 在数组形式下，框架会优先使用导出名（`#` 后内容）。若无导出名，则使用文件名并自动转换为 **小驼峰 (camelCase)** 格式（例如 `my-check.js` 或 `my.check.js` 都会推断为 `$myCheck`）。

支持以下引用协议：

- **协议前缀**：自定义操作符支持协议前缀，以便未来扩展支持其他编程语言。如果不设置协议前缀，默认值为 `js:` (JavaScript)。
- **本地文件**: `js://./utils.js#checkCode` 或 `./utils.js#checkCode`（相对于 `baseDir`）。
- **npm 包**: `lodash-es#isEqual` 或 `my-test-utils#validator`。
- **导出说明**: 使用 `#` 指定导出名称，默认为 `default` 导出。

**示例：使用数组形式加载**

```yaml
---
operators:
  - "./checkers.js#checkCode" # 自动推断为 $checkCode
---
- input: "写一个求和函数"
  expect:
    output:
      $checkCode: { strict: true, lang: 'ts' }
```

#### 3.2 算子分类与开发模式

系统根据职能将算子分为两类，提供不同的开发体验：

##### 3.2.1 原子断言算子 (Atomic Assertions)

适用于直接校验实际值的叶子节点（如：代码检查、敏感词探测、存在性校验）。这类算子通常逻辑单一，追求开发效率。

**开发模式：**

```javascript
/**
 * @param actual   - AI 的实际输出
 * @param expected - YAML 中传给该操作符的参数
 * @param fixture  - 当前测试上下文
 */
export async function checkCode(actual, expected, fixture) {
  if (actual.includes('eval')) return "不允许使用 eval";
  return actual.includes(expected.keyword);
}

// checkCode.virtual = true; // 默认为虚拟模式 (true)，核心引擎不在当前路径增加层级
```

**简化返回值说明：**

为了提升开发体验，系统会自动将简单的返回值映射为标准的 `MatchResult`：

| 返回值类型 | 映射逻辑 | 适用场景 |
| :--- | :--- | :--- |
| `boolean` | `true` -> 得分 1.0，通过；`false` -> 得分 0.0，不通过。 | 简单的对/错断言。 |
| `string` | 视为失败消息。得分 0.0，不通过，并将该字符串作为 `message`。 | 需要提供具体失败原因的断言。 |
| `number` | 0.0 - 1.0 的置信度分数。是否“通过”取决于当前上下文的 `threshold` 配置。 | 模糊匹配或相似度校验。 |
| `Object` | 必须符合 `MatchResult` 接口（含 `score`, `pass` 等）。 | 需要返回维度信息、详情树或自定义失败列表的高级场景。 |

##### 3.2.2 逻辑容器算子 (Logic Containers)

适用于组织多个子项校验的容器（如：自定义的 `$and`、`$or`）。这类算子通常包含递归调用，通过 `ValidationContext` 助手可以实现极致 KISS 的逻辑。

**核心优势：**

- **算子内置策略 (`strategy`)**：算子可以声明其本质聚合逻辑（如 `weighted` 或 `max`）。这保证了逻辑的一致性，开发者只需调用 `ctx.aggregate`，系统会自动处理策略优先级。
- **自动权重分配**：通过 `ctx.distribute` 自动处理用户定义的 `score` 权重。
- **路径自动化**：通过 `ctx.createChildContext` 自动处理路径索引和变量替换。

**开发模式：**

```javascript
/**
 * @param actual   - AI 的实际输出
 * @param expected - 期待的子项列表
 * @param ctx      - 校验上下文 (包含权重分配、聚合策略、路径助手等)
 * @param validate - 递归校验函数
 */
export async function myContainer(actual, expectedList, ctx, validate) {
  const weights = ctx.distribute(expectedList);
  const results = [];
  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createChildContext(i, expectedList.length);
    results.push(await validate(actual[i], expectedList[i], subCtx));
  }
  // 系统自动应用 myContainer.strategy 声明的策略
  return ctx.aggregate(results, weights);
}

myContainer.virtual = true;
myContainer.strategy = 'weighted'; // 锁定为加权平均策略
```

#### 3.3 $value 约定：分离主值与参数

为了让操作符接口更统一，ai-test-runner 引入了 `$value` 约定。它允许你同时传递一个“主校验目标”和多个“辅助配置参数”。

当你在 YAML 中使用 `$value` 结构时：

- `$value` 的内容将被作为 `expected` 传入。
- 其余属性将被提取到 `fixture.$options` 中。

**YAML 示例：**

```yaml
expect:
  output:
    $checkCode:
      $value: "function sum" # 主校验内容
      timeout: 1000          # 辅助参数，进入 fixture.$options
      strict: true
```

**操作符实现：**

```javascript
export function checkCode(actual, expected, fixture) {
  const { timeout, strict } = fixture.$options;
  // expected 此时直接等于 "function sum"
  // ...
}
```

#### 3.4 递归校验与 $validate

你可以在自定义操作符中调用 `fixture.$validate` 或标准的 `validate` 参数来复用已有的验证逻辑。

#### 3.5 虚拟路径策略 (`virtual` 属性)

算子通过 `virtual` 属性声明其在详情树中的路径表现。系统遵循 **“默认虚拟 (Default Virtual)”** 准则：

- **`true` (默认)**: **虚拟模式**。核心引擎不在当前路径增加层级（穿透）。
  - **单元素场景**: 完全透明，子项直接继承父路径（例如 `output`）。
  - **多元素场景**: 自动根据模板生成可读分支（例如 `$and[0]`）。
- **`false`**: **物理模式**。强制保留算子物理层级（例如 `output.$myOp`）。
- **`string`**: **自定义模式**。支持通过变量模板定制路径（例如 `$operator[$key]`）。

#### 3.6 配置项

- **`allowOperatorOverride`**: (默认 `false`) 是否允许自定义操作符覆盖内置操作符（如 `$contains`）。
- **`baseDir`**: 用于解析本地相对路径的基准目录。

### 4. AI 工具测试 (AI Tool Testing)

针对 Agent 调用工具的场景，提供极简的配置方式。**注意：执行器必须返回标准的 `messages` 列表才能进行此项测试。**

#### 4.1 工具配置与驱动

- **`tools`**: 指定 AI 可以使用的工具列表。支持 `boolean | string | Record | Array`。
- **`toolTester`**: 负责驱动测试的脚本 ID（默认为 `'toolTester'`）。它通常是一个能理解工具调用并执行的 Agent 脚本。

#### 4.2 `tools: true` 自动绑定

当测试一个工具脚本本身时，无需重复书写工具 ID。

- **逻辑**：自动将当前 `script` ID 包装成 `[script]` 传给 AI。
- **重定向**：会自动将执行脚本切换为 `toolTester`。

```yaml
# weather.ai.yaml 的测试配置
---
tools: true  # 自动将 weather.ai.yaml 设为可用工具
---
- input: "查上海天气"
  expect:
    tools: [{ name: 'weather', args: { city: /Shanghai|上海/ } }]
```

#### 4.3 `expect.tools` 语法糖

无需手动解析 `messages` 链路，引擎会自动提取所有 `assistant` 发起的工具调用进行匹配。

### 5. JSON Schema 验证

对于结构化输出，JSON Schema 是最严谨的校验方式。默认支持启发式识别（根据 `type` 属性）。

推荐使用 `$schema` 操作符：

```yaml
expect:
  output:
    profile:
      $schema:
        type: object
        properties:
          age: { type: number, minimum: 18 }
```

### 6. 语义化差异匹配 (Diff)

解决 LLM 输出“对但不完全一样”的问题。ai-test-runner 提供了强大的差异匹配引擎，能够智能地分析输出变化。

#### 6.1 内置语义化失败反馈 (Semantic Feedback)

在设计上，**引擎中所有的字符串比对在失败时都会自动调用 Diff 引擎。**

即使你没有显式使用 `$diff` 操作符，如果字符串匹配（包括 `$expect` 内部的匹配）在简单的“包含性检查”中失败，引擎会自动执行结构化差分比对。这确保了每一次验证失败都能提供“高信噪比”的反馈——它会清晰地在日志中展示具体是哪些字符、单词或 JSON 字段发生了偏差，而非仅仅给出一个“不匹配”的模糊提示。

#### 6.2 智能 Diff 策略 (`auto`)

系统默认（或通过 `diff: 'auto'` / `diff: true`）使用智能探测逻辑：

- **JSON**: 自动识别并格式化对比，基于路径（Path）进行键值对差分，完全无视缩进和字段顺序。
- **多行文本**: 自动使用按行对比 (`lines`)。
- **长文本**: 自动使用按词对比 (`words`)。
- **短字符串**: 使用精确的按字符对比 (`chars`)。

#### 6.3 支持的策略类型

你可以显式指定 `type` 来强制使用特定算法：

- `chars`: 字符级对比（默认）。
- `words`: 词级对比（忽略空格）。
- `wordsWithSpace`: 词级对比（保留空格）。
- `lines`: 行级对比。
- `sentences`: 句子级对比。
- `json`: 结构化 JSON 对比。

示例：

```yaml
expect:
  diff:
    type: json
    items:
      - path: "user.id"
        val: 123
        added: true
```

#### 6.4 宽容模式 (`diffPermissive`)

设置 `diffPermissive: true` 或在预期中使用 `diff: { permissive: true }` 可以关闭严格白名单。此时引擎会忽略所有未声明的变更，仅验证 `required: true` 的项是否按预期发生了变化。

```yaml
expect:
  output: "Hello"
  diff:
    permissive: true # 忽略所有其他变化
    items:
      - { value: "User", added: true, required: true } # 仅确保 User 被添加了
```

---

## 技术规范 (Technical Reference)

### 1. AIScriptExecutor 与上下文 (Context)

`AIScriptExecutor` 是集成 AI 平台的入口。Runner 会将 `AIExecutionContext` 传递给它的 `execute` 方法。

#### 1.1 `input` 如何传递

Fixture 中定义的 `input` 会通过以下规则合并到 `context.args` 中：

- **对象类型的 Input**：如果 `input` 是一个对象（例如 `{ query: "你好" }`），其属性会被直接展开（spread）到 `args` 中。你可以直接通过 `args.query` 访问。
- **非对象类型的 Input**：如果 `input` 是基本类型（字符串、数字等），它会被包装在 `input` 字段中。你可以通过 `args.input` 访问。

除了直接访问属性外，你还可以在模板中通过 `input` 前缀访问完整的 `input` 对象（例如 `{{input.query}}` 或 `{{input}}`）。

**示例：在模板中使用 input 前缀**

```yaml
- input: { language: 'en', user: { name: 'Bob' } }
  output:
    lang: "{{input.language}}"    # 访问 input 的深层属性
    text: "Hi {{input.user.name}}" # 访问嵌套属性
```

#### 1.2 `tools` 如何传递

当 Fixture 或全局配置中包含 `tools` 时：

- **脚本重定向**：`context.script` 会自动切换为 `toolTester`（默认为 `'toolTester'`）。
- **参数注入**：所有解析后的工具定义会以数组形式存放在 `context.args.tools` 中。
- **`tools: true`**：如果设为 `true`，Runner 会自动将当前被测试的脚本 ID 加入到 `args.tools` 数组中。

#### 1.3 脚本 ID 判定

Runner 通过以下逻辑判定 `script` 是否为合法 ID（而非源码）：
`!/[\n\r{}]/.test(script) && script.length < 256`。
**注意**：使用 `tools: true` 时必须提供 ID，因为 AI 无法以源码作为工具名。

### 2. 标准消息格式 (`Message`)

执行器返回的 `messages` 是一个对象数组，代表了 AI 与用户/工具的完整交互链路。这也是 `expect.tools` 语法糖的**唯一数据源**。

```typescript
interface ToolCall {
  name: string;               // 工具名称 (必填)
  args: Record<string, any>;  // 调用参数 (必填)
  result?: any;               // 工具执行后的返回结果 (可选)
}

interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content?: string;           // 文本内容
  tools?: ToolCall[];         // 工具调用列表
}
```

### 3. 核心类型说明

#### 3.1 `AITestFixture`

单个测试用例的定义。

```typescript
export interface AITestFixture {
  title?: string;
  input?: any;                // 注入模板的数据
  output?: any;               // 预期的主要输出
  outputSchema?: any;         // 用于校验输出的 JSON Schema
  script?: string;            // 覆盖默认脚本 ID/源码
  tools?: AITestTools;        // 工具配置
  toolTester?: string;        // 自定义工具测试脚本
  expect?: any;               // 针对 Trace/Messages 的验证
  strict?: AIStrictOption;    // 严格模式开关
  checkSchema?: boolean;      // 是否启用 Schema 校验
  disableHeuristicSchema?: boolean;
  operators?: Record<string, any>; // 自定义操作符
  allowOperatorOverride?: boolean;
  scoring?: boolean | 'auto'; // 是否启用评分
  maxScore?: number;          // 最大分值
  passScore?: number;         // 及格分值
  unassignedWeight?: number;  // 未分配项的权重预算
  only?: boolean;             // 仅运行此测试
  skip?: boolean;             // 跳过此测试
  not?: boolean;              // 结果取反
  [key: string]: any;         // 自定义模板变量
}
```

#### 3.2 `AITestLogItem`

每个 Fixture 执行后的详细日志项。

| 属性 | 说明 |
| :--- | :--- |
| `title` | 测试标题 |
| `passed` | 校验是否通过 |
| `score` | 最终计算总分 |
| `scoreDetails` | 详细得分树（包含 key, title, dimension, weight, score, details） |
| `maxScore` | 本次测试最大分值 |
| `passScore` | 及格线参考 |
| `input` | 解析后的输入数据 |
| `actual` | AI 的实际输出 |
| `expected` | 预期的输出（格式化后） |
| `reason` | 提取出的推理/解释内容 |
| `expectedSchema` | 解析后的 JSON Schema |
| `failedCritical` | 强制性（红线）校验失败详情列表 |
| `failures` | 校验失败详情列表 |
| `error` | 执行过程中的技术错误 |
| `duration` | 执行耗时 (ms) |
| `script` | 实际执行的脚本 ID 或源码 |
| `actualTrace` | 完整的交互历史 (messages) |
| `expectedTrace` | 解析后的 Trace 预期目标 |
| `tools` | 最终解析出的工具列表 |
| `vars` | 执行时最终解析出的模板变量集 |

#### 3.3 `AITestRunnerOptions`

运行器的全局配置项。

| 属性 | 说明 |
| :--- | :--- |
| `fixtureConfig` | 所有 Fixture 的默认值 (`Partial<AITestFixture>`) |
| `userConfig` | 传递给执行器的运行时配置 |
| `strict` | 全局严格模式设置 |
| `logVars` | 控制 vars 是否包含在日志中: `true`, `false`, 或 `'error'` |
| `scoring` | 全局评分开关 |
| `maxScore` | 全局默认最大分值 |
| `passScore` | 全局默认及格分值 |

### 4. 事件生命周期

| 事件名 | 触发时机 | 参数 |
| :--- | :--- | :--- |
| `test:start` | 开始执行前 | `{ i, script, input }` |
| `test:pass` | 断言全部通过 | `AITestLogItem` |
| `test:fail` | 断言失败 | `AITestLogItem` |
| `test:error` | 代码执行崩溃 | `AITestLogItem` |
| `test:skip` | 命中 skip 或 only 逻辑 | `AITestLogItem` |

## 许可证

MIT
