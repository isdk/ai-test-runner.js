# @isdk/ai-test-runner 集成指南 (Integration Guide)

本文档旨在指导上层应用（如 CLI 工具、IDE 插件、测试管理平台）如何正确集成并驱动 `ai-test-runner` 引擎，特别是如何支持**自定义操作符 (Custom Operators)** 特性。

---

## 1. 核心集成流程

作为集成者，你通常需要处理以下链路：**加载 Fixture -> 计算上下文 -> 调用 Runner**。

### 1.1 初始化 AITestRunner

集成者需要提供一个实现了 `AIScriptExecutor` 接口的类，负责将指令发送给真实的 LLM。

```typescript
import { AITestRunner } from '@isdk/ai-test-runner';

const executor = {
  async execute({ script, args, options }) {
    // 调用 LLM API
    return { output: "...", messages: [] };
  }
};
const runner = new AITestRunner(executor);
```

### 1.2 准备运行上下文 (关键)

在调用 `runner.run` 时，**必须**正确计算 `baseDir`。这是确保用户在 YAML 中写的相对路径（如 `./utils.js`）能够被正确加载的关键。

```typescript
import path from 'node:path';

async function runTestFile(fixturePath: string) {
  // 1. 读取 YAML 内容 (上层负责解析 YAML)
  const content = await fs.readFile(fixturePath, 'utf8');
  const { fixtures, ...fileOptions } = parseYaml(content);

  // 2. 核心：计算 baseDir。必须是 fixture 文件所在的目录。
  const baseDir = path.dirname(path.resolve(fixturePath));

  // 3. 执行测试
  return await runner.run('default-script', fixtures, {
    baseDir,              // 用于解析自定义操作符的本地路径
    fixtureConfig: fileOptions, // 传入文件级的 operators 和其它配置
    allowOperatorOverride: false,
  });
}
```

---

## 2. 自定义操作符协议规范

集成者应向终端用户展示支持的引用协议：

| 协议格式 | 示例 | 说明 |
| :--- | :--- | :--- |
| **相对路径** | `./checkers.js#myOp` | 相对于 `baseDir` 解析，支持导出名 |
| **npm 包名** | `lodash-es#isEqual` | 直接调用 `import('lodash-es')` |
| **绝对路径** | `/abs/path/op.js` | 直接加载 |
| **JS 协议 (可选)**| `js://./utils.js` | 明确指定为 JS，效果同上 |

---

## 3. 操作符函数签名定义

集成者可以告诉开发者如何编写高性能的操作符。建议使用 **简化模式**。

### 简化模式 (Recommended)

```javascript
/**
 * @param {any} actual - AI 生成的实际输出
 * @param {any} expected - YAML 中传给操作符的参数
 * @param {object} fixture - 增强上下文
 * @param {object} fixture.$data - 已经过模板渲染的完整数据
 * @param {function} fixture.$validate - 递归校验方法 (act, exp) => Promise<Failures[]>
 */
export async function myCheck(actual, expected, fixture) {
  // 1. 业务逻辑校验
  if (expected.strict && actual.includes('eval')) return "Security Error: eval detected";

  // 2. 递归调用
  const failures = await fixture.$validate(actual, /expected-pattern/);
  if (failures.length > 0) return failures[0].message;

  return true; // 通过
}
```

---

## 4. 最佳实践与注意事项

### 4.1 异步处理

所有自定义操作符的加载和执行都是**异步**的。如果你在上层自行调用了验证方法，请务必使用 `await`。

### 4.2 错误预检查

`AITestRunner` 会在测试运行开始之前预加载所有 `operators`。如果路径配置错误，`runner.run` 会直接抛出异常。集成者应捕获此异常并向终端用户友好地显示“配置错误”。

### 4.3 全局注入

如果你的平台提供了一些标准校验工具（例如：`$checkSql`, `$isSafe`），你可以通过 `AITestRunnerOptions.operators` 将它们注入为全局操作符。

```typescript
await runner.run(script, fixtures, {
  operators: {
    $myGlobalCheck: (act) => true
  }
});
```

---

## 5. 故障排查 (Troubleshooting)

- **找不到文件**：检查 `baseDir` 是否传递了正确的绝对路径。
- **导入失败**：确保本地 JS 文件使用 ESM 格式（如扩展名为 `.mjs` 或所在项目 `package.json` 包含 `"type": "module"`）。
- **递归无限循环**：在自定义操作符中调用 `fixture.$validate` 时，避免校验目标指向该操作符自身。
