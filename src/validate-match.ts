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

export interface MatchValueOptions {
  failures?: AIValidationFailure[]
  key?: string
  data?: Record<string, any>
  input?: any
  strict?: AIStrictOption
}

export function isStrict(
  type: 'object' | 'diff' | 'array',
  strict?: AIStrictOption
): boolean {
  if (typeof strict === 'boolean') return strict
  if (typeof strict === 'string') return strict === type
  if (Array.isArray(strict)) return strict.includes(type)
  return false
}

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
    } else if (vType === 'function') {
      input = (
        (r) => () =>
          r
      )(input)
    } else if (vType === 'object') {
      const keys = getKeysPath(input)
      for (const k of keys) {
        const v = getByPath(input, k)
        const actualValue = await formatObject(v, options)
        if (actualValue !== v) {
          setByPath(input, k, actualValue)
        }
      }
    }
  }
  return input
}

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
    if (result !== true) {
      failures.push({
        key,
        message: `Custom function validation failed: ${result}`,
        expected: expected.toString(),
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
    const keys = getKeysPath(expected)
    for (const k of keys) {
      const v = getByPath(expected, k)
      const actualValue = getByPath(actual, k)
      await validateMatch(actualValue, v, {
        failures,
        key: key ? key + '.' + k : k,
        data,
        strict: options.strict,
      })
    }

    if (isStrict('object', options.strict)) {
      const actualKeys = getKeysPath(actual)
      for (const ak of actualKeys) {
        if (getByPath(expected, ak) === undefined) {
          failures.push({
            key: key ? key + '.' + ak : ak,
            message: 'Extra key in actual object (strict mode)',
            actual: getByPath(actual, ak),
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
