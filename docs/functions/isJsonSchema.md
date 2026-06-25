[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / isJsonSchema

# Function: isJsonSchema()

> **isJsonSchema**(`expected`): `boolean`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/schema.ts:24](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/schema.ts#L24)

Heuristically determines if a given value should be treated as a JSON Schema.
It checks for the presence of a 'type' property with a valid JSON Schema type
and the absence of custom operators.

## Parameters

### expected

`any`

The value to check.

## Returns

`boolean`

True if the value appears to be a JSON Schema.
