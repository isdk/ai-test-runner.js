[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateExists

# Function: validateExists()

> **validateExists**(`actual`, `expected`, `ctx`): `Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/operators/exists.ts:27](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/operators/exists.ts#L27)

Validates whether a property exists or is defined.

Supports three modes via the `expected` parameter:

1. **Boolean shorthand** (普通模式):
   - `$exists: true`  → 要求 actual !== undefined
   - `$exists: false` → 要求 actual === undefined

2. **Object form with `nullAsAbsent`** (非空模式):
   - `$exists: { $value: true, nullAsAbsent: false }`
     → 要求 actual !== undefined && actual !== null
   - `$exists: { $value: false, nullAsAbsent: false }`
     → 要求 actual === undefined 或 actual === null
   - 默认 `nullAsAbsent: false`，与布尔简写行为一致（null 视为 "不存在"）

3. **Object form with `strict`** (严格模式):
   - `$exists: { $value: true, strict: true }`
     → 要求 key 在父对象中存在（即使值为 undefined/null 也算存在）
   - `$exists: { $value: false, strict: true }`
     → 要求 key 在父对象中完全缺失
   - `strict` 与 `nullAsAbsent` 可组合使用

## Parameters

### actual

`any`

### expected

`any`

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

## Returns

`Promise`\<[`ValidationResult`](../type-aliases/ValidationResult.md)\>
