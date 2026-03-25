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

Powerful assertions for complex validation scenarios, including logical, collection-based, and specialized matching:

**Logic & Collection:**

- **`$and`**: **Logical AND**. Requires the actual value to satisfy **all** validation conditions specified in the array. Ideal for enforcing multiple constraints simultaneously.
- **`$or`**: **Logical OR**. Passes if the actual value satisfies **at least one** condition in the array. The system evaluates all branches and automatically adopts the highest-scoring branch upon match.
- **`$not`**: **Logical NOT (Negative Assertion)**. Fails if the actual value matches the expected pattern; passes otherwise. Frequently used for blacklisting, e.g., `$not: /Sensitive_Word/`.
- **`$contains`**: **Inclusion Check**. Behavior adapts smartly based on the target type:
  - If the target is an **array**, it verifies that the array contains **at least one item** matching the expected pattern.
  - If the target is a **string**, it performs a substring search.
  - If the target is an **object**, it performs a subset (partial key-value) match.
- **`$all`**: **Full Subset Inclusion (Unordered)**. Requires the actual **array** to contain **all** items listed in the `$all` expectation, regardless of the order in which they appear, and allows for other unlisted elements.
- **`$each`**: **Element-wise Validation**. Requires **every single element** in the actual **array** to match the given **single** validation rule. Vacuously passes on empty arrays; automatically distributes score weighting evenly across the dynamic number of items. Highly suitable for homogeneity assertions, e.g., `$each: { status: 'active' }`.
- **`$sequence`**: **Ordered Sequence Check**. Requires the actual **array** to contain the specified items in the exact expected order. Intermediate, unlisted noise items are permitted between matches (i.e., relative ordering). Perfect for validating multi-step LLM tool-calling paths.
- **`$exists`**: **Existence Validation**. Validates whether a property exists within an object. Supports:
  - Shorthand mode: `$exists: true | false` (verifies value is not `undefined`).
  - Strict mode: `$exists: { $value: false, strict: true }` (strictly checks if the key exists in `Object.keys()`).

**Array Processing & Transformation:**

- **`$sort`**: **Array Sorting**. Sorts the actual array before applying further validations. Use the `$by` property to specify the field(s) to sort by. Use a `-` prefix for descending order. If `$by` is omitted, it performs a natural sort. Once sorted, the remainder of the expectation object is applied to the sorted array. Perfect for chaining with `$first`, `$last`, or `$sequence`.
  - Usage Example: `$sort: { $by: "-createdAt", $first: { status: "success" } }`
- **`$nth`**: **Element Extraction by Index**. Retrieves the element at the specified `$index` from the actual array and validates it against the remainder of the expectation object. Supports negative indexing (e.g., `-1` for the last element) and out-of-bounds protection.
  - Usage Example: `$nth: { $index: 1, status: "success" }`
- **`$first`**: **First Element Extraction**. A convenient syntactic sugar for `$nth: { $index: 0 }`. Extracts the first element of the array for validation.
- **`$last`**: **Last Element Extraction**. A convenient syntactic sugar for `$nth: { $index: -1 }`. Extracts the last element of the array for validation.

**Comparison:**

- **`$eq`, `$ne`**: **Equality & Inequality**. Strictly checks if the actual value equals (`$eq`) or does not equal (`$ne`) the expected value.
- **`$gt`, `$gte`, `$lt`, `$lte`**: **Numeric & Relational Bounds**. Validates if the actual value is greater than (`$gt`), greater-than-or-equal (`$gte`), less than (`$lt`), or less-than-or-equal (`$lte`) to the expected value. Suitable for comparing scores, ages, or any numeric/relational metrics.
- **`$in`, `$nin`**: **Array Inclusion**. Checks if the actual value is present (`$in`) or not present (`$nin`) within the expected array.

**Expression:**

