[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / formatObject

# Function: formatObject()

> **formatObject**(`input`, `options`): `Promise`\<`any`\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/validate/template.ts:54](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/validate/template.ts#L54)

Recursively formats an object or array by applying prompt templates to string and RegExp values.
Also handles template resolution for object keys.

## Parameters

### input

`any`

The object or array to format.

### options

`StringTemplateOptions`

Template formatting options.

## Returns

`Promise`\<`any`\>

A new structure with all templates resolved.
