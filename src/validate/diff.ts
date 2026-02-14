import {
  diffChars,
  diffLines,
  diffWords,
  diffWordsWithSpace,
  diffSentences,
  Change
} from 'diff'
import { isRegExp, toRegExp, getKeysPath } from '@isdk/ai-tool'
import { get as getByPath, cloneDeep } from 'lodash-es'
import { AIDiffItem, AIValidationFailure, AIDiffOptions, AIDiffType } from '../types.js'
import { ValidationContext } from './types.js'
import { isStrict } from './utils.js'
import { formatTemplate } from './template.js'

function isJsonLike(str: string): boolean {
  const s = str.trim()
  return (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))
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
function diffJsonStructured(expected: any, actual: any, _options: AIDiffOptions = {}): AIDiffItem[] {
  const expectedPaths = getKeysPath(expected)
  const actualPaths = getKeysPath(actual)

  const allPaths = Array.from(new Set([...expectedPaths, ...actualPaths])).sort()
  const diffs: AIDiffItem[] = []

  for (const path of allPaths) {
    const eVal = getByPath(expected, path)
    const aVal = getByPath(actual, path)

    const inExpected = expectedPaths.includes(path)
    const inActual = actualPaths.includes(path)

    if (!inExpected) {
      // Added in actual
      diffs.push({
        added: true,
        removed: false,
        path,
        val: aVal,
        value: `${path}: ${JSON.stringify(aVal)}`
      })
    } else if (!inActual) {
      // Removed from expected
      diffs.push({
        added: false,
        removed: true,
        path,
        val: eVal,
        value: `${path}: ${JSON.stringify(eVal)}`
      })
    } else if (JSON.stringify(eVal) !== JSON.stringify(aVal)) {
      // Changed
      diffs.push({
        added: false,
        removed: true,
        path,
        val: eVal,
        value: `${path}: ${JSON.stringify(eVal)}`
      })
      diffs.push({
        added: true,
        removed: false,
        path,
        val: aVal,
        value: `${path}: ${JSON.stringify(aVal)}`
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
export function getDiff(expected: any, actual: any, options: AIDiffOptions = {}): AIDiffItem[] {
  const originalType = options.type || 'chars'
  let type: AIDiffType = originalType

  if (type === 'auto') {
    type = detectDiffType(String(expected), String(actual))
  }

  let result: AIDiffItem[]
  switch (type) {
    case 'json': {
      const e = typeof expected === 'string' ? parseJsonSafe(expected) || expected : expected
      const a = typeof actual === 'string' ? parseJsonSafe(actual) || actual : actual
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
      result = diffSentences(expected, actual, options)
      break
    default:
      result = diffChars(expected, actual, options)
      break
  }

  // Fallback to diffChars if the high-level diff didn't find changes but strings are actually different.
  // We only do this in 'auto' mode to remain strict while keeping high readability.
  // For 'json', we usually want semantic equality, so we don't fallback.
  if (
    originalType === 'auto' && 
    type !== 'chars' && 
    type !== 'json' && 
    expected !== actual && 
    !result.some(d => d.added || d.removed)
  ) {
    return diffChars(String(expected), String(actual), options)
  }

  return result
}

/**
 * Formats a list of AIDiffItems by applying prompt templates to their string or RegExp values.
 *
 * @param diff - The list of diff items to format.
 * @param ctx - Validation context providing data for template resolution.
 * @returns A new list of formatted diff items.
 */
export async function formatDiffList(diff: AIDiffItem[], ctx: ValidationContext) {
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
 * Checks if a specific actual diff change matches any of the expected diff definitions.
 *
 * @param diff - The list of expected diff items (whitelist).
 * @param item - The actual change item from the diff library.
 * @param _ctx - Validation context.
 * @returns The matched item if a match is found, otherwise undefined.
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
    if (unchanged && (d.added === true || d.removed === true)) {
      continue
    }
    if (d.added !== undefined && !!d.added !== itemAdded) {
      continue
    }
    if (d.removed !== undefined && !!d.removed !== itemRemoved) {
      continue
    }

    result = item

    const value = d.value
    const path = d.path
    const val = d.val

    if (path !== undefined && item.path !== undefined) {
      // For JSON structured diff, prioritize matching by path and value
      let pathMatched = false
      if (isRegExp(path)) {
        pathMatched = toRegExp(path).test(item.path)
      } else {
        pathMatched = path === item.path
      }

      if (!pathMatched) {
        result = undefined
      } else if (value !== null && value !== undefined) {
        // value exists, match it (already formatted in formatDiffList)
        if (isRegExp(value)) {
          if (!toRegExp(value).test(item.value)) {
            result = undefined
          }
        } else if (value !== item.value) {
          result = undefined
        }
      } else if (val !== undefined) {
        // val exists, perform logical matching
        if (JSON.stringify(val) !== JSON.stringify(item.val)) {
          result = undefined
        }
      }
    } else if (value != null) {
      const itemValue = item.value
      const itemValueNoNL = itemValue.replace(/\r?\n$/, '')
      
      if (isRegExp(value)) {
        const regEx = toRegExp(value)
        if (!regEx.test(itemValue) && !regEx.test(itemValueNoNL)) {
          result = undefined
        }
      } else if (itemValue !== value && itemValueNoNL !== value) {
        result = undefined
      }
    }

    if (result) {
      break
    }
  }
  return result
}

/**
 * Validates a string mismatch using structured diff analysis.
 * Supports whitelist matching, strict mode, and mandatory (required) changes.
 *
 * @param actual - The actual string produced.
 * @param expected - The expected baseline string.
 * @param ctx - Validation context.
 * @returns A promise resolving to the failure list from the context.
 */
export async function validateStringDiff(
  actual: string,
  expected: string,
  ctx: ValidationContext
): Promise<AIValidationFailure[]> {
  const { input } = ctx
  let expectedDiff = input?.diff
  let diffPermissive = ctx.diffPermissive ?? input?.diffPermissive ?? input?.input?.diffPermissive
  let diffOptions: AIDiffOptions = {}

  if (expectedDiff === true) {
    diffOptions.type = 'auto'
    expectedDiff = undefined
  } else if (expectedDiff && !Array.isArray(expectedDiff)) {
    if (typeof expectedDiff === 'object') {
      if ('items' in expectedDiff || 'type' in expectedDiff) {
        diffOptions = expectedDiff as AIDiffOptions
        diffPermissive = diffPermissive ?? diffOptions.permissive
        expectedDiff = diffOptions.items
      }
    } else if (typeof expectedDiff === 'string' && expectedDiff !== 'function') {
      // Shorthand for diff type: 'auto', 'lines', etc.
      diffOptions = { type: expectedDiff as AIDiffType }
      expectedDiff = undefined
    }
  }

  if (!expectedDiff && !diffOptions.type) {
    diffOptions.type = 'auto'
  }

  let diff: AIDiffItem[] | undefined = getDiff(expected, actual, diffOptions)

  if (Array.isArray(expectedDiff)) {
    const formattedExpectedDiff = await formatDiffList(expectedDiff, ctx)

    // Track which expected items were matched
    const matchedExpectedIndices = new Set<number>()

    const successfulItems = diff.filter((d) => {
      let matchedIdx = -1
      const matched = (formattedExpectedDiff as AIDiffItem[]).some((ed, idx) => {
        const m = findDiffItem([ed], d, ctx)
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

    const strictDiff = isStrict('diff', ctx)
    const allExpectedMatched =
      matchedExpectedIndices.size === expectedDiff.length
    const missingRequiredItems = (expectedDiff as AIDiffItem[]).filter((ed, idx) => {
      return ed.required === true && !matchedExpectedIndices.has(idx)
    })
    const hasUnverified = diff.some(
      (d) => (d.added || d.removed) && !successfulItems.includes(d)
    )

    let failed = false
    const reasons: string[] = []

    const getDiffDesc = (item: AIDiffItem) => {
      if (item.value) return item.value
      if (item.path) {
        return item.val !== undefined ? `${item.path}: ${JSON.stringify(item.val)}` : item.path
      }
      return 'unknown'
    }

    if (strictDiff) {
      if (hasUnverified) {
        failed = true
        reasons.push('unverified changes')
      }
      if (!allExpectedMatched) {
        failed = true
        reasons.push('not all expected diff items were found (strict mode)')
      }
    } else {
      if (!diffPermissive && hasUnverified) {
        failed = true
        reasons.push('unverified changes')
      }
      if (missingRequiredItems.length > 0) {
        failed = true
        reasons.push(`missing required diff items: ${missingRequiredItems.map(item => `${item.added ? '+' : '-'}"${getDiffDesc(item)}"`).join(', ')}`)
      }
    }

    if (failed) {
      ctx.addFailure({
        message: `String mismatch with diff: ${reasons.join('; ')}`,
        expected,
        actual,
        diff,
      })
      diff = undefined
    } else {
      diff = undefined
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

  if (diff && diff.some((d) => d.added || d.removed)) {
    ctx.addFailure({
      message: 'String mismatch with diff',
      expected,
      actual,
      diff,
    })
  }

  return ctx.failures
}
