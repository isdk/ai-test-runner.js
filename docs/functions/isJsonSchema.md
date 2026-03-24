[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / isJsonSchema

# Function: isJsonSchema()

> **isJsonSchema**(`expected`): `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/validate/schema.ts:24](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/schema.ts#L24)

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
