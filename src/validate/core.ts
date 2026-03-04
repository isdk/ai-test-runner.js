import { isRegExp, toRegExp } from '@isdk/ai-tool'
import { get as getByPath, has as hasByPath, cloneDeep } from 'lodash-es'
import { AIValidationFailure } from '../types.js'
import {
  MatchValueOptions,
  ValidationContext,
  MatchResult,
  MatchResultDetail,
} from './types.js'
import {
  isStrict,
  processValidationResult,
  patchMatchResult,
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
const metaKeys = ['score', 'critical', 'title', 'description', 'dimension']

/**
 * Validates that an actual value matches an expected value.
 * This is the public entry point that returns MatchResult (Pure).
 */
export async function validate(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<MatchResult> {
  const { input, data } = ctx

  if (typeof actual === 'string') {
    actual = actual.trim()
  }

  // Template formatting
  let vType = typeof expected
  if (vType === 'string') {
    expected = await formatTemplate(expected, {
      data,
      input,
      templateFormat: data?.templateFormat,
    })
    vType = typeof expected
  }

  // 1. Operator Handling (Wraps other logic)
  if (
    vType === 'object' &&
    expected !== null &&
    !(expected instanceof RegExp) &&
    !(expected instanceof YamlTypeJsonSchema)
  ) {
    const keys = Object.keys(expected)
    let operator: string | undefined
    let operatorHandler: any

    // Detect operator
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
      // Check if it's a pure operator usage (no other data properties)
      // or special case $expect
      if (
        keys.length === 1 ||
        operator === '$expect' ||
        otherKeys.length === 0
      ) {
        return validateOperator(actual, expected, operator, operatorHandler, ctx)
      }
    }
  }

  // 2. Type-specific Dispatch
  if (isRegExp(expected)) {
    return validateRegExp(actual, expected, ctx)
  } else if (vType === 'string') {
    return validateString(actual, expected, ctx)
  } else if (Array.isArray(expected)) {
    return validateArray(actual, expected, ctx)
  } else if (vType === 'function') {
    return validateFunction(actual, expected, ctx)
  } else if (
    expected instanceof YamlTypeJsonSchema ||
    (!ctx.disableHeuristicSchema && isJsonSchema(expected))
  ) {
    return validateSchema(actual, expected, ctx)
  } else if (vType === 'object') {
    return validateObject(actual, expected, ctx)
  } else {
    return validatePrimitive(actual, expected, ctx)
  }
}

/**
 * Legacy wrapper for backward compatibility.
 * @deprecated Use validate() instead. validate() is a pure function that returns a MatchResult.
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

  const result = await validate(actual, expected, ctx)

  if (!(options instanceof ValidationContext) && Array.isArray((options as any).failures)) {
    (options as any).failures.push(...result.failures)
  }

  return result.failures
}

/**
 * Internal helper to extract weight and critical flag from a node.
 */
function getScoreConfig(item: any): {
  weight: number
  critical: boolean
  strategy?: string
  threshold?: number
  title?: string
  dimension?: string
} {
  let weight = 1
  let critical = false
  let strategy: string | undefined
  let threshold: number | undefined
  let title: string | undefined
  let dimension: string | undefined

  if (item && typeof item === 'object') {
    title = item.title
    dimension = item.dimension
    if (item.score !== undefined) {
      const s = item.score
      if (typeof s === 'number') {
        weight = s
      } else if (typeof s === 'object' && s !== null) {
        weight = s.value ?? 1
        critical = !!s.critical
        strategy = s.strategy
        threshold = s.threshold
        if (s.title) title = s.title
        if (s.dimension) dimension = s.dimension
      }
    }
    if (item.critical !== undefined) {
      critical = !!item.critical
    }
  }

  return { weight, critical, strategy, threshold, title, dimension }
}

async function validateOperator(
  actual: any,
  expected: any,
  operator: string,
  operatorHandler: any,
  ctx: ValidationContext
): Promise<MatchResult> {
  const scoreCfg = getScoreConfig(expected)
  const isCritical = scoreCfg.critical

  /**
   * 【算子路径透明度保留逻辑】
   * $and 和 $or 必须是透明的（不增加路径层级）。
   * 这是为了避免路径出现 output.$and[0].$or 这种冗余（预期应为 output.$and[0]）。
   * 具体的索引（如 $and[0]）由算子 Handler 内部显式添加。
   */
  const transparentOperators = [
    '$expect',
    '$or',
    '$and',
    '$not',
    '$any',
    '$schema',
    '$exists',
    '$diff',
  ]
  const isTransparent = transparentOperators.includes(operator)

  const opCtx = ctx.createSubContext(isTransparent ? '' : operator, {
    isCriticalBranch: ctx.isCriticalBranch || isCritical,
    threshold: scoreCfg.threshold ?? ctx.threshold,
  })

  let val = expected[operator]
  val = await formatObject(cloneDeep(val), { data: ctx.data, input: ctx.input })

  const needsArray =
    operatorHandler.expects === 'array' ||
    (Array.isArray(operatorHandler.expects) &&
      operatorHandler.expects.includes('array'))

  if (needsArray && !Array.isArray(actual)) {
    return processValidationResult(
      {
        score: 0,
        pass: false,
        message: `Operator ${operator} requires an array, but got ${typeof actual}`,
      },
      val,
      actual,
      opCtx
    )
  }

  const operatorResult = await operatorHandler(
    actual,
    val,
    opCtx,
    validate
  )

  let res = processValidationResult(
    operatorResult,
    val,
    actual,
    opCtx
  )

  const title = scoreCfg.title || (operatorResult && typeof operatorResult === 'object' ? (operatorResult as any).title : undefined)
  const dimension = scoreCfg.dimension || (operatorResult && typeof operatorResult === 'object' ? (operatorResult as any).dimension : undefined)

  res = patchMatchResult(res, { title, dimension, critical: isCritical }, opCtx.key)
  return res
}

async function validateRegExp(
  actual: any,
  expected: RegExp,
  ctx: ValidationContext
): Promise<MatchResult> {
  const { data, input } = ctx
  const regEx = await formatTemplate(toRegExp(expected), {
    data,
    input,
    templateFormat: data?.templateFormat,
  })
  const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual)

  if (regEx.test(actualStr)) {
    return { score: 1, pass: true, failures: [] }
  } else {
    const regStr = regEx.toString()
    return processValidationResult(
      {
        score: 0,
        pass: false,
        message: `RegExp mismatch: expected ${regStr}, but got ${JSON.stringify(actual)}`,
      },
      regStr,
      actual,
      ctx
    )
  }
}

