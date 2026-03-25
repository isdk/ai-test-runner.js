[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / ValidationResult

# Type Alias: ValidationResult

> **ValidationResult** = `boolean` \| `string` \| `number` \| \{\[`key`: `string`\]: `any`; `dimension?`: `string`; `message?`: `string`; `pass?`: `boolean`; `score`: `number`; \}

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:176](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/types.ts#L176)

The result returned by a validation operator or function.
- `boolean`: true -> pass (100%), false -> fail (0%).
- `string`: fail (0%) with message.
- `number`: pass with confidence score (0-1).
- `object`: detailed result with score and optional message.

## Type Declaration

`boolean`

`string`

`number`

\{\[`key`: `string`\]: `any`; `dimension?`: `string`; `message?`: `string`; `pass?`: `boolean`; `score`: `number`; \}

## Index Signature

\[`key`: `string`\]: `any`

Additional metadata.

### dimension?

> `optional` **dimension**: `string`

The dimension/tag this score belongs to.

### message?

> `optional` **message**: `string`

Optional failure message.

### pass?

> `optional` **pass**: `boolean`

Whether the validation is considered passed. Default depends on threshold.

### score

> **score**: `number`

The confidence score (0.0 - 1.0).
