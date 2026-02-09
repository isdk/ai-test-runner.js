import {
  PromptTemplate,
  PromptTemplateOptions,
} from '@isdk/ai-tool'
import { omit } from 'lodash-es'

/**
 * Formats a single value (string or RegExp) using prompt templates.
 * It merges context data and input parameters to resolve template placeholders.
 *
 * @param value - The value containing templates (e.g., "Hello {{name}}").
 * @param options - Template formatting options including data and input.
 * @returns The formatted string or RegExp with placeholders replaced.
 */
export async function formatTemplate(
  value: any,
  options: PromptTemplateOptions
) {
  if (options.data) {
    let vRegEx: RegExp | undefined
    if (value instanceof RegExp) {
      vRegEx = value
      value = value.source
    }
    if (typeof value === 'string') {
      const data = { ...options.data, ...options.input }
      const formatOptions = omit(options, ['data', 'input'])
      const content = await PromptTemplate.formatIf({
        template: value,
        ...formatOptions,
        data,
      })
      if (typeof content === 'string') {
        value = content
      }
    }
    if (vRegEx) {
      if (vRegEx.source !== value) {
        value = new RegExp(value, vRegEx.flags)
      } else {
        value = vRegEx
      }
    }
  }
  return value
}

/**
 * Recursively formats an object or array by applying prompt templates to string and RegExp values.
 * Also handles template resolution for object keys.
 *
 * @param input - The object or array to format.
 * @param options - Template formatting options.
 * @returns A new structure with all templates resolved.
 */
export async function formatObject(input: any, options: PromptTemplateOptions) {
  if (input && options.data) {
    const vType = typeof input
    if (Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        const vItem = input[i]
        const actualItem = await formatObject(vItem, options)
        if (actualItem !== vItem) {
          input[i] = actualItem
        }
      }
    } else if (vType === 'string' || input instanceof RegExp) {
      input = await formatTemplate(input, options)
    } else if (vType === 'object') {
      const keys = Object.keys(input)
      for (const k of keys) {
        const newK = await formatTemplate(k, options)
        const v = input[k]
        const actualValue = await formatObject(v, options)
        if (actualValue !== v || newK !== k) {
          delete input[k]
          input[newK] = actualValue
        }
      }
    }
  }
  return input
}