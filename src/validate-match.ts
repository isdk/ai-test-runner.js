import {
  getKeysPath,
  isRegExp,
  PromptTemplate,
  PromptTemplateOptions,
  toRegExp,
} from '@isdk/ai-tool'
import { get as getByPath, set as setByPath, omit } from 'lodash-es'
import { diffChars, Change } from 'diff'

import { YamlTypeJsonSchema } from './yaml-types/index.js'
import { AIDiffItem, AIValidationFailure, AIStrictOption } from './types.js'

/**
 * Options for matching and validating values.
 */
export interface MatchValueOptions {
  /** Accumulator for validation failures. */
  failures?: AIValidationFailure[]
  /** The current key or path being validated. */
  key?: string
  /** Data context for template formatting. */
  data?: Record<string, any>
  /** The test fixture input/configuration. */
  input?: any
  /** Strict validation mode configuration. */
  strict?: AIStrictOption
}

/**
 * Checks if strict mode is enabled for a specific type.
 *
 * @param type - The type to check ('object', 'diff', or 'array').
 * @param strict - The strict option configuration.
 * @returns True if strict mode is enabled for the given type.
 */
export function isStrict(
  type: 'object' | 'diff' | 'array',
  strict?: AIStrictOption
): boolean {
  if (typeof strict === 'boolean') return strict
  if (typeof strict === 'string') return strict === type
  if (Array.isArray(strict)) return strict.includes(type)
  return false
}

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

/**
 * Validates that an actual value matches an expected value.
 * Supports various matching logic: equality, RegExp, Array comparison,
 * custom functions, and JSON Schema.
 *
 * @param actual - The actual value produced.
 * @param expected - The expected value or matcher.
 * @param options - Validation options.
 * @returns A promise that resolves to an array of validation failures.
 */
