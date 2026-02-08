# @isdk/ai-test-runner

> 【[English](./README.md)|中文】
---

一个轻量级、解耦的 AI 脚本、智能体及提示词测试核心引擎。
虽然它源自 [ISDK AI](https://github.com/isdk) 生态，但它被设计为**通用的 AI 测试引擎**。你只需简单地实现 `AIScriptExecutor` 接口，即可将其应用于任何 AI 测试场景。

`ai-test-runner` 提供了一套强大的框架，用于执行 AI 测试样例（Fixtures）并利用多种策略验证输出结果。

## 核心特性

### 🧩 完全解耦的架构

核心逻辑独立于任何 CLI 框架或文件系统。通过实现简单的 `AIScriptExecutor` 接口，你可以将其集成到 Node.js 服务器、Web 环境或 CI/CD 流水线中。

### 📐 全面的验证策略

- **字符串与正则**: 支持部分字符串匹配和复杂的正则表达式。
- **深度对象/数组**: 递归验证嵌套的数据结构。
- **语义化 Diff**: 通过结构化的 `diff` 规则允许输出中的微小差异（例如：忽略额外的空行或特定的字符替换）。
- **JSON Schema (Ajv)**: 内置支持 JSON Schema，并包含丰富的自定义关键字和格式扩展。

### 📝 高级模板系统

- **动态变量**: 在输入、输出甚至验证规则中注入变量。
- **递归解析**: 自动处理深层依赖链（例如：`a` 依赖 `b`，`b` 依赖 `c`）。
- **环境感知**: 支持 `__fixture_dir__` 和 `__script_dir__` 等目录变量。

### 🌓 灵活的匹配模式

支持细粒度的 `严格 (Strict)` 和 `部分 (Partial)` 匹配。你可以配置是否允许对象中存在多余属性、数组中存在多余项，或 Diff 中存在未声明的变化。

---

## 安装

```bash
pnpm add @isdk/ai-test-runner
```

## 详细使用指南

### 1. 数据格式 (Fixture)

一个测试用例通常由 `input`（输入）、预期 `output`（输出）和可选的验证元数据组成。

```yaml
- input:
    content: "1+1 等于几？"
  output: "2"
  not: false   # 如果为真，则当输出不匹配时测试才通过
  skip: false
  strict: object # 为此用例启用对象的严格匹配模式
```

### 2. 模板变量

你可以在 `fixtureConfig`（通常来自文件的 Front-matter）中定义变量，并在测试中使用它们。

```yaml
# fixtureConfig (Front-matter)
variables:
  name: "小明"
---
- input:
    echo: "你好 {{name}}"
  output: "你好 小明"
```

### 3. Diff 验证字符串

使用 `diff` 可以对字符串进行补充验证。例如，可以允许字符串中存在额外的空行，或允许特定的字符替换。

```yaml
- input:
    text: "这是测试。"
  output: "这是测试"
  diff:
    # 允许额外添加一个点号
    - add: true
      value: "."
    # 允许额外的空行
    - value: "\n"
      added: true
```

### 4. 用 JSON Schema 验证

如果 AI 输出是一个 JSON 对象，你可以使用 Schema 进行校验。

```yaml
- input:
    get_user: 1
  outputSchema:
    type: object
    properties:
      name: { type: string, pattern: "^[A-Z]" }
      age: { type: number, range: [18, 100] }
    required: ["name"]
```

#### 扩展关键字说明

- **字符串 (String)**: `regexp` (正则)、`transform` (转换，如 trim, toLowerCase)。
- **数值 (Number)**: `range` (范围)、`exclusiveRange`。
- **对象 (Object)**: `allRequired` (全部必填)、`anyRequired` (任意必填)、`deepProperties` (深层属性)、`deepRequired`。
- **动态默认值**: `timestamp` (时间戳)、`datetime` (日期时间)、`randomint` (随机整数) 等。

---

## 集成 API 示例

### 实现执行器

```typescript
import { AITestRunner, AIScriptExecutor } from '@isdk/ai-test-runner';

// 1. 实现执行器，对接你的 AI 引擎
const executor: AIScriptExecutor = {
  async execute({ script, args }) {
    // 你的 AI 执行逻辑
    return { output: "执行结果" };
  }
};

// 2. 初始化 Runner
const runner = new AITestRunner(executor);

// 3. 监听事件进行实时日志输出
runner.on('test:pass', (log) => console.log(`用例 ${log.i} 通过`));

// 4. 运行测试
const result = await runner.run('script-id', fixtures, {
  fixtureConfig: { /* 全局配置 */ },
  strict: false
});
```

## 开源协议

MIT
