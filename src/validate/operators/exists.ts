import { ValidationResult } from '../../types.js'
import { ValidationContext } from '../types.js'

/**
 * Validates whether a property exists or is defined.
 */
export async function validateExists(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<ValidationResult> {
  let expectedExists: boolean
  let strict = false

  if (
    typeof expected === 'object' &&
    expected !== null &&
    '$value' in expected
  ) {
    expectedExists = !!expected.$value
    strict = !!expected.strict
  } else {
    expectedExists = !!expected
  }

  const isPresent = ctx.isKeyPresent
  const isUndefined = actual === undefined
  let failed = false
  let message = ''

  if (strict) {
    if (expectedExists && !isPresent) {
      failed = true
      message = `$exists mismatch: key expected to be present but it is missing`
    } else if (!expectedExists && isPresent) {
      failed = true
      message = `$exists mismatch: key expected to be missing but it exists`
    }
  } else {
    if (expectedExists && isUndefined) {
      failed = true
      message = `$exists mismatch: value expected to be defined but it is undefined`
    } else if (!expectedExists && !isUndefined) {
      failed = true
      message = `$exists mismatch: value expected to be undefined but it is defined`
    }
  }

  if (failed) {
    return {
      score: 0,
      pass: false,
      message,
      actual: strict
        ? isPresent
          ? 'present'
          : 'missing'
        : isUndefined
          ? 'undefined'
          : 'defined',
    }
  }

  return true
}
