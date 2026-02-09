import { AIStrictOption } from '../types.js'

/**
 * Checks if strict mode is enabled for a specific type.
 *
 * @param type - The type to check ('object', 'diff', or 'array').
 * @param strict - The strict option configuration.
 * @returns True if strict mode is enabled for the given type.
 */
export function isStrict(
  type: 'object' | 'diff' | 'array',
  strict?: AIStrictOption
): boolean {
  if (typeof strict === 'boolean') return strict
  if (typeof strict === 'string') return strict === type
  if (Array.isArray(strict)) return strict.includes(type)
  return false
}
