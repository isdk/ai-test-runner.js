# @isdk/ai-test-runner

> 【English|[中文](./README.cn.md)】
---

A lightweight, decoupled core engine for testing AI scripts, agents, and prompts.
While it originates from the [ISDK AI](https://github.com/isdk) ecosystem, it is designed as a **general-purpose engine** for any AI testing. You can easily adapt it to your own AI workflow by simply implementing the `AIScriptExecutor` interface.

`ai-test-runner` provides a robust framework for executing AI test fixtures and validating outputs using multiple strategies.

## Features

### 🧩 Fully Decoupled Architecture

The core logic is independent of any CLI framework or File System. You can integrate it into Node.js servers, Web environments, or CI/CD pipelines by simply implementing the `AIScriptExecutor` interface.

### 🛠️ AI Tool Testing (New)

Supports integration testing of AI function scripts as "tools". The engine automatically redirects to a driver script (`toolTester`) and allows validation of complex tool call sequences.

### 📐 Comprehensive Validation Strategies

- **String & RegExp**: Supports partial string matching and complex Regular Expressions.
- **Deep Object/Array**: Recursively validates nested data structures, including regex matching for object keys.
- **Advanced Operators (New)**: Provides `$contains`, `$all`, `$sequence`, and `$not` for powerful collection validation.
- **Semantic Diffing**: Allows for minor variations in output (e.g., ignoring extra newlines or specific character changes) via structured `diff` rules.
- **JSON Schema (Ajv)**: Built-in support for JSON Schema with extensive custom keywords and formats.
- **Custom Functions**: Supports any complex matching logic via JavaScript/TypeScript functions.
  - When `output` is a function, it receives `(actualOutput, input)`.
  - When `expect` is a function, it receives `(fullResult, input)`, where `fullResult` contains `output` and `messages`.
  - Returns `true` for success or a string for the failure reason.

### 📝 Advanced Template System

- **Dynamic Variables**: Inject variables into inputs, outputs, and even validation rules.
- **Recursive Resolution**: Automatically resolves deep dependency chains (e.g., `a` depends on `b`, `b` depends on `c`).
- **Context Awareness**: Supports directory variables like `__fixture_dir__` and `__script_dir__`.
- **Dynamic Regex Keys (New)**: Supports regex keys with template variables in object matching: `"/^{{id}}_/"`.

### 🌓 Flexible Matching Modes

Supports `Strict` and `Partial` matching at a granular level. You can configure whether to allow extra properties in objects, whether array lengths must match, or unverified changes in diffs.

---

## Specification

### 1. AIScriptExecutor Contract

The executor must return a Promise resolving to the following structure:

```typescript
interface AIExecutionResult {
  output: any;      // Final generated output (for 'output' matching)
  messages?: any[]; // (Optional) Full message list of the execution (for 'expect' matching)
}
```

#### Standard Message Format (Message)

- `role`: `'user' | 'assistant' | 'tool' | 'system'`
- `content`: `string` (Optional)
- `tools`: `ToolCall[]` (Optional)
  - `name`: Tool name
  - `args`: Call arguments (Object)
  - `result`: Tool execution result (Optional)

### 2. Operator Behavior

- **`$contains`**: For arrays, passes if at least one element matches the pattern.
- **`$all`**: For arrays, must contain all specified items (order independent).
- **`$sequence`**: For arrays, must contain specified items in the exact order (allows noise in between).
- **`$not`**: Negative assertion, fails if the content matches the pattern.
- **`$schema`**: Explicitly validates the value against a JSON Schema (Recommended).

---

## Installation

```bash
pnpm add @isdk/ai-test-runner
```

## Detailed Usage Guide

### 1. Data Format (Fixture)

A fixture typically consists of an `input`, an expected `output`, or an `expect` block for full trace validation.

```yaml
---
tools: [calculator.ai.yaml]
toolTester: agent.ai.yaml # Defaults to 'toolTester'
---
- input: "What is 1+1?"
  output: "2"
  expect:
    tools: # Syntactic sugar: lookup tool calls in message trace
      - name: calculator
        args: { a: 1, b: 1 }
  not: false   # If true, test passes only if output does NOT match
  skip: false
  strict: object # Enable strict mode for this specific case
```

### 2. Syntactic Sugar: expect.tools

`expect.tools` is a simplified assertion designed for tool testing. It automatically scans all tool calls initiated by the AI (`assistant` role) in the `messages` trace.

**Specification:**

- **Auto Aggregation**: The engine iterates through all messages to extract all `tools` lists.
- **Matching Mode**:
  - If `expect.tools` is an **Array**, it uses **`$all`** logic by default.
  - If `expect.tools` contains **`$sequence`**, it requires tools to be called in the specified order.
- **Deep Matching**: `name`, `args`, and `result` of each tool item support regex, partial object matching, and template variables.

```yaml
expect:
  tools: [ { name: 'weather', args: { city: 'Shanghai' } } ]
```

### 3. Template Variables & Dynamic Keys

You can use `{{name}}` to inject variables. Now even **Object Keys** can be dynamic regex or nested paths:

**Dynamic Regex Keys:**

```yaml
# fixtureConfig
variables:
  id: "123"
---
- input: { query: "user" }
  output:
    "/^user_{{id}}_/": "ok" # Matches keys like user_123_data
```

**Nested Path Keys:**

You can use dot notation (e.g., `a.b.c`) to validate nested properties directly:

```yaml
- input: "get profile"
  output:
    "user.profile.name": "Alice"
    "user.profile.age": 30
```

### 4. Diff Validation

Use `diff` to provide supplemental validation for strings. In `ai-test-runner`, the `diff` list acts as an **"Allowed Variations Whitelist"**.

#### Whitelist Philosophy

1. **Distinguish "Allowed" from "Error"**: Without this list, any character difference (even a single space or newline) causes validation to fail. By listing items in `diff`, you are telling the engine: "If the output ends with an extra newline, it's acceptable; but if it adds an unexpected exclamation mark `!`, it's an error."
2. **Subset Matching (Default Mode)**:
    * The actual changes in the output must be a **subset** of the whitelist.
    * You don't *have* to produce all changes in the whitelist (unless they are marked as `required`), but you absolutely cannot produce any change that is *not* in the whitelist.
3. **Strict Mode (`strict: diff`)**: The actual changes must **exactly match** the whitelist.
4. **Permissive Mode (`diffPermissive: true`)**: The whitelist is only used to check for `required` items. Any other unverified changes in the output are ignored.

#### Example

```yaml
- input: "test"
  output: "test"
  # Default: Whitelist Mode
  diff:
    - value: "."
      added: true   # Allowed: trailing dot is now acceptable
    - value: "\n"
      added: true   # Allowed: extra newline is now acceptable
    - value: "Required Title"
      added: true
      required: true # Mandatory: this change MUST exist in the output
```

**Advanced Configuration:**

```yaml
diff:
  permissive: true # Enable Permissive Mode (ignore unverified changes)
  items:
    - { value: "\n", added: true }
```

### 5. JSON Schema Validation

`ai-test-runner` provides a powerful way to validate complex data structures using JSON Schema.

#### Explicit Validation (Recommended)

Use the `$schema` operator to explicitly indicate that a block should be validated as JSON Schema:

```yaml
- input: { get_user: 1 }
  output:
    profile:
      $schema:
        type: object
        properties:
          name: { type: string, pattern: "^[A-Z]" }
          age: { type: number, minimum: 18 }
```

#### Heuristic Recognition (Legacy)

The engine also automatically recognizes objects with a `type` property as JSON Schema if the `type` is a standard JSON primitive. However, using `$schema` is recommended to avoid ambiguity.

**Disabling Heuristic Recognition:**

If your data naturally contains properties named `type` that are not meant to be schemas, you can disable this behavior globally or per fixture:

```yaml
disableHeuristicSchema: true
```

When disabled, only `$schema` operators or `!json-schema` tags will trigger JSON Schema validation.

```yaml
- input: { get_user: 1 }
  output:
    name: { type: string, pattern: "^[A-Z]" }
```

#### Extended Keywords

- **String**: `regexp`, `transform` (trim, toLowerCase, etc.).
- **Number**: `range`, `exclusiveRange`.
- **Object**: `allRequired`, `anyRequired`, `deepProperties`.
- **Dynamic Defaults**: `timestamp`, `datetime`, `randomint`, etc.

---

## Integration API

```typescript
import { AITestRunner, AIScriptExecutor } from '@isdk/ai-test-runner';

// 1. Implement your executor
const executor: AIScriptExecutor = {
  async execute({ script, args }) {
    // Your AI logic here
    return {
      output: "result",
      messages: [ /* Interaction history */ ]
    };
  }
};

// 2. Initialize Runner
const runner = new AITestRunner(executor);

// 3. Listen to events
runner.on('test:pass', (log) => console.log(`Fixture ${log.i} passed`));
runner.on('test:fail', (log) => console.error(`Fixture ${log.i} failed`, log.failures));

// 4. Run!
const result = await runner.run('script-id', fixtures, {
  fixtureConfig: { /* globals */ },
  strict: false
});
```

## License

MIT
