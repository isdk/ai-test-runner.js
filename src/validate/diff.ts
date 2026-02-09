import { diffChars, Change } from 'diff'
import { isRegExp, toRegExp } from '@isdk/ai-tool'
import { AIDiffItem, AIValidationFailure } from '../types.js'
import type { MatchValueOptions } from './types.js'
import { isStrict } from './utils.js'
import { formatTemplate } from './template.js'

/**
 * Formats a list of AIDiffItems by applying templates to their values.
 *
 * @param diff - The list of diff items to format.
 * @param options - Formatting options.
 * @returns The formatted list of diff items.
 */
export async function formatDiffList(diff: AIDiffItem[], options: MatchValueOptions) {
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
export function findDiffItem(
  diff: AIDiffItem[],
  item: AIDiffItem,
  _options: MatchValueOptions
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

export async function validateStringDiff(
  actual: string,
  expected: string,
  options: MatchValueOptions
): Promise<AIValidationFailure[]> {
  const failures: AIValidationFailure[] = []
  const { input, key } = options
  let diff: AIDiffItem[] | undefined = diffChars(expected, actual)
  let expectedDiff = input?.diff
  let diffPermissive = options.diffPermissive ?? input?.diffPermissive ?? input?.input?.diffPermissive

  if (expectedDiff && !Array.isArray(expectedDiff) && typeof expectedDiff === 'object' && 'items' in expectedDiff) {
    diffPermissive = diffPermissive ?? expectedDiff.permissive
    expectedDiff = expectedDiff.items
  }

  if (Array.isArray(expectedDiff)) {
    await formatDiffList(expectedDiff, options)

    // Track which expected items were matched
    const matchedExpectedIndices = new Set<number>()

    const successfulItems = diff.filter((d) => {
      let matchedIdx = -1
      const matched = (expectedDiff as AIDiffItem[]).some((ed, idx) => {
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
    const missingRequiredItems = (expectedDiff as AIDiffItem[]).filter((ed, idx) => {
      return ed.required === true && !matchedExpectedIndices.has(idx)
    })
    const hasUnverified = diff.some(
      (d) => (d.added || d.removed) && !successfulItems.includes(d)
    )

    let failed = false
    const reasons: string[] = []

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
        reasons.push(`missing required diff items: ${missingRequiredItems.map(item => `${item.added ? '+' : '-'}"${item.value}"`).join(', ')}`)
      }
    }

    if (failed) {
      failures.push({
        key,
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
    failures.push({
      key,
      message: 'String mismatch with diff',
      expected,
      actual,
      diff,
    })
  }

  return failures
}
