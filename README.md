# @isdk/ai-test-runner

> 【English|[中文](./README.cn.md)】
---

A lightweight, fully decoupled core engine for testing AI scripts, agents, and prompts. It provides a robust validation framework to help developers test LLM outputs efficiently and reliably.

## Key Features

- **🧩 Fully Decoupled**: Core logic is independent of environment. Integrate anywhere: Node.js, Browser, or CI/CD pipelines.
- **📐 Diverse Validation**: Supports string, regex, deep object matching, and advanced operators like $contains, $all, $sequence.
- **🛠️ Optimized for Tools**: Built-in simplified testing for AI function scripts (Tools), supporting validation of complex call sequences.
- **📝 Powerful Template System**: Variable injection, recursive resolution, and dynamic regex keys.
- **🌓 Semantic Diff Matching**: Whitelist mode for allowed output variations—no more test failures due to minor formatting shifts.

## Installation

```bash
pnpm add @isdk/ai-test-runner
```

## Quick Start

Run your AI tests in three simple steps. We recommend using `expect.output` for result validation:

### 1. Implement Executor (AIScriptExecutor)

```typescript
import { AITestRunner, AIScriptExecutor } from '@isdk/ai-test-runner';

const myExecutor: AIScriptExecutor = {
  async execute({ script, args }) {
    // Connect to your AI logic here
    return { output: "Hello World", messages: [] };
  }
};
```

### 2. Define Fixtures

```typescript
const fixtures = [
  {
    input: "Hi",
    expect: {
      output: /Hello/i  // Recommended: Use expect.output instead of top-level output
    }
  }
];
```

### 3. Run Test

```typescript
const runner = new AITestRunner(myExecutor);
const result = await runner.run('my-script-id', fixtures);
```

---

## User Manual

### 1. Validation Engine

The engine allows defining complex assertions via the `expect` object.

#### 1.1 Basic Matching (`expect.output`)

Supports strings, regular expressions, and numeric checks.

- **Regex Example**: Validate that the output matches a specific pattern.

  ```yaml
  expect:
    output: "/^Hello, .+\\!$/i" # Matches "Hello, Alice!"
  ```

#### 1.2 Advanced Collection Operators

Powerful assertions for arrays (e.g., message traces or tool call lists):

- **`$contains`**: Passes if the array contains at least one item matching the pattern.
- **`$all`**: Passes if the array contains all specified items, regardless of order.
- **`$sequence`**: Passes if the array contains specified items in the exact order (noise allowed in between).
- **`$not`**: Negative assertion; fails if the pattern matches.

**Example: Validating Tool Call Sequence**

```yaml
expect:
  messages:
    $sequence:
      - { role: 'assistant', tools: [{ name: 'get_user' }] }
      - { role: 'assistant', tools: [{ name: 'send_email' }] }
```

#### 1.3 Custom Validation Functions

When declarative matching isn't enough, use a function:

```typescript
expect: {
  output: (actual, input) => actual.length > 10 || "Output is too short"
}
```

### 2. AI Tool Testing

Simplified solutions for Agents and tool call scenarios. **Note: The executor must return standard `messages` for these tests to function.**

#### 2.1 Tool Configuration & Drivers

- **`tools`**: Specifies the list of tools available to the AI. Supports `boolean | string | Record | Array`.
- **`toolTester`**: The script ID responsible for driving the test (defaults to `'toolTester'`).

#### 2.2 `tools: true` Automatic Binding

When testing a tool script itself, you don't need to repeat its ID.

- **Logic**: Automatically wraps the current `script` ID into `[script]` and passes it to the AI.
- **Redirection**: Automatically switches the execution script to `toolTester`.

```yaml
# Test configuration for weather.ai.yaml
---
tools: true  # Automatically uses weather.ai.yaml as the available tool
---
- input: "What's the weather in Shanghai?"
  expect:
    tools: [{ name: 'weather', args: { city: 'Shanghai' } }]
```

#### 2.3 `expect.tools` Syntactic Sugar

No need to manually parse `messages`; the engine automatically extracts all tool calls initiated by the `assistant` for matching.

### 3. JSON Schema Validation

The most rigorous way to validate structured output.

#### 3.1 Heuristic Recognition

By default, heuristic recognition is enabled. If an object has a `type` property with a value of `string`, `number`, `integer`, `boolean`, `object`, or `array`, it is automatically treated as a JSON Schema.

To use `type` as a standard business data field, set `disableHeuristicSchema: true`.

#### 3.2 Explicit Validation

Using the `$schema` operator is recommended:

```yaml
expect:
  output:
    profile:
      $schema:
        type: object
        properties:
          age: { type: number, minimum: 18 }
```

### 4. Semantic Diff Validation

Solves the "technically correct but slightly different" output problem from LLMs. ai-test-runner features a powerful diff engine that intelligently analyzes output changes.

