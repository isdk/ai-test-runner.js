[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / ValidationResult

# Type Alias: ValidationResult

> **ValidationResult** = `boolean` \| `string` \| `number` \| \{\[`key`: `string`\]: `any`; `dimension?`: `string`; `message?`: `string`; `pass?`: `boolean`; `score`: `number`; \}

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:178](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L178)

The result returned by a validation operator or function.
- `boolean`: true -> pass (100%), false -> fail (0%).
- `string`: fail (0%) with message.
- `number`: pass with confidence score (0-1).
- `object`: detailed result with score and optional message.

## Union Members

`boolean`

***

`string`

***

`number`

***

### Type Literal

\{\[`key`: `string`\]: `any`; `dimension?`: `string`; `message?`: `string`; `pass?`: `boolean`; `score`: `number`; \}

### Index Signature

\[`key`: `string`\]: `any`

Additional metadata.

#### dimension?

> `optional` **dimension?**: `string`

The dimension/tag this score belongs to.

#### message?

> `optional` **message?**: `string`

Optional failure message.

#### pass?

> `optional` **pass?**: `boolean`

Whether the validation is considered passed. Default depends on threshold.

#### score

> **score**: `number`

The confidence score (0.0 - 1.0).
