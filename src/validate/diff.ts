import {
  diffChars,
  diffLines,
  diffWords,
  diffWordsWithSpace,
  diffSentences,
  Change,
  DiffSentencesOptionsNonabortable,
} from 'diff'
import { isRegExp, toRegExp, getKeysPath } from '@isdk/ai-tool'
import { get as getByPath, has as hasByPath, cloneDeep } from 'lodash-es'
import {
  AIDiffItem,
  AIValidationFailure,
  AIDiffOptions,
  AIDiffType,
} from '../types.js'
import { ValidationContext } from './types.js'
import { isStrict, calculateNormalizedWeights } from './utils.js'
import { formatTemplate } from './template.js'

function isJsonLike(str: string): boolean {
  const s = str.trim()
  return (
    (s.startsWith('{') && s.endsWith('}')) ||
    (s.startsWith('[') && s.endsWith(']'))
  )
}

function parseJsonSafe(str: string): any {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

/**
 * Performs a structured, path-based diff on two JSON-serializable objects.
 */
function diffJsonStructured(
  expected: any,
  actual: any,
  _options: AIDiffOptions = {}
): AIDiffItem[] {
  const expectedPaths = getKeysPath(expected)
  const actualPaths = getKeysPath(actual)

  const allPaths = Array.from(
    new Set([...expectedPaths, ...actualPaths])
  ).sort()
  const diffs: AIDiffItem[] = []

  for (const path of allPaths) {
    const eVal = getByPath(expected, path)
    const aVal = getByPath(actual, path)

    const inExpected = expectedPaths.includes(path)
    const inActual = actualPaths.includes(path)

    if (!inExpected) {
      // Added in actual
      diffs.push({
        count: 1,
        added: true,
        removed: false,
        path,
        val: aVal,
        value: `${path}: ${JSON.stringify(aVal)}`,
      })
    } else if (!inActual) {
      // Removed from expected
      diffs.push({
        count: 1,
        added: false,
        removed: true,
        path,
        val: eVal,
        value: `${path}: ${JSON.stringify(eVal)}`,
      })
    } else if (JSON.stringify(eVal) !== JSON.stringify(aVal)) {
      // Changed
      diffs.push({
        count: 1,
        added: false,
        removed: true,
        path,
        val: eVal,
        value: `${path}: ${JSON.stringify(eVal)}`,
      })
      diffs.push({
        count: 1,
        added: true,
        removed: false,
        path,
        val: aVal,
        value: `${path}: ${JSON.stringify(aVal)}`,
      })
    }
  }

  return diffs
}

/**
 * Heuristically detects the best diff strategy based on content.
 */
function detectDiffType(expected: string, actual: string): AIDiffType {
  if (isJsonLike(expected) && isJsonLike(actual)) {
    if (parseJsonSafe(expected) !== null && parseJsonSafe(actual) !== null) {
      return 'json'
    }
  }

  if (expected.includes('\n') || actual.includes('\n')) {
    return 'lines'
  }

  if (
    (expected.length >= 20 && expected.includes(' ')) ||
    (actual.length >= 20 && actual.includes(' '))
  ) {
    return 'words'
  }

  return 'chars'
}

/**
 * Gets the diff items using the specified or detected strategy.
 */
export function getDiff(
  expected: any,
  actual: any,
  options: AIDiffOptions = {}
): AIDiffItem[] {
  const originalType = options.type || 'chars'
  let type: AIDiffType = originalType

  if (type === 'auto') {
    type = detectDiffType(String(expected), String(actual))
  }

  let result: AIDiffItem[]
  switch (type) {
    case 'json': {
      const e =
        typeof expected === 'string'
          ? parseJsonSafe(expected) || expected
          : expected
      const a =
        typeof actual === 'string' ? parseJsonSafe(actual) || actual : actual
      result = diffJsonStructured(e, a, options)
      break
    }
    case 'lines':
      result = diffLines(expected, actual, options)
      break
    case 'words':
      result = diffWords(expected, actual, options)
      break
    case 'wordsWithSpace':
      result = diffWordsWithSpace(expected, actual, options)
      break
    case 'sentences':
      result = diffSentences(
        expected,
        actual,
        options as DiffSentencesOptionsNonabortable
      )
      break
    default:
      result = diffChars(expected, actual, options)
      break
  }

  if (
    originalType === 'auto' &&
    type !== 'chars' &&
    type !== 'json' &&
    expected !== actual &&
    !result.some((d) => d.added || d.removed)
  ) {
    return diffChars(String(expected), String(actual), options)
  }

  return result
}

/**
 * Formats a list of AIDiffItems by applying prompt templates.
 */
export async function formatDiffList(
  diff: AIDiffItem[],
  ctx: ValidationContext
) {
  const result = cloneDeep(diff)
  for (const d of result) {
    const value = d.value
    if (typeof value === 'string' || isRegExp(value)) {
      d.value = await formatTemplate(value, {
        data: ctx.data,
        input: ctx.input,
        templateFormat: ctx.data?.templateFormat,
      })
    }
  }
  return result
}

/**
 * Checks if a specific actual diff change matches any expected diff definitions.
 */
export function findDiffItem(
  diff: AIDiffItem[],
  item: AIDiffItem,
  _ctx: ValidationContext
) {
  let result: Change | undefined
  const itemAdded = !!item.added
  const itemRemoved = !!item.removed

  for (const d of diff) {
    const unchanged = !(itemAdded || itemRemoved)
    if (unchanged && (d.added === true || d.removed === true)) continue
    if (d.added !== undefined && !!d.added !== itemAdded) continue
    if (d.removed !== undefined && !!d.removed !== itemRemoved) continue

    result = item
    const value = d.value
    const path = d.path
    const val = d.val

    if (path !== undefined && item.path !== undefined) {
      let pathMatched = false
      if (isRegExp(path)) pathMatched = toRegExp(path).test(item.path)
      else pathMatched = path === item.path

      if (!pathMatched) result = undefined
      else if (value !== null && value !== undefined) {
        if (isRegExp(value)) {
          if (!toRegExp(value).test(item.value)) result = undefined
        } else if (value !== item.value && value !== item.value.trim()) result = undefined
      } else if (val !== undefined) {
        if (JSON.stringify(val) !== JSON.stringify(item.val)) result = undefined
      }
    } else if (value != null) {
      const itemValue = item.value
      const itemValueNoNL = itemValue.replace(/\r?\n$/, '')

      if (isRegExp(value)) {
        const regEx = toRegExp(value)
        if (!regEx.test(itemValue) && !regEx.test(itemValueNoNL) && !regEx.test(itemValue.trim())) result = undefined
      } else if (itemValue !== value && itemValueNoNL !== value && itemValue.trim() !== (typeof value === 'string' ? value.trim() : value)) {
        result = undefined
      }
    }

    if (result) break
  }
  return result
}

/**
 * Validates a string mismatch using structured diff analysis.
 */
export async function validateStringDiff(
  actual: string,
  expected: string,
  ctx: ValidationContext,
  options?: AIDiffOptions
): Promise<AIValidationFailure[]> {
  const { input } = ctx
  let diffOptions: AIDiffOptions = options || {}
  let expectedDiff = diffOptions.items || input?.diff
  let diffPermissive = diffOptions.permissive ?? ctx.diffPermissive ?? input?.diffPermissive ?? input?.input?.diffPermissive

  if (expectedDiff === true) {
    diffOptions.type = diffOptions.type || 'auto'
    expectedDiff = undefined
  } else if (expectedDiff && !Array.isArray(expectedDiff)) {
    if (typeof expectedDiff === 'object') {
      if ('items' in expectedDiff || 'type' in expectedDiff) {
        const nestedOptions = expectedDiff as AIDiffOptions
        diffOptions = { ...diffOptions, ...nestedOptions }
        diffPermissive = diffPermissive ?? diffOptions.permissive
        expectedDiff = diffOptions.items
      }
    } else if (typeof expectedDiff === 'string' && expectedDiff !== 'function') {
      diffOptions.type = diffOptions.type || (expectedDiff as AIDiffType)
      expectedDiff = undefined
    }
  }

  if (!expectedDiff && !diffOptions.type) diffOptions.type = 'auto'

  let diff: AIDiffItem[] | undefined = getDiff(expected, actual, diffOptions)

  if (Array.isArray(expectedDiff)) {
    const formattedExpectedDiff = await formatDiffList(expectedDiff, ctx)
    const matchedExpectedIndices = new Set<number>()

    const successfulItems = diff.filter((d) => {
      let matchedIdx = -1
      const matched = (formattedExpectedDiff as AIDiffItem[]).some((ed, idx) => {
        const m = findDiffItem([ed], d, ctx)
        if (m) { matchedIdx = idx; return true }
        return false
      })
      if (matched) matchedExpectedIndices.add(matchedIdx)
      return matched
    })

    const strictDiff = isStrict('diff', ctx)
    const allExpectedMatched = matchedExpectedIndices.size === expectedDiff.length
    const missingRequiredItems = (expectedDiff as AIDiffItem[]).filter((ed, idx) => ed.required === true && !matchedExpectedIndices.has(idx))
    const hasUnverified = diff.some((d) => (d.added || d.removed) && !successfulItems.includes(d))

    if (ctx.scoring) {
      const includeStrictness = !diffPermissive || strictDiff
      const explicitWeights = (expectedDiff as AIDiffItem[]).map(item => {
        if (item && item.score !== undefined) {
          const s = item.score
          return typeof s === 'number' ? s : (s.value ?? 1)
        }
        return null
      })

      const totalPeerCount = expectedDiff.length + (includeStrictness ? 1 : 0)
      const weightPool = includeStrictness ? [...explicitWeights, null] : explicitWeights
      const weights = calculateNormalizedWeights(weightPool, totalPeerCount, { unassignedWeight: ctx.unassignedWeight })

      let earnedFraction = 0
      for (let i = 0; i < expectedDiff.length; i++) {
        if (matchedExpectedIndices.has(i)) earnedFraction += weights[i]
      }
      if (includeStrictness && !hasUnverified) {
        earnedFraction += weights[weights.length - 1]
      }
      ctx.earnedScore = earnedFraction * ctx.allocatedScore
    }

    let failed = false
    const reasons: string[] = []
    const getDiffDesc = (item: AIDiffItem) => item.value || (item.path ? (item.val !== undefined ? `${item.path}: ${JSON.stringify(item.val)}` : item.path) : 'unknown')

    if (strictDiff) {
      if (hasUnverified) { failed = true; reasons.push('unverified changes') }
      if (!allExpectedMatched) { failed = true; reasons.push('not all expected diff items were found (strict mode)') }
    } else {
      if (!diffPermissive && hasUnverified) { failed = true; reasons.push('unverified changes') }
      if (missingRequiredItems.length > 0) {
        failed = true
        reasons.push(`missing required diff items: ${missingRequiredItems.map((item) => `${item.added ? '+' : '-'}"${getDiffDesc(item)}"`).join(', ')}`)
      }
    }

    if (failed) {
      ctx.addFailure(
        { message: `String mismatch with diff: ${reasons.join('; ')}`, expected, actual, diff }
      )
      diff = undefined
    } else diff = undefined
  } else if (typeof expectedDiff === 'function') {
    const successfulItems = await expectedDiff(actual, input, diff)
    if (successfulItems.length < diff.length) {
      successfulItems.forEach((d: any) => { d.verified = true })
      if (diff.filter((d) => !d.verified && (d.added || d.removed)).length === 0) {
        if (ctx.scoring) ctx.earnedScore = ctx.allocatedScore
        diff = undefined
      }
    } else {
      if (ctx.scoring) ctx.earnedScore = ctx.allocatedScore
      diff = undefined
    }
  }

  if (diff && diff.some((d) => d.added || d.removed)) {
    ctx.addFailure({ message: 'String mismatch with diff', expected, actual, diff })
  } else if (!expectedDiff && !diff && ctx.scoring) {
    ctx.earnedScore = ctx.allocatedScore
  }

  return ctx.failures
}