async function validateString(
  actual: any,
  expected: string,
  ctx: ValidationContext
): Promise<MatchResult> {
  const { input } = ctx
  const hasDiffReq = !!input?.diff
  const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual)

  if (
    !hasDiffReq &&
    typeof actual === 'string' &&
    actualStr.includes(expected.trim())
  ) {
    return { score: 1, pass: true, failures: [] }
  } else if (typeof actual === 'string') {
    return validateStringDiff(actual, expected, ctx)
  } else {
    return processValidationResult(
      {
        score: 0,
        pass: false,
        message: 'Value mismatch',
      },
      expected,
      actual,
      ctx
    )
  }
}

/**
 * Array Validation
 * 核心逻辑：为数组中的每一项分配权重并递归校验。
 */
async function validateArray(
  actual: any,
  expected: any[],
  ctx: ValidationContext
): Promise<MatchResult> {
  if (!Array.isArray(actual)) {
    return processValidationResult(
      { score: 0, pass: false, message: 'Type mismatch: expected Array' },
      expected, actual, ctx
    )
  }

  if (isStrict('array', ctx) && actual.length !== expected.length) {
    return processValidationResult(
      { score: 0, pass: false, message: `Array length mismatch (strict mode): expected ${expected.length}, actual ${actual.length}` },
      expected.length, actual.length, ctx
    )
  }

  const explicitWeights = expected.map((item) => {
    return item && typeof item === 'object' && item.score !== undefined ? item.score : null
  })
  const strategy = ctx.strategy || getStrategy('weighted')
  const weights = strategy.distribute(explicitWeights, {
    totalUnassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })

  const subResults: MatchResult[] = []
  for (let i = 0; i < expected.length; i++) {
    const scoreCfg = getScoreConfig(expected[i])
    const subCtx = ctx.createSubContext(`[${i}]`, {
      isCriticalBranch: ctx.isCriticalBranch || scoreCfg.critical
    })
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    const subResult = await validate(actual[i], expected[i], subCtx)

    /**
     * 【详情回填逻辑说明】
     * 数组校验本身是一层容器逻辑。
     * 必须将计算出的 metadata 修补回子项的详情中，否则 details 树将断层。
     */
    patchMatchResult(subResult, scoreCfg, subCtx.key)
    subResults.push(subResult)
  }

  return strategy.aggregate(subResults, weights)
}

