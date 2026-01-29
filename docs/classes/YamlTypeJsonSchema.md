[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / YamlTypeJsonSchema

# Class: YamlTypeJsonSchema

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:19](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L19)

Represents a YAML tag for JSON Schema validation.
Used to define expectations using standard JSON Schema.

## Extends

- `YamlTypeBaseObject`

## Indexable

\[`name`: `string`\]: `any`

## Constructors

### Constructor

> **new YamlTypeJsonSchema**(`options?`): `YamlTypeJsonSchema`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:81](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L81)

Initializes a new YamlTypeJsonSchema.

#### Parameters

##### options?

`any`

Schema configuration.

#### Returns

`YamlTypeJsonSchema`

#### Overrides

`YamlTypeBaseObject.constructor`

## Properties

### \[ValidateSymbol\]

> **\[ValidateSymbol\]**: `ValidateFunction`\<`any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:22](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L22)

***

### YAMLTag

> `static` **YAMLTag**: `string` = `'!json-schema'`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:21](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L21)

The YAML tag associated with this type.

## Methods

### getErrors()

> **getErrors**(): `ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:119](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L119)

Returns validation errors for the last validation call on this instance.

#### Returns

`ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

An array of error objects or null.

***

### toJSON()

> **toJSON**(): `object`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:96](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L96)

Converts the schema to a plain JSON object, filtering out private properties.

#### Returns

`object`

The JSON representation of the schema.

***

### validate()

> **validate**(`data`): `boolean`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:110](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L110)

Validates data against this schema instance.

#### Parameters

##### data

`any`

The data to validate.

#### Returns

`boolean`

True if valid.

***

### create()

> `static` **create**(`schema?`): `YamlTypeJsonSchema`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:45](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L45)

Creates a YamlTypeJsonSchema instance from a schema object.

#### Parameters

##### schema?

`any`

The JSON Schema object.

#### Returns

`YamlTypeJsonSchema`

A YamlTypeJsonSchema instance.

***

### getErrors()

> `static` **getErrors**(`schema`): `ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:72](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L72)

Retrieves validation errors from a schema instance.

#### Parameters

##### schema

`YamlTypeJsonSchema`

The YamlTypeJsonSchema instance.

#### Returns

`ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` \| `undefined`

An array of AJV error objects, or undefined if no errors.

***

### isInstance()

> `static` **isInstance**(`obj`): `obj is YamlTypeJsonSchema`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:30](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L30)

Checks if an object is an instance of YamlTypeJsonSchema.

#### Parameters

##### obj

`any`

The object to check.

#### Returns

`obj is YamlTypeJsonSchema`

True if the object is a YamlTypeJsonSchema instance.

***

### validate()

> `static` **validate**(`schema`, `data`): `any`

Defined in: [ai-tools/packages/ai-test-runner/src/yaml-types/json-schema.ts:59](https://github.com/isdk/ai-test-runner.js/blob/c0cb346110918810799a67a72cce9eac3ac94913/src/yaml-types/json-schema.ts#L59)

Validates data against a schema.

#### Parameters

##### schema

`any`

The YamlTypeJsonSchema or schema object.

##### data

`any`

The data to validate.

#### Returns

`any`

True if the data is valid according to the schema.
