[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / formatTemplate

# Function: formatTemplate()

> **formatTemplate**(`value`, `options`): `Promise`\<`any`\>

Defined in: [ai-tools/packages/ai-test-runner/src/validate/template.ts:12](https://github.com/isdk/ai-test-runner.js/blob/8981666864a0ecd1b4b3ecafad53b31be4126a40/src/validate/template.ts#L12)

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
