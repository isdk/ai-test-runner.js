[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / formatObject

# Function: formatObject()

> **formatObject**(`input`, `options`): `Promise`\<`any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/template.ts:54](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/template.ts#L54)

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
