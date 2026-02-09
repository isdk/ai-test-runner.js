import { isRegExp, toRegExp } from '@isdk/ai-tool'
import { get as getByPath } from 'lodash-es'
import { AIValidationFailure } from '../types.js'
import { MatchValueOptions } from './types.js'
import { isStrict } from './utils.js'
import { formatTemplate } from './template.js'
import { isJsonSchema, validateJsonSchema } from './schema.js'
import { OPERATORS } from './operators.js'
import { validateStringDiff } from './diff.js'

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
        const diffFailures = await validateStringDiff(actual, expected, options)
        failures.push(...diffFailures)
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
  } else if (isJsonSchema(expected)) {
    const schemaFailures = await validateJsonSchema(actual, expected, options)
    failures.push(...schemaFailures)
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
    const operator = keys.find((k) => OPERATORS[k])
    if (operator && keys.length === 1) {
      const val = expected[operator]
      if (operator !== '$not' && !Array.isArray(actual)) {
        failures.push({
          key,
          message: `Operator ${operator} requires an array, but got ${typeof actual}`,
          expected: val,
          actual,
        })
      } else {
        const operatorFailures = await OPERATORS[operator](actual, val, options, validateMatch)
        failures.push(...operatorFailures)
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
        matchedKey = actual && typeof actual === 'object'
          ? Object.keys(actual).find((ak) => reg.test(ak))
          : undefined
        if (matchedKey) {
          actualValue = actual[matchedKey]
          matchedActualKeys.add(matchedKey)
        }
      } else {
        actualValue = getByPath(actual, k)
        if (actual && (k in actual || actualValue !== undefined)) {
          matchedKey = k
          matchedActualKeys.add(k.split('.')[0].split('[')[0])
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
      const actualKeys = actual && typeof actual === 'object' ? Object.keys(actual) : []
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