async function validateFunction(
  actual: any,
  expected: Function,
  ctx: ValidationContext
): Promise<MatchResult> {
  const funcResult = await expected(actual, ctx.input)
  return processValidationResult(
    funcResult,
    expected,
    actual,
    ctx
  )
}

async function validateSchema(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<MatchResult> {
  if (!(expected instanceof YamlTypeJsonSchema)) {
    expected = await formatObject(cloneDeep(expected), { data: ctx.data, input: ctx.input })
  }
  return validateJsonSchema(actual, expected, ctx)
}

/**
 * Object Validation
 * 核心逻辑：为对象的每个属性分配权重并递归校验。
 */
async function validateObject(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<MatchResult> {
  if (expected === null) {
    return actual === null ? { score: 1, pass: true, failures: [] } : processValidationResult({ score: 0, pass: false, message: 'Value equality check failed' }, null, actual, ctx)
  } else if (actual === null || typeof actual !== 'object') {
     return processValidationResult({ score: 0, pass: false, message: 'Value equality check failed' }, expected, actual, ctx)
  }

  const allKeys = Object.keys(expected).filter((k) => !metaKeys.includes(k))
  const matchedActualKeys = new Set<string>()

  const explicitWeights = allKeys.map((k) => {
    const item = expected[k]
    return (item && typeof item === 'object' && item.score !== undefined) ? item.score : null
  })

  const strategy = ctx.strategy || getStrategy('weighted')
  const weights = strategy.distribute(explicitWeights, {
    totalUnassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })

  const subResults: MatchResult[] = []

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

    const scoreCfg = getScoreConfig(v)
    const subCtx = ctx.createSubContext(matchedKey || k, {
      isKeyPresent,
      isCriticalBranch: ctx.isCriticalBranch || scoreCfg.critical
    })
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    const subResult = await validate(actualValue, v, subCtx)

    /**
     * 【详情回填逻辑说明】
     * 对象属性校验是递归的核心点。
     * 这里必须保证子项的 MatchResult.details 拥有正确的元数据，否则详情树会失去路径和维度信息。
     */
    patchMatchResult(subResult, scoreCfg, subCtx.key)
    subResults.push(subResult)
  }

  // Strict mode check...
  if (isStrict('object', ctx)) {
    const actualKeys = Object.keys(actual)
    const extraFailures: MatchResult[] = []
    for (const ak of actualKeys) {
      if (!matchedActualKeys.has(ak)) {
        extraFailures.push(processValidationResult(
          { score: 0, pass: false, message: 'Extra key in actual object (strict mode)' },
          undefined, actual[ak], ctx.createSubContext(ak)
        ))
      }
    }
    if (extraFailures.length > 0) {
        const aggregated = strategy.aggregate(subResults, weights)
        return {
           ...aggregated,
           pass: false,
           failures: [...aggregated.failures, ...extraFailures.flatMap(f => f.failures)]
        }
    }
  }

  return strategy.aggregate(subResults, weights)
}

async function validatePrimitive(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<MatchResult> {
  if (actual === expected) {
    return { score: 1, pass: true, failures: [] }
  } else {
    return processValidationResult({ score: 0, pass: false }, expected, actual, ctx)
  }
}
