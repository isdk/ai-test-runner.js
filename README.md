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

The engine allows defining complex assertions via the `expect` object. Note that you can use both top-level `output` and the `expect` object simultaneously in a single fixture.

**Example: Simultaneous Validation**

```yaml
- input: { name: 'Alice' }
  output: "Hello Alice"  # Validates the main output string
  expect:
    messages:            # Validates the internal execution trace
      $contains: { role: 'assistant', content: /Alice/ }
```

#### 1.1 Basic Matching (`expect.output`)

Supports strings, regular expressions, and numeric checks.

- **Regex Example**: Validate that the output matches a specific pattern.

  ```yaml
  expect:
    output: "/^Hello, .+\\!$/i" # Matches "Hello, Alice!"
  ```

- **Regex with Templates**: Templates can be used inside regular expression objects or regex strings.

  ```yaml
  - input: { name: 'Alice' }
    output: "/{{name}}/i"  # Will be resolved to /Alice/i
  ```

#### 1.2 Advanced Collection and Logic Operators

Powerful assertions for complex validation scenarios, including logical and collection-based matching:

- **`$and`**: Passes if **all** validation conditions in the array are met. Useful for applying multiple constraints (e.g., regex and length) to the same property.
- **`$or`**: Passes if **at least one** condition in the array is met.
- **`$contains`**: Passes if the array contains at least one item matching the pattern.
- **`$all`**: Passes if the array contains all specified items, regardless of order.
- **`$sequence`**: Passes if the array contains specified items in the exact order (noise allowed in between).
- **`$not`**: Negative assertion; fails if the pattern matches.

**Example: Using Logic Operators**

```yaml
expect:
  output:
    $and:
      - "/^Hello/"         # Must start with Hello
      - { $not: "/World/" } # AND must not contain World
  messages:
    $or:
      - $contains: { role: 'assistant', tools: [{ name: 'get_user' }] }
      - $contains: { role: 'assistant', tools: [{ name: 'find_person' }] }
```

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

#### 1.4 Template Object Support

The template system not only supports string replacement but also allows direct replacement of "pure placeholders" with original objects/values. This is especially useful when you need to pass complex objects from input data directly to validators or use them as expected output.

- **Pure Placeholder Replacement**: If a template string contains only a single variable (e.g., `{{user}}`), and that variable is an object/array/boolean in the data, the template is replaced with the value itself rather than a stringified result.
- **Deep Recursive Resolution**: If the resolved object still contains templates, the system automatically resolves them recursively.
- **Complex Path Support**: Supports deep property access, such as `{{users[0].profile}}`.

**Example: Direct Object Validation**

```yaml
- input:
    user: { id: 1, name: 'Alice' }
  expect:
    output: "{{user}}"  # Resolved directly to { id: 1, name: 'Alice' }, enabling deep object matching.
```

### 2. Custom Validation Operators

When declarative matching or simple custom functions aren't enough, you can define reusable validation logic via `operators`.

#### 2.1 Definition & Reference

Custom operators can be defined in the YAML Front-matter (file-level) or within a single test case (item-level). It's recommended to start the operator name with `$` to distinguish it from standard properties.

The following reference protocols are supported:

- **Local Files**: `js://./utils.js#checkCode` or `./utils.js#checkCode` (relative to `baseDir`).
- **npm Packages**: `lodash-es#isEqual` or `my-test-utils#validator`.
- **Export Specification**: Use `#` to specify the export name; defaults to the `default` export.

**Example:**

```yaml
---
operators:
  $checkCode: "./checkers.js#checkCode"
  $isEqual: "lodash-es#isEqual"
---
- input: "Write a sum function"
  expect:
    output:
      $checkCode: { strict: true, lang: 'ts' }
```

#### 2.2 Operator Function Signature

The system supports two signature modes. The **Simplified Mode** is recommended for the best developer experience.

##### Simplified Mode (Recommended)

Suitable for most business logic validations.

```javascript
/**
 * @param actual   - The actual output from the AI
 * @param expected - Parameters passed to this operator in YAML (e.g., { strict: true })
 * @param fixture  - Current test context, including:
 *                   - $data: Fully rendered template data
 *                   - $validate: Recursive validation method (act, exp) => Promise<Failures[]>
 *                   - Other top-level properties of the fixture
 */
export async function checkCode(actual, expected, fixture) {
  if (expected.strict && actual.includes('eval')) {
    return "eval is not allowed"; // Return a string representing the failure reason
  }
  return true; // Return true to indicate success
}
```

##### Standard Mode (Low-level)

If you need to directly manipulate the failure list or perform complex path control. Automatically triggered when the function receives 4 arguments.

```javascript
export async function myOp(actual, expected, ctx, validateMatch) {
  if (actual !== expected) {
    ctx.addFailure({ message: 'mismatch', expected, actual });
  }
  return ctx.failures;
}
```

#### 2.3 Recursive Validation & $validate

You can call `fixture.$validate` within a custom operator to reuse existing validation logic (including regex, Schema, or other operators).

```javascript
export async function $eachMatch(actualArray, pattern, fixture) {
  for (const item of actualArray) {
    const failures = await fixture.$validate(item, pattern);
    if (failures.length > 0) return `Item ${item} does not match pattern`;
  }
  return true;
}
```

#### 2.4 Configuration Options

- **`allowOperatorOverride`**: (Default `false`) Whether to allow custom operators to override built-in ones (e.g., `$contains`).
- **`baseDir`**: The base directory used to resolve local relative paths.

### 3. AI Tool Testing

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

In addition to direct property access, you can also access the `input` object itself via the `input` prefix in templates (e.g., `{{input.query}}` or `{{input}}`).

**Example: Input Prefix in Templates**

```yaml
- input: { language: 'en', user: { name: 'Bob' } }
  output:
    lang: "{{input.language}}"    # Accesses deep input property
    text: "Hi {{input.user.name}}" # Accesses nested input property
```

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
