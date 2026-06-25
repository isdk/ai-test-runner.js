[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIStrictOption

# Type Alias: AIStrictOption

> **AIStrictOption** = `boolean` \| `string` \| `string`[]

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/types.ts:361](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/types.ts#L361)

Configuration for strict validation mode.

- `true`: Enable strict mode for all types.
- `false`: Disable strict mode (partial matching).
- `'object' | 'diff' | 'array'`: Enable strict mode only for the specified type.
- `string[]`: Array of types to enable strict mode for.
