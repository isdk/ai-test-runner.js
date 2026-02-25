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

- **`$and`**: 必须满足数组中的**所有**验证条件。
- **`$or`**: 只要满足数组中的**任意一个**验证条件即可。
- **`$not`**: 反向断言，匹配则失败。
- **`$contains`**: 只要数组中包含符合条件的项即可。
- **`$all`**: 数组必须包含所有指定项，顺序无关。
- **`$sequence`**: 数组必须按顺序包含指定项，中间允许有干扰项。
- **`$exists`**: 验证属性是否存在。支持简写和严格模式（验证键是否在对象中）。

**特化操作符：**

- **`$expect`**: 透明容器，专门用于为任何验证节点注入评分元数据（权重、红线）或标题。[详见评分策略](#2-评分策略-scoring-strategy)。
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

#### 2.3 分值元数据 (`score`) 与自定义策略

任何验证节点（字符串、正则、算子、对象字段）都可以通过 `$expect` 或直接在算子属性中注入分值元数据。`score` 属性现在支持指定 `strategy` 和 `threshold`。

```yaml
# score 可以是简写数字（代表相对权重或 maxScore 的百分比）
score: 80

# 也可以是对象，包含红线逻辑、自定义策略和模糊阈值
score:
  value: 80           # 相对权重或百分比
  critical: true      # 必须项（红线）：如果此项不通过，即便总分及格，passed 也会设为 false。
  strategy: 'weighted' # (可选) 该节点的子节点的评分策略（例如，'weighted' 加权求和，'max' 取最大值）。
  threshold: 0.75     # (可选) 用于模糊匹配。分值 >= 阈值才被视为“通过”。
```

- **`strategy`**: (可选 `string`) 定义该节点的 `allocatedScore` 如何分配给其子节点 (`distribute` 方法)，以及它们的 `earnedScore` 如何聚合 (`aggregate` 方法)。
  -   **`weighted` (对象、数组、$and 的默认策略)**：按子节点的 `value` 比例分配分值，并对它们的 `earnedScore` 进行求和。
  -   **`max` ($or、$contains 的默认策略)**：平均分配分值给子节点（或根据它们的 `value`），并取其中最高的 `earnedScore`。
- **`threshold`**: (可选 `number`，介于 0 到 1 之间) 适用于叶子验证节点（例如，自定义算子或返回分值的字符串比较）。如果该项的 `score` 低于此 `threshold`，即使它贡献了部分分值，也会被视为验证失败。

#### 2.4 $expect：评分包装算子

`$expect` 是一个透明的容器，专门用于在任何地方注入评分元数据、标题和策略配置：

```yaml
output:
  $and:
    - $expect: /春天/
      score: { value: 80, critical: true, strategy: 'weighted' }
      title: "核心关键词存在"
    - $expect: /花/
      score: 20
      threshold: 0.5 # 如果“花”的匹配置信度低于 50%，则失败。
```

#### 2.5 $diff：差异分值化

对于长文本或复杂的 JSON 变化，你可以对 Diff 白名单中的每一项进行打分：

```yaml
expect:
  diff:
    items:
      - value: "核心结论"
        added: true
        score: { value: 90, critical: true }
      - value: "修饰词"
        added: true
        score: 10
    permissive: true # 宽容模式：仅根据白名单项评分，忽略未声明的其它变化。
```

#### 2.6 日志反馈

在执行结果的 `logItem` 中，你会看到：

- **`score`**: 最终得出的量化分值。
- **`passScore`**: 及格线参考。
- **`failedCritical`**: 如果测试因为触碰“红线”而失败，这里会列出具体导致失败的强制性验证项。

### 3. 自定义验证操作符 (Custom Operators)

当声明式校验或简单的自定义函数不足以满足需求时，你可以通过 `operators` 定义可复用的验证逻辑。自定义操作符现在已完全集成到评分系统中，支持返回置信度分数。

#### 3.1 定义与引用

自定义操作符可以在 YAML 的 Front-matter（文件级）或单个测试用例（用例级）中定义。

支持以下两种配置格式：

- **对象形式 (显式命名)**: 通过键值对指定操作符名称。

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

#### 3.2 操作符函数签名与 `ValidationResult`

系统支持两种签名模式。建议使用 **简化模式** 以获得最佳的开发体验，并且现在完全支持返回详细的 `ValidationResult` 对象。

##### 简化模式 (推荐)

适用于大多数业务逻辑校验。可返回布尔值、字符串、数字（0-1置信度）或 `{ score, message, pass }` 对象。

```javascript
/**
 * @param actual   - AI 的实际输出
 * @param expected - YAML 中传给该操作符的参数 (如 { strict: true })
 * @param fixture  - 当前测试上下文，包含：
 *                   - $data: 已渲染的完整模板数据
 *                   - $validate: 递归校验方法 (act, exp) => Promise<MatchResult>
 *                   - $options: 从 $value 结构中拆解出的辅助参数 (见下文)
 *                   - 其它 fixture 顶层属性
 * @returns {boolean | string | number | MatchResult}
 *          - `true`: 完全通过，得分 1.0。
 *          - `false` 或 `string`: 完全失败，得分 0.0。`string` 用作失败消息。
 *          - `number` (0.0-1.0): 部分通过，带有置信度分数。
 *          - `MatchResult` 对象: 详细结果。
 */
export async function checkCode(actual, expected, fixture) {
  // 示例 1: 简单通过/失败
  if (actual.includes('eval')) {
    return "不允许使用 eval"; // 失败并带消息
  }
  // 示例 2: 置信度分数
  const confidence = actual.includes(expected.keyword) ? 0.8 : 0.2;
  return confidence; // 返回 0.8 或 0.2
  // 示例 3: 使用 $validate 进行递归校验
  const { pass, score } = await fixture.$validate(actual, expected.schema);
  return { score, pass, message: "Schema 校验失败" };
}
```

##### 标准模式 (底层)

如果你需要完全控制验证流程。在此模式下，函数必须是一个纯函数，且必须返回一个 `MatchResult` 对象。

```javascript
import { ValidationContext, MatchResult } from '@isdk/ai-test-runner';

export async function myOp(actual, expected, ctx: ValidationContext, validate: (act, exp, ctx) => Promise<MatchResult>): Promise<MatchResult> {
  // 使用传入的 'validate' 函数进行递归调用。
  // 返回 MatchResult 对象。不允许直接修改 ctx。
  const result = await validate(actual, expected, ctx);
  return {
    score: result.score * 0.5, // 应用自定义的分数逻辑
    pass: result.pass,
    failures: result.failures
  };
}
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

你可以在自定义操作符中调用 `fixture.$validate` 来复用已有的验证逻辑（包括正则、Schema 或其它操作符）。

```javascript
export async function $eachMatch(actualArray, pattern, fixture) {
  // 使用 fixture.$validate，它返回一个 MatchResult 对象
  const { pass, failures } = await fixture.$validate(actualArray[0], pattern);
  if (!pass) return failures[0].message;
  return 1.0; // 返回置信度分数
}
```

#### 3.5 操作符输入类型声明 (`expects` 属性)

为了提高类型检查的准确性，并避免在算子内部重复进行基础类型校验，算子可以通过在其函数上附加一个 `expects` 属性来声明它所期望的 `actual` (实际值) 类型。

如果 `actual` 的类型与算子声明的期望类型不符，核心验证引擎将在算子执行前抛出错误，并提供明确的错误信息，例如 `Operator $myOp requires an array, but got string`。

`expects` 属性可以是一个字符串或一个字符串数组：

- **字符串形式**: `operatorFunction.expects = 'array'`
  这表示算子期望 `actual` 必须是一个数组。
- **字符串数组形式**: `operatorFunction.expects = ['array', 'object']`
  这表示算子期望 `actual` 必须是数组或对象。目前，核心引擎仅针对 `array` 类型进行强制检查。如果 `expects` 数组中包含 `'array'`，且 `actual` 不是数组，则会触发错误。

注: 目前只对 `array` 类型进行强制检查。

**示例：声明算子期望数组输入**

```typescript
// in myCustomOperator.ts
export async function $myArrayOperator(actual, expected, ctx, validateMatch) {
  // ... 算子的核心逻辑，此时可以确信 actual 是一个数组
}
$myArrayOperator.expects = 'array'; // 声明此算子期望一个数组作为输入
```

或者，如果算子是自定义的并注册在 `operators` 选项中：

```yaml
# 在 YAML 中定义自定义算子
operators:
  $myArrayOperator: "js://./myCustomOperator.js#$myArrayOperator" # 假设该文件导出了 $myArrayOperator 并设置了 expects 属性
```

**对内置算子的影响:**

`$contains`, `$all`, `$sequence` 等内置算子现在也通过 `expects = 'array'` 属性明确声明了它们期望数组输入。当 `actual` 值不是数组时，核心验证引擎会提前报告错误。

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
    tools: [{ name: 'weather', args: { city: 'Shanghai' } }]
```

#### 4.3 `expect.tools` 语法糖

无需手动解析 `messages` 链路，引擎会自动提取所有 `assistant` 发起的工具调用进行匹配。

### 5. JSON Schema 验证

对于结构化输出，JSON Schema 是最严谨的校验方式。

#### 5.1 启发式识别 (Heuristic Recognition)

默认情况下，Runner 开启了启发式识别。如果一个对象具有 `type` 属性，且其值为 `string`, `number`, `integer`, `boolean`, `object`, `array` 之一，它会被自动识别为 JSON Schema。

如果你希望某个字段仅仅是包含 `type` 属性的普通业务数据，请设置 `disableHeuristicSchema: true`。

#### 5.2 显式校验

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

#### 6.2 支持的策略类型

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

#### 6.3 宽容模式 (`diffPermissive`)

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
  result?: any;               // 工具执行后的返回结果 (可选，用于验证闭环)
}

interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content?: string;           // 文本内容
  /**
   * 工具调用列表。
   * - 当 role 为 'assistant' 时，代表 AI 发起的调用请求。
   * - 当 role 为 'tool' 时，代表工具执行的结果。
   */
  tools?: ToolCall[];
}
```

#### 1.3 `expect.tools` 的工作原理

当你使用 `expect: { tools: [...] }` 时，Runner 会自动进行以下转换：

1. **自动聚合**：遍历 `messages` 数组，提取所有包含 `tools` 属性的消息。
2. **路径映射**：将校验目标映射到 `messages` 的深层结构中。例如 `tools: [ { name: 'calc' } ]` 实际上是在验证：*“是否存在一条消息，其 `tools` 数组中包含一个 `name` 为 'calc' 的对象？”*
3. **操作符转换**：默认使用 `$all` 逻辑进行集合匹配。

### 2. AIScriptExecutor 实现示例

执行器是底层库与具体 AI 平台对接的唯一入口。

```typescript
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult } from '@isdk/ai-test-runner';

export class MyAIExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    const { script, args, options } = context;

    // 示例：调用某个 AI SDK
    const response = await someAIService.ask({
      model: options.model || 'gpt-4',
      prompt: script, // 如果是 ID，你可能需要先加载脚本内容
      variables: args
    });

    return {
      output: response.text,           // 用于结果校验
      messages: response.fullHistory,  // 用于工具调用校验
    };
  }
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
| `input` | 解析后的输入数据 |
| `actual` | AI 的实际输出 |
| `expected` | 预期的输出（格式化后） |
| `reason` | 提取出的推理/解释内容 |
| `expectedSchema` | 解析后的 JSON Schema |
| `failedCritical` | 强制性（红线）校验失败详情列表 |
| `failures` | 校验失败详情列表 |
| `error` | 执行过程中的技术错误 |
| `duration` | 执行耗时 (ms) |
| `script` | **(新)** 实际执行的脚本 ID 或源码 |
| `actualTrace` | **(新)** 完整的交互历史 (messages) |
| `expectedTrace` | **(新)** 解析后的 Trace 预期目标 |
| `tools` | **(新)** 最终解析出的工具列表 |
| `vars` | **(新)** 执行时最终解析出的模板变量集 |

#### 3.3 `AITestRunnerOptions`

运行器的全局配置项。

| 属性 | 说明 |
| :--- | :--- |
| `fixtureConfig` | 所有 Fixture 的默认值 (`Partial<AITestFixture>`) |
| `userConfig` | 传递给执行器的运行时配置 |
| `strict` | 全局严格模式设置 |
| `logVars` | **(新)** 控制 vars 是否包含在日志中: `true`, `false`, 或 `'error'` |

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
