[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / formatTemplate

# Function: formatTemplate()

> **formatTemplate**(`value`, `options`): `Promise`\<`any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/template.ts:12](https://github.com/isdk/ai-test-runner.js/blob/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0/src/validate/template.ts#L12)

Formats a single value (string or RegExp) using prompt templates.
It merges context data and input parameters to resolve template placeholders.

## Parameters

### value

`any`

The value containing templates (e.g., "Hello {{name}}").

### options

`StringTemplateOptions`

Template formatting options including data and input.

## Returns

`Promise`\<`any`\>

The formatted string or RegExp with placeholders replaced.
