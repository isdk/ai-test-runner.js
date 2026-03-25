[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / formatTemplate

# Function: formatTemplate()

> **formatTemplate**(`value`, `options`): `Promise`\<`any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/template.ts:12](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/validate/template.ts#L12)

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
