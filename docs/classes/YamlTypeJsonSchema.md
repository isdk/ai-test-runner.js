[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / YamlTypeJsonSchema

# Class: YamlTypeJsonSchema

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:33](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L33)

Represents a YAML-compatible JSON Schema object.
When used with the `!json-schema` tag, it allows defining expectations
that are automatically compiled into Ajv validation functions.

## Example

```yaml
output: !json-schema
  type: object
  properties:
    name: { type: string }
```

## Extends

- `YamlTypeBaseObject`

## Indexable

\[`name`: `string`\]: `any`

## Constructors

### Constructor

> **new YamlTypeJsonSchema**(`options?`): `YamlTypeJsonSchema`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:101](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L101)

Initializes a new YamlTypeJsonSchema instance and compiles the schema using Ajv.

#### Parameters

##### options?

`any`

The raw JSON Schema definition properties.

#### Returns

`YamlTypeJsonSchema`

#### Overrides

`YamlTypeBaseObject.constructor`

## Properties

### \[ValidateSymbol\]

> **\[ValidateSymbol\]**: `ValidateFunction`\<`any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:38](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L38)

**`Internal`**

Compiled Ajv validation function.

***

### YAMLTag

> `static` **YAMLTag**: `string` = `'!json-schema'`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:35](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L35)

The standard YAML tag name for this type.

## Methods

### getErrors()

> **getErrors**(): `ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:140](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L140)

Returns AJV validation errors for the last `validate()` call on this instance.

#### Returns

`ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

An array of Ajv error objects or null if no validation has occurred or passed.

***

### toJSON()

> **toJSON**(): `object`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:117](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L117)

Converts the instance to a plain JSON object suitable for Ajv compilation.
Filters out internal properties (starting with '_') inherited from YamlTypeBaseObject.

#### Returns

`object`

A plain JSON representation of the schema.

***

### validate()

> **validate**(`data`): `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:131](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L131)

Validates data against this specific schema instance.

#### Parameters

##### data

`any`

The data to validate.

#### Returns

`boolean`

True if the data is valid.

***

### create()

> `static` **create**(`schema?`): `YamlTypeJsonSchema`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:65](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L65)

Ensures a value is a YamlTypeJsonSchema instance.
If the input is already an instance, it's returned as-is;
otherwise, a new instance is created from the provided schema object.

#### Parameters

##### schema?

`any`

A raw schema object or an existing YamlTypeJsonSchema instance.

#### Returns

`YamlTypeJsonSchema`

A YamlTypeJsonSchema instance.

***

### getErrors()

> `static` **getErrors**(`schema`): `ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:92](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L92)

Static helper to retrieve AJV validation errors from a schema instance.

#### Parameters

##### schema

`YamlTypeJsonSchema`

The schema instance to get errors from.

#### Returns

`ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

An array of AJV error objects, or undefined if no errors exist.

***

### isInstance()

> `static` **isInstance**(`obj`): `obj is YamlTypeJsonSchema`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:48](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L48)

Type guard to check if an object is an instance of YamlTypeJsonSchema.
Handles cases where the object might come from a different module instance
by checking the constructor's static YAMLTag.

#### Parameters

##### obj

`any`

The object to check.

#### Returns

`obj is YamlTypeJsonSchema`

True if the object is a YamlTypeJsonSchema.

***

### validate()

> `static` **validate**(`schema`, `data`): `any`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:79](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/yaml-types/json-schema.ts#L79)

Static helper to validate data against a schema.

#### Parameters

##### schema

`any`

The schema to use (will be converted via `.create()` if needed).

##### data

`any`

The data to validate.

#### Returns

`any`

True if the data is valid according to the schema.