export async function validateMatch(
  actual: any,
  expected: any,
  options: MatchValueOptions = {}
): Promise<AIValidationFailure[]> {
  const data = options.data
  const failures = options.failures || []
  const key = options.key || ''
  const input = options.input
  const vType = typeof expected

  if (typeof actual === 'string') {
    actual = actual.trim()
  }
  if (vType === 'string') {
    expected = await formatTemplate(expected, {
      ...options,
      templateFormat: data?.templateFormat,
    })
  }

  if (isRegExp(expected)) {
    const regEx = await formatTemplate(toRegExp(expected), {
      ...options,
      templateFormat: data?.templateFormat,
    })
    if (!regEx.test(actual)) {
      failures.push({
        key,
        message: 'RegExp mismatch',
        expected: regEx.source,
        actual,
      })
    }
  } else if (vType === 'string') {
    const hasDiffReq = !!input?.diff
    if (
      typeof actual !== 'string' ||
      (!hasDiffReq && !actual.includes(expected.trim())) ||
      hasDiffReq
    ) {
      if (typeof actual === 'string') {
        let diff: AIDiffItem[] | undefined = diffChars(expected, actual)
        const expectedDiff = input?.diff
        if (Array.isArray(expectedDiff)) {
          await formatDiffList(expectedDiff, options)

          // Track which expected items were matched
          const matchedExpectedIndices = new Set<number>()

          const successfulItems = diff.filter((d) => {
            let matchedIdx = -1
            const matched = expectedDiff.some((ed, idx) => {
              const m = findDiffItem([ed], d, options)
              if (m) {
                matchedIdx = idx
                return true
              }
              return false
            })
            if (matched) {
              matchedExpectedIndices.add(matchedIdx)
            }
            return matched
          })

          const strictDiff = isStrict('diff', options.strict)
          const allExpectedMatched =
            matchedExpectedIndices.size === expectedDiff.length
          const allActualVerified =
            successfulItems.length === diff.length ||
            diff.every(
              (d) =>
                d.verified ||
                !(d.added || d.removed) ||
                successfulItems.includes(d)
            )

          let failed = !allExpectedMatched
          if (!failed && strictDiff) {
            // In strict mode, any unverified change leads to failure
            const hasUnverified = diff.some(
              (d) => (d.added || d.removed) && !successfulItems.includes(d)
            )
            if (hasUnverified) failed = true
          }

          if (failed) {
            const failure: AIValidationFailure = {
              key,

              message: !allExpectedMatched
                ? 'Not all expected diff items were found'
                : 'Unverified changes in strict diff mode',

              expected,

              actual,

              diff,
            }

            failures.push(failure)

            diff = undefined // Prevent duplicate "String mismatch with diff" error
          } else {
            diff = undefined // Pass
          }
        } else if (typeof expectedDiff === 'function') {
          const successfulItems = await expectedDiff(actual, input, diff)
          if (successfulItems.length < diff.length) {
            successfulItems.forEach((d: any) => {
              d.verified = true
            })
            const failedCount = diff.filter(
              (d) => !d.verified && (d.added || d.removed)
            ).length
            if (failedCount === 0) {
              diff = undefined
            }
          } else {
            diff = undefined
          }
        }
        if (diff && diff.length) {
          failures.push({
            key,
            message: 'String mismatch with diff',
            expected,
            actual,
            diff,
          })
        }
      } else {
        failures.push({
          key,
          message: 'Value mismatch',
          expected,
          actual,
        })
      }
    }
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      failures.push({
        key,
        message: 'Type mismatch: expected Array',
        expected,
        actual,
      })
    } else {
      if (
        isStrict('array', options.strict) &&
        actual.length !== expected.length
      ) {
        failures.push({
          key,
          message: `Array length mismatch (strict mode): expected ${expected.length}, actual ${actual.length}`,
          expected: expected.length,
          actual: actual.length,
        })
      }
      for (let i = 0; i < expected.length; i++) {
        const vItem = expected[i]
        const actualItem = actual[i]
        await validateMatch(actualItem, vItem, {
          failures,
          key: key + '[' + i + ']',
          data,
          strict: options.strict,
        })
      }
    }
  } else if (vType === 'function') {
    const result = await expected(actual, input)
    const expectedName = expected.name ? expected.name + '()'  : expected.toString()
    if (result !== true) {
      failures.push({
        key,
        message: `Custom function validation failed: ${result}`,
        expected: expectedName,
        actual,
      })
    }
  } else if (expected instanceof YamlTypeJsonSchema) {
    const valid = YamlTypeJsonSchema.validate(expected, actual)
    if (!valid) {
      const errors = YamlTypeJsonSchema.getErrors(expected)!
      failures.push({
        key,
        message: 'JSON Schema validation failed',
        expected: errors, // Use expected field to store detailed schema errors
        actual,
      })
    }
  } else if (vType === 'object') {
    if (expected === null) {
      if (actual !== null) {
        failures.push({
          key,
          message: 'Value equality check failed',
          expected: null,
          actual,
        })
      }
      return failures
    }
    const keys = Object.keys(expected)
    if (expected.type && keys.every(k => !['$contains', '$all', '$sequence'].includes(k))) {
      // It looks like a JSON Schema
      const schema = YamlTypeJsonSchema.create(expected)
      const valid = YamlTypeJsonSchema.validate(schema, actual)
      if (!valid) {
        const errors = YamlTypeJsonSchema.getErrors(schema)!
        failures.push({
          key,
          message: 'JSON Schema validation failed',
          expected: errors,
          actual,
        })
      }
      return failures
    }

    const operator = keys.find((k) =>
      ['$contains', '$all', '$sequence', '$not'].includes(k)
    )
    if (operator && keys.length === 1) {
      const val = expected[operator]
      if (operator === '$not') {
        const subFailures = await validateMatch(actual, val, {
          ...options,
          failures: [],
        })
        if (subFailures.length === 0) {
          failures.push({
            key,
            message: '$not mismatch: value matches expectation but should not',
            expected: val,
            actual,
          })
        }
        return failures
      }

      if (!Array.isArray(actual)) {
        failures.push({
          key,
          message: `Operator ${operator} requires an array, but got ${typeof actual}`,
          expected: val,
          actual,
        })
      } else {
        if (operator === '$contains') {
          const subFailures = await validateContains(actual, val, options)
          failures.push(...subFailures)
        } else if (operator === '$all') {
          if (!Array.isArray(val)) {
            failures.push({
              key,
              message: '$all requires an array of expected items',
              expected: val,
              actual,
            })
          } else {
            const subFailures = await validateAll(actual, val, options)
            failures.push(...subFailures)
          }
        } else if (operator === '$sequence') {
          if (!Array.isArray(val)) {
            failures.push({
              key,
              message: '$sequence requires an array of expected items',
              expected: val,
              actual,
            })
          } else {
            const subFailures = await validateSequence(actual, val, options)
            failures.push(...subFailures)
          }
        }
      }
      return failures
    }

    const allKeys = Object.keys(expected)
    const matchedActualKeys = new Set<string>()

    for (const k of allKeys) {
      const v = expected[k]
      let actualValue: any
      let matchedKey: string | undefined

      if (k.startsWith('/') && k.endsWith('/')) {
        const reg = new RegExp(k.slice(1, -1))
        matchedKey = actual
          ? Object.keys(actual).find((ak) => reg.test(ak))
          : undefined
        if (matchedKey) {
          actualValue = actual[matchedKey]
          matchedActualKeys.add(matchedKey)
        }
      } else {
        actualValue = actual ? actual[k] : undefined
        if (actual && k in actual) {
          matchedActualKeys.add(k)
        }
      }

      await validateMatch(actualValue, v, {
        failures,
        key: key ? key + '.' + (matchedKey || k) : matchedKey || k,
        data,
        strict: options.strict,
      })
    }

    if (isStrict('object', options.strict)) {
      const actualKeys = actual ? Object.keys(actual) : []
      for (const ak of actualKeys) {
        if (!matchedActualKeys.has(ak)) {
          failures.push({
            key: key ? key + '.' + ak : ak,
            message: 'Extra key in actual object (strict mode)',
            actual: actual[ak],
          })
        }
      }
    }
  } else {
    if (actual !== expected) {
      failures.push({
        key,
        message: 'Value equality check failed',
        expected,
        actual,
      })
    }
  }
  return failures
}

