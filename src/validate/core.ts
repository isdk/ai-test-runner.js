import { isRegExp, toRegExp } from '@isdk/ai-tool'
import { get as getByPath, cloneDeep } from 'lodash-es'
import { AIValidationFailure } from '../types.js'
import { MatchValueOptions, ValidationContext } from './types.js'
import { isStrict } from './utils.js'
import { formatTemplate, formatObject } from './template.js'
import { isJsonSchema, validateJsonSchema } from './schema.js'
import { OPERATORS } from './operators.js'
import { validateStringDiff } from './diff.js'
import { YamlTypeJsonSchema } from '../yaml-types/index.js'

/**
 * Validates that an actual value matches an expected value.
 * Supports various matching logic: equality, RegExp, Array comparison,
 * custom functions, collection operators ($all, $contains, etc.), and JSON Schema.
 *
 * @param actual - The actual value produced by the AI or system under test.
 * @param expected - The expected value, RegExp, schema, or matcher function.
 * @param options - Validation options or an existing ValidationContext.
 * @returns A promise that resolves to an array of validation failures (empty if passed).
 */
export async function validateMatch(
  actual: any,
  expected: any,
  options: MatchValueOptions | ValidationContext = {}
): Promise<AIValidationFailure[]> {
  const ctx = options instanceof ValidationContext ? options : new ValidationContext(options)
  return _validateMatch(actual, expected, ctx)
}

/**
 * Internal recursive validation implementation.
 *
 * @param actual - Actual value.
 * @param expected - Expected value or pattern.
 * @param ctx - Current validation context.
 * @returns Failures discovered in this branch.
 */
async function _validateMatch(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<AIValidationFailure[]> {
  const { input, data } = ctx
  const vType = typeof expected

  if (typeof actual === 'string') {
    actual = actual.trim()
  }
  if (vType === 'string') {
    expected = await formatTemplate(expected, {
      data,
      input,
      templateFormat: data?.templateFormat,
    })
  }

  if (isRegExp(expected)) {
    const regEx = await formatTemplate(toRegExp(expected), {
      data,
      input,
      templateFormat: data?.templateFormat,
    })
    if (!regEx.test(actual)) {
      const regStr = regEx.toString()
      ctx.addFailure({
        message: `RegExp mismatch: expected ${regStr}, but got ${JSON.stringify(actual)}`,
        expected: regStr,
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
        await validateStringDiff(actual, expected, ctx)
      } else {
        ctx.addFailure({
          message: 'Value mismatch',
          expected,
          actual,
        })
      }
    }
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      ctx.addFailure({
        message: 'Type mismatch: expected Array',
        expected,
        actual,
      })
    } else {
      if (
        isStrict('array', ctx) &&
        actual.length !== expected.length
      ) {
        ctx.addFailure({
          message: `Array length mismatch (strict mode): expected ${expected.length}, actual ${actual.length}`,
          expected: expected.length,
          actual: actual.length,
        })
      }
      for (let i = 0; i < expected.length; i++) {
        const vItem = expected[i]
        const actualItem = actual[i]
        const subCtx = ctx.createSubContext(`[${i}]`)
        await _validateMatch(actualItem, vItem, subCtx)
      }
    }
  } else if (vType === 'function') {
    const result = await expected(actual, input)
    const expectedName = expected.name ? expected.name + '()'  : expected.toString()
    if (result !== true) {
      ctx.addFailure({
        message: `Custom function validation failed: ${result}`,
        expected: expectedName,
        actual,
      })
    }
  } else if (expected instanceof YamlTypeJsonSchema || (!ctx.disableHeuristicSchema && isJsonSchema(expected))) {
    if (!(expected instanceof YamlTypeJsonSchema)) {
      expected = await formatObject(cloneDeep(expected), { data, input })
    }
    await validateJsonSchema(actual, expected, ctx)
  } else if (vType === 'object') {
    if (expected === null) {
      if (actual !== null) {
        ctx.addFailure({
          message: 'Value equality check failed',
          expected: null,
          actual,
        })
      }
      return ctx.failures
    }

    const keys = Object.keys(expected)
    const operator = keys.find((k) => OPERATORS[k])
    if (operator && keys.length === 1) {
      const val = expected[operator]
      const needsArray = !['$not', '$schema'].includes(operator)
      if (needsArray && !Array.isArray(actual)) {
        ctx.addFailure({
          message: `Operator ${operator} requires an array, but got ${typeof actual}`,
          expected: val,
          actual,
        })
      } else {
        await OPERATORS[operator](actual, val, ctx, _validateMatch)
      }
      return ctx.failures
    }

    if (actual === null || typeof actual !== 'object') {
      ctx.addFailure({
        message: 'Value equality check failed',
        expected,
        actual,
      })
      return ctx.failures
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
        if (actual && typeof actual === 'object' && (k in actual || actualValue !== undefined)) {
          matchedKey = k
          matchedActualKeys.add(k.split('.')[0].split('[')[0])
        }
      }

      const subCtx = ctx.createSubContext(matchedKey || k)
      await _validateMatch(actualValue, v, subCtx)
    }

    if (isStrict('object', ctx)) {
      const actualKeys = actual && typeof actual === 'object' ? Object.keys(actual) : []
      for (const ak of actualKeys) {
        if (!matchedActualKeys.has(ak)) {
          const subCtx = ctx.createSubContext(ak)
          subCtx.addFailure({
            message: 'Extra key in actual object (strict mode)',
            actual: actual[ak],
          })
        }
      }
    }
  } else {
    if (actual !== expected) {
      ctx.addFailure({
        message: 'Value equality check failed',
        expected,
        actual,
      })
    }
  }
  return ctx.failures
}
