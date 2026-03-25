[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / validateJsonSchema

# Function: validateJsonSchema()

> **validateJsonSchema**(`actual`, `expected`, `ctx`): `Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/schema.ts:48](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/schema.ts#L48)

Validates a value against a JSON Schema.
Uses `YamlTypeJsonSchema` for validation and error reporting.

## Parameters

### actual

`any`

The actual value to validate.

### expected

`any`

The JSON Schema (object or YamlTypeJsonSchema instance).

### ctx

[`ValidationContext`](../classes/ValidationContext.md)

The validation context.

## Returns

`Promise`\<[`MatchResult`](../interfaces/MatchResult.md)\>

A promise resolving to the MatchResult.
