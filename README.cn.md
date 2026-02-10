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

验证引擎是测试的核心，支持通过 `expect` 对象定义复杂的断言。

#### 1.1 基础匹配 (`expect.output`)

支持字符串、正则表达式和数值校验。

- **正则示例**：验证输出是否包含特定模式。

  ```yaml
  expect:
    output: "/^Hello, .+\\!$/i" # 匹配 "Hello, Alice!"
  ```

#### 1.2 高级集合操作符

针对数组类型（如消息列表或工具调用列表）提供强大的断言能力：

- **`$contains`**: 只要数组中包含符合条件的项即可。
- **`$all`**: 数组必须包含所有指定项，顺序无关。
- **`$sequence`**: 数组必须按顺序包含指定项，中间允许有干扰项。
- **`$not`**: 反向断言，匹配则失败。

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

### 2. AI 工具测试 (AI Tool Testing)

针对 Agent 调用工具的场景，提供极简的配置方式。**注意：执行器必须返回标准的 `messages` 列表才能进行此项测试。**

#### 2.1 工具配置与驱动

- **`tools`**: 指定 AI 可以使用的工具列表。支持 `boolean | string | Record | Array`。
- **`toolTester`**: 负责驱动测试的脚本 ID（默认为 `'toolTester'`）。它通常是一个能理解工具调用并执行的 Agent 脚本。

#### 2.2 `tools: true` 自动绑定

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

#### 2.3 `expect.tools` 语法糖

无需手动解析 `messages` 链路，引擎会自动提取所有 `assistant` 发起的工具调用进行匹配。

### 3. JSON Schema 验证

对于结构化输出，JSON Schema 是最严谨的校验方式。

#### 3.1 启发式识别 (Heuristic Recognition)

默认情况下，Runner 开启了启发式识别。如果一个对象具有 `type` 属性，且其值为 `string`, `number`, `integer`, `boolean`, `object`, `array` 之一，它会被自动识别为 JSON Schema。

如果你希望某个字段仅仅是包含 `type` 属性的普通业务数据，请设置 `disableHeuristicSchema: true`。

#### 3.2 显式校验

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

### 4. 语义化差异匹配 (Diff)

解决 LLM 输出“对但不完全一样”的问题。

#### 4.1 白名单模式 (默认)

只有声明过的差异才是允许的。任何未在 `diff` 中声明的字符变更都会导致失败。

#### 4.2 宽容模式 (`diffPermissive`)

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

### 3. 事件生命周期

| 事件名 | 触发时机 | 参数 |
| :--- | :--- | :--- |
| `test:start` | 开始执行前 | `{ i, script, input }` |
| `test:pass` | 断言全部通过 | `AITestLogItem` |
| `test:fail` | 断言失败 | `AITestLogItem` |
| `test:error` | 代码执行崩溃 | `AITestLogItem` |
| `test:skip` | 命中 skip 或 only 逻辑 | `AITestLogItem` |

## 许可证

MIT
