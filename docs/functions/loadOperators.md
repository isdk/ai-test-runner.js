[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / loadOperators

# Function: loadOperators()

> **loadOperators**(`operators`, `baseDir?`): `Promise`\<`Record`\<`string`, [`ValidationOperatorHandler`](../type-aliases/ValidationOperatorHandler.md)\>\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/loader.ts:51](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/loader.ts#L51)

Loads operators from a record of strings or handlers, or an array of strings.
Strings are treated as module paths with optional export names (e.g., "js://./utils.js#myOp").
If an array is provided, names are inferred from the paths or export names.

## Parameters

### operators

`Record`\<`string`, `string` \| [`ValidationOperatorHandler`](../type-aliases/ValidationOperatorHandler.md) \| [`CustomOperatorHandler`](../type-aliases/CustomOperatorHandler.md)\> | (`string` \| [`ValidationOperatorHandler`](../type-aliases/ValidationOperatorHandler.md) \| [`CustomOperatorHandler`](../type-aliases/CustomOperatorHandler.md))[]

### baseDir?

`string`

## Returns

`Promise`\<`Record`\<`string`, [`ValidationOperatorHandler`](../type-aliases/ValidationOperatorHandler.md)\>\>
