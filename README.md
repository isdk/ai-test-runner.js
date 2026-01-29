# @isdk/ai-test-runner

> 【English|[中文](./README.cn.md)】
---

A lightweight, decoupled core engine for testing AI scripts, agents, and prompts.
Part of the [ISDK AI](https://github.com/isdk) ecosystem and used for testing [ISDK Language](https://github.com/isdk/isdk-lang-spec) scripts.

`ai-test-runner` provides a robust framework for executing AI test fixtures and validating outputs using multiple strategies.

## Features

### 🧩 Fully Decoupled Architecture

The core logic is independent of any CLI framework or File System. You can integrate it into Node.js servers, Web environments, or CI/CD pipelines by simply implementing the `AIScriptExecutor` interface.

### 📐 Comprehensive Validation Strategies

- **String & RegExp**: Supports partial string matching and complex Regular Expressions.
- **Deep Object/Array**: Recursively validates nested data structures.
- **Semantic Diffing**: Allows for minor variations in output (e.g., ignoring extra newlines or specific character changes) via structured `diff` rules.
- **JSON Schema (Ajv)**: Built-in support for JSON Schema with extensive custom keywords and formats.

### 📝 Advanced Template System

- **Dynamic Variables**: Inject variables into inputs, outputs, and even validation rules.
- **Recursive Resolution**: Automatically resolves deep dependency chains (e.g., `a` depends on `b`, `b` depends on `c`).
- **Context Awareness**: Supports directory variables like `__fixture_dir__` and `__script_dir__`.

### 🌓 Flexible Matching Modes

Supports `Strict` and `Partial` matching at a granular level. You can configure whether to allow extra properties in objects, extra items in arrays, or unverified changes in diffs.

---

## Installation

```bash
pnpm add @offline-ai/ai-test-runner
```

## Detailed Usage Guide

### 1. Data Format (Fixture)

A fixture typically consists of an `input`, an expected `output`, and optional validation metadata.

```yaml
- input:
    content: "What is 1+1?"
  output: "2"
  not: false   # If true, test passes only if output does NOT match
  skip: false
  strict: object # Enable strict mode for this specific case
```

### 2. Template Variables

You can define variables in the `fixtureConfig` (front-matter) and use them in your tests.

```yaml
# fixtureConfig (Front-matter)
variables:
  name: "Alice"
---
- input:
    echo: "Hello {{name}}"
  output: "Hello Alice"
```

### 3. Diff Validation

Use `diff` to allow supplemental validation for strings, permitting minor differences like extra newlines or specific word substitutions.

```yaml
- input:
    text: "This is a test."
  output: "This is a test"
  diff:
    - add: true
      value: "." # Allow trailing dot even if expected doesn't have it
    - value: "\n"
      added: true # Allow extra newlines
```

### 4. JSON Schema Validation

If the AI output is a JSON object, you can validate it against a schema.

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

#### Extended Keywords

- **String**: `regexp`, `transform` (trim, toLowerCase, etc.).
- **Number**: `range`, `exclusiveRange`.
- **Object**: `allRequired`, `anyRequired`, `deepProperties`, `deepRequired`.
- **Dynamic Defaults**: `timestamp`, `datetime`, `randomint`, etc.

---

## Integration API

### Implementation Example

```typescript
import { AITestRunner, AIScriptExecutor } from '@offline-ai/ai-test-runner';

// 1. Implement your executor
const executor: AIScriptExecutor = {
  async execute({ script, args }) {
    // Your AI logic here
    return { output: "result" };
  }
};

// 2. Initialize Runner
const runner = new AITestRunner(executor);

// 3. Listen to events for real-time reporting
runner.on('test:pass', (log) => console.log(`Fixture ${log.i} passed`));

// 4. Run!
const result = await runner.run('script-id', fixtures, {
  fixtureConfig: { /* globals */ },
  strict: false
});
```

## License

MIT
