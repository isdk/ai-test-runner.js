import { YamlTypeJsonSchema } from '../yaml-types/index.js'
import { AIValidationFailure } from '../types.js'
import { ValidationContext, MatchResult } from './types.js'

/** Standard JSON Schema primitive types. */
const JSON_SCHEMA_TYPES = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
])

/**
 * Heuristically determines if a given value should be treated as a JSON Schema.
 * It checks for the presence of a 'type' property with a valid JSON Schema type
 * and the absence of custom operators.
 *
 * @param expected - The value to check.
 * @returns True if the value appears to be a JSON Schema.
 */
export function isJsonSchema(expected: any): boolean {
  if (expected instanceof YamlTypeJsonSchema) return true
  if (typeof expected === 'object' && expected !== null && expected.type) {
    if (
      typeof expected.type === 'string' &&
      JSON_SCHEMA_TYPES.has(expected.type)
    ) {
      const keys = Object.keys(expected)
      // Basic heuristic to distinguish from other objects (like operators)
      return keys.every((k) => !['$contains', '$all', '$sequence'].includes(k))
    }
  }
  return false
}

/**
 * Validates a value against a JSON Schema.
 * Uses `YamlTypeJsonSchema` for validation and error reporting.
 *
 * @param actual - The actual value to validate.
 * @param expected - The JSON Schema (object or YamlTypeJsonSchema instance).
 * @param ctx - The validation context.
 * @returns A promise resolving to the MatchResult.
 */
export async function validateJsonSchema(
  actual: any,
  expected: any,
  ctx: ValidationContext
): Promise<MatchResult> {
  let schema: YamlTypeJsonSchema | undefined
  const failures: AIValidationFailure[] = []

  if (expected instanceof YamlTypeJsonSchema) {
    schema = expected
  } else {
    try {
      schema = YamlTypeJsonSchema.create(expected)
    } catch (e) {
      // Not a valid JSON Schema
      console.error('validateJsonSchema error:', e)
    }
  }

  if (schema) {
    const valid = YamlTypeJsonSchema.validate(schema, actual)
    if (!valid) {
      const errors = YamlTypeJsonSchema.getErrors(schema)!
      failures.push({
        key: ctx.key,
        message: 'JSON Schema validation failed',
        expected: errors,
        actual,
      })
      return { score: 0, pass: false, failures }
    }
  }
  return { score: 1, pass: true, failures }
}
