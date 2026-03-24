[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIStrictOption

# Type Alias: AIStrictOption

> **AIStrictOption** = `boolean` \| `string` \| `string`[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:357](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/types.ts#L357)

Configuration for strict validation mode.

- `true`: Enable strict mode for all types.
- `false`: Disable strict mode (partial matching).
- `'object' | 'diff' | 'array'`: Enable strict mode only for the specified type.
- `string[]`: Array of types to enable strict mode for.
