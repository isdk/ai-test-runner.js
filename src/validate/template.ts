import {
  PromptTemplate,
  PromptTemplateOptions,
} from '@isdk/ai-tool'
import { omit } from 'lodash-es'

/**
 * Formats a single value (string or RegExp) using prompt templates.
 *
 * @param value - The value to format.
 * @param options - Template formatting options.
 * @returns The formatted value.
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
 * Recursively formats an object or array by applying prompt templates to string values.
 *
 * @param input - The object or array to format.
 * @param options - Template formatting options.
 * @returns The formatted object or array.
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