- **`$expr`**: **Dynamic Expression Evaluation**. Intuitively evaluates a string expression (using JavaScript syntax) to perform complex mathematical calculations or cross-field logic bridging actual output, data, and input. Supports asynchronous and synchronous logic.
  - Automatically injects context variables like `actual`, `expected`, `data`, `input`, and `ctx` into the evaluation scope.
  - Highly suitable for mathematical computations and multi-property validation, allowing you to bypass deep nesting.
  - Usage Example: `$expr: "actual > data.threshold"` or `$expr: "actual.price * actual.quantity >= 500 && data.userRole === 'admin'"`.

**Specialized Operators:**

- **`$expect`**: A transparent wrapper used to attach scoring metadata (weight, critical) and titles to any validation node. [See Scoring Strategy](#2-scoring-strategy).
- **`$diff`**: Forces semantic diff analysis with specific strategies or whitelists. [See Semantic Diff Validation](#6-semantic-diff-validation).
- **`$schema`**: Explicitly validates a value against a JSON Schema. [See JSON Schema Validation](#5-json-schema-validation).

**Example: Using Logical and Existence Operators**

```yaml
expect:
  output:
    $and:
      - "/^Hello/"         # Must start with Hello
      - { $not: "/World/" } # AND must not contain World
    metadata:
      author: { $exists: true }  # Author must exist
      internal_id: { $exists: false } # Internal ID must not exist
```

**Example: Strict Mode Property Absence**

```yaml
expect:
  output:
    legacy_field:
      $exists:
        $value: false
        strict: true  # Key must be physically absent from the object
```

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

### 2. Scoring Strategy

In non-deterministic AI scenarios, a simple Passed/Failed result is often too arbitrary. `ai-test-runner` introduces a sophisticated scoring system to quantify LLM output quality, supporting flexible strategies and fuzzy matching.

#### 2.1 Core Configuration

Enable scoring in a fixture or globally:

- **`scoring`**: `true | false | 'auto'`. Enables scoring mode.
- **`maxScore`**: (Default `100`) The maximum possible score for the test. This value is also used as the base for percentage-based weight distribution.
- **`passScore`**: (Default equals `maxScore`) The minimum score required for the test to be considered "passed" (`passed: true`).
- **`unassignedWeight`**: (Optional) Alias for `totalUnassignedWeight`. Default relative budget for items without an explicit `score`.
- **`totalUnassignedWeight`**: (Optional, default `0.1`) Total budget for all unassigned items. The system ensures unassigned items share this budget to avoid score dilution.
- **`autoConfidence`**: (Optional, default `true`) Automatically treats weights between 0 and 1 as confidence scores. Use `'force'` to skip heuristic and always treat as confidence.

#### 2.2 Hierarchical Relative Weighting & Strategies

The system uses a **"top-down distribution, bottom-up aggregation"** model. Scores are distributed to child validation nodes (e.g., properties in an object, elements in an array, conditions in `$and` / `$or`) and then aggregated back to the parent. The exact distribution and aggregation logic are controlled by **Scoring Strategies**.

- **Weight Normalization**: Within each level, peer items compete for a share of the parent's `allocatedScore`.
- **Adaptive Scale**: You can use percentages (`0~1`) or integer points (`0~maxScore`); the system automatically scales them proportionally.
- **Dynamic Allocation**: If some items have scores and others don't, unassigned items split the remaining weight based on the chosen strategy and `unassignedWeight`.

#### 2.3 `score` Metadata (`$meta`) & Dimensions (`$dimension`)

> **⚠️ Note (Breaking Change)**: Starting from v1.x, keys like `score`, `title`, `critical`, `description`, `dimension` have returned to being normal business data and are no longer filtered as metadata.
> **All metadata must now be defined via the `$meta` container or using `$`-prefixed shorthands.**

You can attach metadata to any validation node (string, regex, operator, field) via `$meta` or directly in operator properties.

**Recommended: Use `$meta` Container (Explicit Mode)**
When `$meta` is present, the top-level namespace remains clean, allowing you to safely validate business fields with the same names.

```yaml
someField:
  score: 100         # Business data: actual output must have score: 100
  $meta:
    score: 80        # Metadata: weight for this validation
    title: "Core Field"
```

**Shorthand: Use `$` Prefix (Shorthand Mode)**
When `$meta` is **NOT** present, you can use `$`-prefixed shorthand keys:

```yaml
# score can be a shorthand number (relative weight)
$score: 80

# Or an object with "Red-Line" logic, penalties, and dimensions
$score:
  value: -20          # Penalty: subtracted if matched
  critical: true      # Mandatory: if reward fails or penalty triggers, 'passed' becomes false
$dimension: 'security' # Category for multi-dimensional reporting
$strategy: 'weighted'  # (Optional) Scoring strategy for children
$threshold: 0.75      # (Optional) Confidence threshold
```

- **`$dimension`**: (Optional `string`) Defines the category (e.g., `accuracy`, `fluency`, `security`).
- **Penalties**: Negative values act as absolute deductions.

#### 2.4 `$expect`: The Scoring Wrapper

`$expect` is a transparent wrapper used to inject scoring metadata, titles, and dimension configuration anywhere:

```yaml
output:
  $and:
    - $expect: /Spring/
      $meta: { score: 80, dimension: 'accuracy', critical: true }
      $title: "Core keyword"
    - $expect: /Flower/
      $score: 20
      $threshold: 0.5
    - $expect: /SensitiveWord/
      $score: { value: -50, dimension: 'security' }
      $title: "Security deduction"
```

#### 2.5 `$diff`: Per-item Scoring

For long-form text or complex JSON, you can score individual whitelist items:

```yaml
expect:
  $diff:
    items:
      - value: "Key Conclusion"
        added: true
        $score: { value: 90, critical: true }
      - value: "optional adjective"
        added: true
        $score: 10
    permissive: true # Only score based on whitelist items.
```

#### 2.6 Log Feedback

The resulting `logItem` includes:

- **`score`**: The final calculated quantitative score.
- **`scoreDetails`**: **(New)** A tree structure of scores, recording key, title, dimension, weight, and earned score for every item.
- **`passScore`**: The threshold for passing the entire fixture.
- **`failedCritical`**: A list of mandatory items that failed (including triggered Critical penalties).

### 3. Custom Validation Operators

When declarative matching or simple custom functions aren't enough, you can define reusable validation logic via `operators`. Custom operators are now fully integrated with the scoring system, allowing them to return confidence scores.

#### 3.1 Definition & Reference

Custom operators can be defined in the YAML Front-matter (file-level) or within a single test case (item-level).

Two configuration formats are supported:

- **Object Format (Explicit)**: Specify the operator name as a key.

  ```yaml
  operators:
    checkCode: "./checkers.js#checkCode"
    isEqual: "lodash-es#isEqual"
  ```

- **Array Format (Inferred)**: List the paths directly, and the framework will infer the name.

  ```yaml
  operators:
    - "js://./checkers.js#checkCode" # Automatically inferred as $checkCode
  ```

**Name Inference & $ Prefix:**

- **Auto-prefixing**: Regardless of the format used, the framework automatically prepends a `$` prefix (e.g., `checkCode` becomes `$checkCode`) to match the style of built-in operators.
- **Inference Logic**: In the array format, the framework prioritizes the export name (after `#`). If not provided, it uses the filename and automatically converts it to **camelCase** (e.g., `my-check.js` or `my.check.js` will resolve to `$myCheck`).

The following reference protocols are supported:

- **Protocol Prefix**: Custom operators support protocol prefixes for future extensibility to other languages. If no prefix is provided, it defaults to `js:` (JavaScript).
- **Local Files**: `js://./utils.js#checkCode` or `./utils.js#checkCode` (relative to `baseDir`).
- **npm Packages**: `lodash-es#isEqual` or `my-test-utils#validator`.
- **Export Specification**: Use `#` to specify the export name; defaults to the `default` export.

**Example: Loading via Array**

```yaml
---
operators:
  - "./checkers.js#checkCode" # Inferred as $checkCode
---
- input: "Write a sum function"
  expect:
    output:
      $checkCode: { strict: true, lang: 'ts' }
```

#### 3.2 Operator Classification & Development Modes

The system classifies operators into two categories based on their function, providing different development experiences:

##### 3.2.1 Atomic Assertion Operators

Suitable for leaf nodes that directly validate the actual value (e.g., code linting, keyword detection). Supports extremely simplified return values.

```javascript
/**
 * @param actual   - The actual output from the AI
 * @param expected - Parameters passed to this operator in YAML
 * @param fixture  - Current test context
 * @returns {boolean | string | number | MatchResult}
 *          - `true/false`: Simple pass/fail.
 *          - `string`: Failure with a specific error message.
 *          - `number`: Returns 0-1 confidence score.
 *          - `MatchResult` object: Advanced result with `details` (tree), `dimension`, etc.
 */
export async function checkCode(actual, expected, fixture) {
  if (actual.includes('eval')) return "eval is not allowed";
  const confidence = actual.includes(expected.keyword) ? 1.0 : 0.0;
  return confidence;
}

// checkCode.virtual = true; // Default is virtual mode (true), core engine won't add a path level
```

##### 3.2.2 Logic Container Operators

Suitable for containers that organize multiple sub-validations (e.g., custom `$and`, `$or`). These operators usually involve recursive calls, and by using `ValidationContext` helpers, you can achieve a truly KISS implementation.

**Core Benefits:**

- **Inherent Strategy (`strategy`)**: Operators can declare their default aggregation logic (e.g., `weighted` or `max`). This ensures consistency; the developer simply calls `ctx.aggregate`, and the system automatically handles strategy priority.
- **Automatic Weight Distribution**: Use `ctx.distribute` to handle user-defined `score` weights automatically.
- **Path Automation**: Use `ctx.createChildContext` to automatically handle path indices and variable templates.

**Development Mode:**

```javascript
/**
 * @param actual   - The actual output from the AI
 * @param expected - List of expected sub-items
 * @param ctx      - ValidationContext (weight distribution, aggregation, path helpers)
 * @param validate - Recursive validation function
 */
export async function myContainer(actual, expectedList, ctx, validate) {
  const weights = ctx.distribute(expectedList);
  const results = [];
  for (let i = 0; i < expectedList.length; i++) {
    const subCtx = ctx.createChildContext(i, expectedList.length);
    results.push(await validate(actual[i], expectedList[i], subCtx));
  }
  // The system automatically applies the strategy declared in myContainer.strategy
  return ctx.aggregate(results, weights);
}

myContainer.virtual = true;
myContainer.strategy = 'weighted'; // Locks to the weighted sum strategy
```

#### 3.3 The `$value` Convention: Separating Target and Options

To unify operator interfaces, ai-test-runner introduces the `$value` convention. It allows you to pass a main "validation target" along with multiple auxiliary "configuration options".

When using the `$value` structure in YAML:

- The content of `$value` is passed as the `expected` argument.
- All other properties are extracted into `fixture.$options`.

**YAML Example:**

```yaml
expect:
  output:
    $checkCode:
      $value: "function sum" # Main validation target
      timeout: 1000          # Auxiliary option, available in fixture.$options
      strict: true
```

**Operator Implementation:**

```javascript
export function checkCode(actual, expected, fixture) {
  const { timeout, strict } = fixture.$options;
  // 'expected' is now directly "function sum"
  // ...
}
```

#### 3.4 Recursive Validation & `$validate`

You can call `fixture.$validate` or the standard `validate` parameter within a custom operator to reuse existing validation logic.

#### 3.5 Virtual Path Strategy (`virtual` property)

Operators declare their path behavior in the detail tree via the `virtual` property. The system follows the **"Default Virtual"** principle:

- **`true` (Default)**: **Virtual mode**. The core engine does not add a nesting level to the current path (penetration).
  - **Single-element scenarios**: Fully transparent; children directly inherit the parent path (e.g., `output`).
  - **Multi-element scenarios**: Automatically generates readable branches using templates (e.g., `$and[0]`).
- **`false`**: **Physical mode**. Forces retention of the operator's physical level in the path (e.g., `output.$myOp`).
- **`string`**: **Custom mode**. Supports path customization via templates (e.g., `$operator[$key]`).

#### 3.6 Operator Input Type Declaration (`expects` property)

To enhance type checking accuracy and avoid redundant basic type validations within operators, an operator can declare its expected `actual` (actual value) type by attaching an `expects` property to its function.

If the `actual` type does not match the operator's declared expectation, the core validation engine will throw an error before the operator executes, providing a clear error message like `Operator $myOp requires an array, but got string`.

The `expects` property can be a string or an array of strings:

- **String Form**: `operatorFunction.expects = 'array'`
  This indicates that the operator expects `actual` to be an array.
- **String Array Form**: `operatorFunction.expects = ['array', 'object']`
  This indicates that the operator expects `actual` to be either an array or an object. Currently, the core engine strictly enforces the `'array'` type. If the `expects` array includes `'array'` and `actual` is not an array, an error will be triggered.

Note: Currently only `array` type is enforced for checking.

**Example: Declaring an Operator Expects Array Input**

```typescript
// in myCustomOperator.ts
export async function $myArrayOperator(actual, expected, ctx, validateMatch) {
  // ... core logic of the operator, confident that actual is an array
}
$myArrayOperator.expects = 'array'; // Declare this operator expects an array as input
```

Alternatively, if the operator is custom and registered in the `operators` option:

```yaml
# Define custom operator in YAML
operators:
  $myArrayOperator: "js://./myCustomOperator.js#$myArrayOperator" # Assuming this file exports $myArrayOperator with expects property set
```

**Impact on Built-in Operators:**

Built-in operators like `$contains`, `$all`, and `$sequence` now also explicitly declare their expectation for array input via the `expects = 'array'` property. When the `actual` value is not an array, the core validation engine will report an error prematurely.

#### 3.6 Configuration Options

- **`allowOperatorOverride`**: (Default `false`) Whether to allow custom operators to override built-in ones (e.g., `$contains`).
- **`baseDir`**: The base directory used to resolve local relative paths.

### 4. AI Tool Testing

Simplified solutions for Agents and tool call scenarios. **Note: The executor must return standard `messages` for these tests to function.**

#### 4.1 Tool Configuration & Drivers

- **`tools`**: Specifies the list of tools available to the AI. Supports `boolean | string | Record | Array`.
- **`toolTester`**: The script ID responsible for driving the test (defaults to `'toolTester'`).

#### 4.2 `tools: true` Automatic Binding

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
    tools: [{ name: 'weather', args: { city: /Shanghai|上海/ } }]
```

#### 4.3 `expect.tools` Syntactic Sugar

No need to manually parse `messages`; the engine automatically extracts all tool calls initiated by the `assistant` for matching.

### 5. JSON Schema Validation

The most rigorous way to validate structured output.

#### 5.1 Heuristic Recognition

By default, heuristic recognition is enabled. If an object has a `type` property with a value of `string`, `number`, `integer`, `boolean`, `object`, or `array`, it is automatically treated as a JSON Schema.

To use `type` as a standard business data field, set `disableHeuristicSchema: true`.

#### 5.2 Explicit Validation

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

### 6. Semantic Diff Validation

Solves the "technically correct but slightly different" output problem from LLMs. ai-test-runner features a powerful diff engine that intelligently analyzes output changes.

#### 6.1 Built-in Semantic Feedback

By design, **all string comparisons in the engine automatically leverage the diff engine upon failure.**

Even if you don't explicitly use the `$diff` operator, if a string match (including those inside `$expect`) fails a simple inclusion check, the engine automatically performs a structured diff. This ensures that every validation failure provides high-signal feedback, showing exactly which characters, words, or JSON fields differ, rather than a generic "mismatch" message.

#### 6.2 Smart Diff Strategy (`auto`)

By default (or via `diff: 'auto'` or `diff: true`), the engine uses heuristic detection:

- **JSON**: Automatically formats and compares by key-value pairs using paths, ignoring indentation and field order.
- **Multi-line Text**: Switches to line-by-line diff (`lines`).
- **Long Text**: Switches to word-by-word diff (`words`).
- **Short Strings**: Uses precise character-by-character diff (`chars`).

#### 6.2 Supported Diff Types

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

#### 6.3 Permissive Mode (`diffPermissive`)

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

### 3. Core Types

#### 3.1 `AITestFixture`

The definition for a single test case.

```typescript
export interface AITestFixture {
  title?: string;
  input?: any;                // Data injected into templates
  output?: any;               // Expected primary output
  outputSchema?: any;         // JSON Schema for output validation
  script?: string;            // Script ID/source override
  tools?: AITestTools;        // Tools configuration
  toolTester?: string;        // Custom tool tester script
  expect?: any;               // Trace/Messages validation
  strict?: AIStrictOption;    // Strict mode toggle
  checkSchema?: boolean;      // Enable/disable schema check
  disableHeuristicSchema?: boolean;
  operators?: Record<string, any>; // Custom operators
  allowOperatorOverride?: boolean;
  scoring?: boolean | 'auto'; // Enable scoring
  maxScore?: number;          // Maximum possible score
  passScore?: number;         // Passing threshold
  unassignedWeight?: number;  // Default weight for unlabeled items
  only?: boolean;             // Run only this test
  skip?: boolean;             // Skip this test
  not?: boolean;              // Negate validation
  [key: string]: any;         // Custom template variables
}
```

#### 3.2 `AITestLogItem`

Detailed result for each executed fixture.

| Property | Description |
| :--- | :--- |
| `title` | Fixture title |
| `passed` | Whether all validations passed |
| `score` | Final calculated score |
| `scoreDetails` | **(New)** Detailed score breakdown (key, title, dimension, weight, score) |
| `maxScore` | Maximum possible score |
| `passScore` | Passing threshold |
| `failedCritical` | List of mandatory (critical) validation failures |
| `input` | Resolved input data |
| `actual` | Actual output from AI |
| `expected` | Expected output (formatted) |
| `reason` | Extracted reasoning/explanation |
| `expectedSchema` | Resolved JSON Schema |
| `failures` | List of validation failures |
| `error` | Technical execution error |
| `duration` | Execution time (ms) |
| `script` | **(New)** Actual script ID/source used |
| `actualTrace` | **(New)** Full interaction history (messages) |
| `expectedTrace` | **(New)** Resolved expectation for trace |
| `tools` | **(New)** Final resolved tools list |
| `vars` | **(New)** Final resolved template variables |

#### 3.3 `AITestRunnerOptions`

Global configuration for the runner.

| Property | Description |
| :--- | :--- |
| `fixtureConfig` | Default values for all fixtures (`Partial<AITestFixture>`) |
| `userConfig` | Runtime config passed to the executor |
| `strict` | Global strict mode setting |
| `logVars` | **(New)** Control inclusion of `vars` in log: `true`, `false`, or `'error'` |
| `scoring` | Global scoring toggle |
| `maxScore` | Global default max score |
| `passScore` | Global default passing threshold |
| `unassignedWeight` | Global default weight for unlabeled items |

### 4. Event Lifecycle

| Event | Triggered | Parameters |
| :--- | :--- | :--- |
| `test:start` | Before execution | `{ i, script, input }` |
| `test:pass` | All assertions passed | `AITestLogItem` |
| `test:fail` | Assertion failed | `AITestLogItem` |
| `test:error` | Execution crashed | `AITestLogItem` |
| `test:skip` | Skipped due to skip/only logic | `AITestLogItem` |

## License

MIT
