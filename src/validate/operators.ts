import { AIValidationFailure } from '../types.js'
import { MatchValueOptions } from './types.js'

export type ValidateMatchFn = (
  actual: any,
  expected: any,
  options?: MatchValueOptions
) => Promise<AIValidationFailure[]>

export async function validateContains(
  actual: any[],
  expected: any,
  options: MatchValueOptions,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
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

export async function validateAll(
  actual: any[],
  expectedList: any[],
  options: MatchValueOptions,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const failures: AIValidationFailure[] = []
  for (const expected of expectedList) {
    const containsFailures = await validateContains(actual, expected, options, validateMatch)
    if (containsFailures.length > 0) {
      failures.push(...containsFailures)
    }
  }
  return failures
}

export async function validateSequence(
  actual: any[],
  expectedList: any[],
  options: MatchValueOptions,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
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

export async function validateNot(
  actual: any,
  expected: any,
  options: MatchValueOptions,
  validateMatch: ValidateMatchFn
): Promise<AIValidationFailure[]> {
  const subFailures = await validateMatch(actual, expected, {
    ...options,
    failures: [],
  })
  if (subFailures.length === 0) {
    return [
      {
        key: options.key,
        message: '$not mismatch: value matches expectation but should not',
        expected,
        actual,
      },
    ]
  }
  return []
}

export const OPERATORS: Record<string, (actual: any, expected: any, options: MatchValueOptions, validateMatch: ValidateMatchFn) => Promise<AIValidationFailure[]>> = {
  '$contains': validateContains,
  '$all': validateAll,
  '$sequence': validateSequence,
  '$not': validateNot,
}
