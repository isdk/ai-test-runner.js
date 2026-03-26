[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIStrictOption

# Type Alias: AIStrictOption

> **AIStrictOption** = `boolean` \| `string` \| `string`[]

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:357](https://github.com/isdk/ai-test-runner.js/blob/26beed9596be872b157e2e95587682721c3a51f4/src/types.ts#L357)

Configuration for strict validation mode.

- `true`: Enable strict mode for all types.
- `false`: Disable strict mode (partial matching).
- `'object' | 'diff' | 'array'`: Enable strict mode only for the specified type.
- `string[]`: Array of types to enable strict mode for.
