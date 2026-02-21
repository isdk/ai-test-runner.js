import { isRegExp, toRegExp } from '@isdk/ai-tool'
import { get as getByPath, has as hasByPath, cloneDeep } from 'lodash-es'
import { AIValidationFailure } from '../types.js'
import {
  MatchValueOptions,
  ValidationContext,
  ValidateMatchFn,
} from './types.js'
import {
  isStrict,
  calculateNormalizedWeights,
  processValidationResult,
} from './utils.js'
import { formatTemplate, formatObject } from './template.js'
import { isJsonSchema, validateJsonSchema } from './schema.js'
import { OPERATORS } from './operators.js'
import { validateStringDiff } from './diff.js'
import { YamlTypeJsonSchema } from '../yaml-types/index.js'
import { getStrategy } from './strategies.js'

/**
 * Metadata keys that are treated as scoring/documentation parameters.
 */
const metaKeys = ['score', 'critical', 'title', 'description']

/**
 * Validates that an actual value matches an expected value.
 */
export async function validateMatch(
  actual: any,
  expected: any,
  options: MatchValueOptions | ValidationContext = {}
): Promise<AIValidationFailure[]> {
  const ctx =
    options instanceof ValidationContext
      ? options
      : new ValidationContext(options)
  await _validateMatch(actual, expected, ctx)
  return ctx.failures
}

/**
 * Internal helper to extract weight and critical flag from a node.
 */
function getScoreConfig(item: any): {
  weight: number
  critical: boolean
  strategy?: string
  threshold?: number
} {
  let weight = 1
  let critical = false
  let strategy: string | undefined
  let threshold: number | undefined

  if (item && typeof item === 'object' && item.score !== undefined) {
    const s = item.score
    if (typeof s === 'number') {
      weight = s
    } else if (typeof s === 'object' && s !== null) {
      weight = s.value ?? 1
      critical = !!s.critical
      strategy = s.strategy
      threshold = s.threshold
    }
  }

  return { weight, critical, strategy, threshold }
}

/**
 * Internal recursive validation implementation.
 */