#### 4.1 Smart Diff Strategy (`auto`)

By default (or via `diff: 'auto'` or `diff: true`), the engine uses heuristic detection:

- **JSON**: Automatically formats and compares by key-value pairs using paths, ignoring indentation and field order.
- **Multi-line Text**: Switches to line-by-line diff (`lines`).
- **Long Text**: Switches to word-by-word diff (`words`).
- **Short Strings**: Uses precise character-by-character diff (`chars`).

#### 4.2 Supported Diff Types

You can explicitly set the `type` to force a specific algorithm:

- `chars`: Character-level (default).
- `words`: Word-level (ignores whitespace).
- `wordsWithSpace`: Word-level (preserves whitespace).
- `lines`: Line-level.
- `sentences`: Sentence-level.
- `json`: Structured JSON diff.

Example:

```yaml
expect:
  diff:
    type: json
    items:
      - path: "data.status"
        val: "success"
        added: true
```

#### 4.3 Permissive Mode (`diffPermissive`)

Setting `diffPermissive: true` or using `diff: { permissive: true }` in expectations disables the strict whitelist. The engine will ignore all undeclared changes and only verify that `required: true` items changed as expected.

```yaml
expect:
  output: "Hello"
  diff:
    permissive: true # Ignore all other variations
    items:
      - { value: "User", added: true, required: true } # Only ensure 'User' was added
```

---

## Technical Reference

### 1. AIScriptExecutor & Context

The `AIScriptExecutor` is the primary integration point. The runner passes an `AIExecutionContext` to its `execute` method.

#### 1.1 How `input` is Passed

The `input` defined in your fixture is merged into `context.args` using the following rules:

- **Object Input**: If `input` is an object (e.g., `{ query: "Hi" }`), its properties are spread directly into `args`. You can access them as `args.query`.
- **Non-Object Input**: If `input` is a primitive (string, number, etc.), it is wrapped in an `input` field. You can access it as `args.input`.

#### 1.2 How `tools` are Passed

When `tools` are configured in a fixture or global config:

- **Redirection**: The `context.script` is automatically changed to the `toolTester` (defaults to `'toolTester'`).
- **Args Injection**: All resolved tools are passed as an array in `context.args.tools`.
- **`tools: true`**: If set to `true`, the runner automatically includes the current script's ID in the `args.tools` array.

#### 1.3 Script ID Detection

The runner distinguishes a script ID from source code using the following logic:
`!/[\n\r{}]/.test(script) && script.length < 256`.
**Note**: `tools: true` requires a valid script ID.

### 2. Standard Message Format (`Message`)

The `messages` returned by the executor is an array of objects representing the full interaction trace. This is the **exclusive data source** for the `expect.tools` syntactic sugar.

```typescript
interface ToolCall {
  name: string;               // Tool name (Required)
  args: Record<string, any>;  // Call arguments (Required)
  result?: any;               // Tool execution result (Optional, for closed-loop validation)
}

interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content?: string;           // Text content
  /**
   * List of tool calls.
   * - When role is 'assistant', it represents the AI's call request.
   * - When role is 'tool', it represents the response from a tool execution.
   */
  tools?: ToolCall[];
}
```

#### 1.3 How `expect.tools` Works

When you use `expect: { tools: [...] }`, the Runner performs the following:

1. **Auto-Aggregation**: It iterates through the `messages` array to extract all entries containing a `tools` property.
2. **Path Mapping**: It maps your tool assertions to the deep structure of the messages. For example, `tools: [ { name: 'calc' } ]` validates: *"Is there a message whose `tools` array contains an object with `name: 'calc'`?"*
3. **Operator Conversion**: By default, it uses `$all` logic for collection matching.

### 2. AIScriptExecutor Implementation Example

The executor is the primary integration point between the library and your AI platform.

```typescript
import { AIScriptExecutor, AIExecutionContext, AIExecutionResult } from '@isdk/ai-test-runner';

export class MyAIExecutor implements AIScriptExecutor {
  async execute(context: AIExecutionContext): Promise<AIExecutionResult> {
    const { script, args, options } = context;

    // Example: Calling an AI service
    const response = await someAIService.ask({
      model: options.model || 'gpt-4',
      prompt: script, // Load content if it's an ID
      variables: args
    });

    return {
      output: response.text,           // For output validation
      messages: response.fullHistory,  // For tool call validation
    };
  }
}
```

### 3. Event Lifecycle

| Event | Triggered | Parameters |
| :--- | :--- | :--- |
| `test:start` | Before execution | `{ i, script, input }` |
| `test:pass` | All assertions passed | `AITestLogItem` |
| `test:fail` | Assertion failed | `AITestLogItem` |
| `test:error` | Execution crashed | `AITestLogItem` |
| `test:skip` | Skipped due to skip/only logic | `AITestLogItem` |

## License

MIT
