import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn } from '../types.js'
import { orderBy, omit } from 'lodash-es'

/**
 * Validates that the remaining expectations pass after sorting the actual array.
 * 
 * @example
 * "$sort": {
 *   "$by": "-createdAt", // or ["category", "-score"]
 *   "$sequence": [ ... ]
 * }
 */
export async function validateSort(
  actual: any,
  expected: any,
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  if (!Array.isArray(actual)) {
    return {
      score: 0,
      pass: false,
      message: '$sort mismatch: actual value is not an array',
      expected,
      actual,
    }
  }

  const by = expected.$by
  let iteratees: string[] = []
  let orders: ('asc' | 'desc')[] = []

  if (typeof by === 'string') {
    const isDesc = by.startsWith('-')
    iteratees.push(isDesc ? by.substring(1) : by)
    orders.push(isDesc ? 'desc' : 'asc')
  } else if (Array.isArray(by)) {
    for (const field of by) {
      if (typeof field === 'string') {
        const isDesc = field.startsWith('-')
        iteratees.push(isDesc ? field.substring(1) : field)
        orders.push(isDesc ? 'desc' : 'asc')
      }
    }
  } else {
    // If no $by is provided or it's invalid, we don't sort or default to natural sort?
    // It's better to fall back to natural sorting or just remain unsorted if $by is completely missing.
    // If there is no $by, we might just pass through.
    if (by !== undefined) {
      return {
        score: 0,
        pass: false,
        message: '$sort mismatch: $by must be a string or an array of strings',
        expected,
        actual,
      }
    }
  }

  let sortedActual = actual
  if (iteratees.length > 0) {
    sortedActual = orderBy(actual, iteratees, orders)
  } else if (by !== undefined && iteratees.length === 0) {
    // Edge case if $by is empty array
    sortedActual = [...actual].sort()
  }

  // Omit the $by config parameter to pass only the assertions downwards
  const restExpected = omit(expected, ['$by'])

  // Let the sub-context know we are delegating 
  const nextCtx = ctx.createSubContext('')
  
  // Propagate scoring properties manually
  nextCtx.allocatedScore = ctx.allocatedScore

  const result = await validateMatch(sortedActual, restExpected, nextCtx)
  return result as ValidationResult
}

validateSort.virtual = true // Ensures '$sort' step is transparent in the failure key path