async function _validateMatch(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<AIValidationFailure[]> {
  const { input, data } = ctx
  const initialFailureCount = ctx.failures.length

  if (typeof actual === 'string') {
    actual = actual.trim()
  }

  let vType = typeof expected
  if (vType === 'string') {
    expected = await formatTemplate(expected, {
      data,
      input,
      templateFormat: data?.templateFormat,
    })
    vType = typeof expected
  }

  // 1. Scoring Wrapper & Operator Detection
  if (
    vType === 'object' &&
    expected !== null &&
    !(expected instanceof RegExp) &&
    !(expected instanceof YamlTypeJsonSchema)
  ) {
    const keys = Object.keys(expected)
    let operator: string | undefined
    let operatorHandler: any

    // Detect operator based on override settings
    if (ctx.allowOperatorOverride) {
      operator = keys.find((k) => ctx.operators?.[k] || OPERATORS[k])
      operatorHandler = ctx.operators?.[operator!] || OPERATORS[operator!]
    } else {
      operator = keys.find((k) => OPERATORS[k])
      if (operator) {
        operatorHandler = OPERATORS[operator]
      } else {
        operator = keys.find((k) => ctx.operators?.[k])
        operatorHandler = ctx.operators?.[operator!]
      }
    }

    if (operator) {
      const otherKeys = keys.filter(
        (k) => k !== operator && !metaKeys.includes(k)
      )
      if (
        keys.length === 1 ||
        operator === '$expect' ||
        otherKeys.length === 0
      ) {
        const scoreCfg = getScoreConfig(expected)
        const isCritical = scoreCfg.critical

        const opCtx = ctx.createSubContext('', {
          isCriticalBranch: ctx.isCriticalBranch || isCritical,
        })

        let val = expected[operator]
        const isBuiltIn =
          !!OPERATORS[operator] && operatorHandler === OPERATORS[operator]
        val = await formatObject(cloneDeep(val), { data, input })

        const needsArray =
          operatorHandler.expects === 'array' ||
          (Array.isArray(operatorHandler.expects) &&
            operatorHandler.expects.includes('array'))
        if (needsArray && !Array.isArray(actual)) {
          opCtx.addFailure({
            message: `Operator ${operator} requires an array, but got ${typeof actual}`,
            expected: val,
            actual,
          })
        } else {
          await operatorHandler(actual, val, opCtx, _validateMatch)
        }

        ctx.earnedScore += opCtx.earnedScore
        if (
          ctx.scoring &&
          opCtx.earnedScore === 0 &&
          opCtx.failures.length === initialFailureCount
        ) {
          ctx.earnedScore = ctx.allocatedScore
        }
        return ctx.failures
      }
    }
  }

  // 2. Normal validation logic
  if (isRegExp(expected)) {
    const regEx = await formatTemplate(toRegExp(expected), {
      data,
      input,
      templateFormat: data?.templateFormat,
    })
    const actualStr =
      typeof actual === 'string' ? actual : JSON.stringify(actual)
    if (regEx.test(actualStr)) {
      ctx.earnedScore = ctx.allocatedScore
    } else {
      const regStr = regEx.toString()
      ctx.addFailure({
        message: `RegExp mismatch: expected ${regStr}, but got ${JSON.stringify(actual)}`,
        expected: regStr,
        actual,
      })
    }
  } else if (vType === 'string') {
    const hasDiffReq = !!input?.diff
    const actualStr =
      typeof actual === 'string' ? actual : JSON.stringify(actual)

    if (
      !hasDiffReq &&
      typeof actual === 'string' &&
      actualStr.includes(expected.trim())
    ) {
      ctx.earnedScore = ctx.allocatedScore
    } else if (typeof actual === 'string') {
      const failuresBefore = ctx.failures.length
      const earnedBefore = ctx.earnedScore

      await validateStringDiff(actual, expected, ctx)

      if (
        !hasDiffReq &&
        ctx.failures.length === failuresBefore &&
        ctx.earnedScore === earnedBefore
      ) {
        ctx.earnedScore = ctx.allocatedScore
      }
    } else {
      ctx.addFailure({ message: 'Value mismatch', expected, actual })
    }
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      ctx.addFailure({
        message: 'Type mismatch: expected Array',
        expected,
        actual,
      })
    } else {
      if (isStrict('array', ctx) && actual.length !== expected.length) {
        ctx.addFailure({
          message: `Array length mismatch (strict mode): expected ${expected.length}, actual ${actual.length}`,
          expected: expected.length,
          actual: actual.length,
        })
      }

      const explicitWeights = expected.map((item) => {
        if (item && typeof item === 'object' && item.score !== undefined) {
          return item.score
        }
        return null
      })
      const strategy = ctx.strategy || getStrategy('weighted')
      const weights = strategy.distribute(explicitWeights, expected.length, {
        unassignedWeight: ctx.unassignedWeight,
        maxScore: ctx.maxScore,
      })

      const subContexts: ValidationContext[] = []
      for (let i = 0; i < expected.length; i++) {
        const subCtx = ctx.createSubContext(`[${i}]`)
        subCtx.allocatedScore = weights[i] * ctx.allocatedScore
        await _validateMatch(actual[i], expected[i], subCtx)
        subContexts.push(subCtx)
      }
      strategy.aggregate(ctx, subContexts)
    }
  } else if (vType === 'function') {
    const result = await expected(actual, input)
    processValidationResult(result, expected, actual, ctx)
  } else if (
    expected instanceof YamlTypeJsonSchema ||
    (!ctx.disableHeuristicSchema && isJsonSchema(expected))
  ) {
    if (!(expected instanceof YamlTypeJsonSchema)) {
      expected = await formatObject(cloneDeep(expected), { data, input })
    }
    const failuresBefore = ctx.failures.length
    await validateJsonSchema(actual, expected, ctx)
    if (ctx.failures.length === failuresBefore) {
      ctx.earnedScore = ctx.allocatedScore
    }
  } else if (vType === 'object') {
    if (expected === null) {
      if (actual === null) ctx.earnedScore = ctx.allocatedScore
      else
        ctx.addFailure({
          message: 'Value equality check failed',
          expected: null,
          actual,
        })
    } else if (actual === null || typeof actual !== 'object') {
      ctx.addFailure({
        message: 'Value equality check failed',
        expected,
        actual,
      })
    } else {
      const allKeys = Object.keys(expected).filter((k) => !metaKeys.includes(k))
      const matchedActualKeys = new Set<string>()

      const explicitWeights = allKeys.map((k) => {
        const item = expected[k]
        if (item && typeof item === 'object' && item.score !== undefined) {
          return item.score
        }
        return null
      })

      const strategy = ctx.strategy || getStrategy('weighted')
      const weights = strategy.distribute(explicitWeights, allKeys.length, {
        unassignedWeight: ctx.unassignedWeight,
        maxScore: ctx.maxScore,
      })
      const subContexts: ValidationContext[] = []

      for (let i = 0; i < allKeys.length; i++) {
        const k = allKeys[i]
        const v = expected[k]
        let actualValue: any
        let matchedKey: string | undefined
        let isKeyPresent = false

        if (k.startsWith('/') && k.endsWith('/')) {
          const reg = new RegExp(k.slice(1, -1))
          matchedKey = Object.keys(actual).find((ak) => reg.test(ak))
          if (matchedKey) {
            actualValue = actual[matchedKey]
            matchedActualKeys.add(matchedKey)
            isKeyPresent = true
          }
        } else {
          actualValue = getByPath(actual, k)
          isKeyPresent = hasByPath(actual, k)
          if (isKeyPresent || actualValue !== undefined) {
            matchedKey = k
            matchedActualKeys.add(k.split('.')[0].split('[')[0])
          }
        }

        const subCtx = ctx.createSubContext(matchedKey || k, { isKeyPresent })
        subCtx.allocatedScore = weights[i] * ctx.allocatedScore
        await _validateMatch(actualValue, v, subCtx)
        subContexts.push(subCtx)
      }
      strategy.aggregate(ctx, subContexts)

      if (isStrict('object', ctx)) {
        const actualKeys = Object.keys(actual)
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
    }
  } else {
    if (actual === expected) {
      ctx.earnedScore = ctx.allocatedScore
    } else {
      ctx.addFailure({
        message: 'Value equality check failed',
        expected,
        actual,
      })
    }
  }

  return ctx.failures
}