/**
 * Formats a list of AIDiffItems by applying templates to their values.
 *
 * @param diff - The list of diff items to format.
 * @param options - Formatting options.
 * @returns The formatted list of diff items.
 */
async function formatDiffList(diff: AIDiffItem[], options: MatchValueOptions) {
  for (const d of diff) {
    const value = d.value
    if (typeof value === 'string' || isRegExp(value)) {
      d.value = await formatTemplate(value, {
        ...options,
        templateFormat: options.data?.templateFormat,
      })
    }
  }
  return diff
}

/**
 * Finds a matching diff item in a list of expected diffs.
 *
 * @param diff - The list of expected diff items.
 * @param item - The actual diff item to find.
 * @param options - Match options.
 * @returns The matched item if found, otherwise undefined.
 */
function findDiffItem(
  diff: AIDiffItem[],
  item: AIDiffItem,
  options: MatchValueOptions
) {
  let result: Change | undefined
  for (const d of diff) {
    const unchanged = !(item.added || item.removed)
    if (unchanged && (d.added === true || d.removed === true)) {
      continue
    }
    if (d.added !== undefined && d.added !== (item.added || false)) {
      continue
    }
    if (d.removed !== undefined && d.removed !== (item.removed || false)) {
      continue
    }

    result = item

    const value = d.value
    if (value != null) {
      if (isRegExp(value)) {
        const regEx = toRegExp(value)
        if (!regEx.test(item.value)) {
          result = undefined
        }
      } else if (item.value !== value) {
        result = undefined
      }
    }

    if (result) {
      break
    }
  }
  return result
}

async function validateContains(
  actual: any[],
  expected: any,
  options: MatchValueOptions
) {
  for (const item of actual) {
    const subFailures: AIValidationFailure[] = []
    await validateMatch(item, expected, {
      ...options,
      failures: subFailures,
      key: '', // Reset key for sub-matching
    })
    if (subFailures.length === 0) return [] // found a match
  }
  return [
    {
      key: options.key,
      message: '$contains mismatch: item not found in array',
      expected,
      actual,
    },
  ]
}

async function validateAll(
  actual: any[],
  expectedList: any[],
  options: MatchValueOptions
) {
  const failures: AIValidationFailure[] = []
  for (const expected of expectedList) {
    const containsFailures = await validateContains(actual, expected, options)
    if (containsFailures.length > 0) {
      failures.push(...containsFailures)
    }
  }
  return failures
}

async function validateSequence(
  actual: any[],
  expectedList: any[],
  options: MatchValueOptions
) {
  let actualIdx = 0
  for (let i = 0; i < expectedList.length; i++) {
    const expected = expectedList[i]
    let found = false
    while (actualIdx < actual.length) {
      const subFailures: AIValidationFailure[] = []
      await validateMatch(actual[actualIdx], expected, {
        ...options,
        failures: subFailures,
        key: '',
      })
      actualIdx++
      if (subFailures.length === 0) {
        found = true
        break
      }
    }
    if (!found) {
      return [
        {
          key: options.key,
          message: `$sequence mismatch: item at index ${i} not found in sequence after previous matches`,
          expected,
          actual,
        },
      ]
    }
  }
  return []
}
