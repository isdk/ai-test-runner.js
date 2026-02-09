import { YamlTypeJsonSchema } from '../yaml-types/index.js'
import { AIValidationFailure } from '../types.js'
import { MatchValueOptions } from './types.js'

export function isJsonSchema(expected: any): boolean {
  if (expected instanceof YamlTypeJsonSchema) return true
  if (typeof expected === 'object' && expected !== null && expected.type) {
    const keys = Object.keys(expected)
    // Basic heuristic to distinguish from other objects
    return keys.every(k => !['$contains', '$all', '$sequence'].includes(k))
  }
  return false
}

export async function validateJsonSchema(
  actual: any,
  expected: any,
  options: MatchValueOptions
): Promise<AIValidationFailure[]> {
  const failures: AIValidationFailure[] = []
  let schema: YamlTypeJsonSchema | undefined

  if (expected instanceof YamlTypeJsonSchema) {
    schema = expected
  } else {
    try {
      schema = YamlTypeJsonSchema.create(expected)
    } catch (e) {
      // Not a valid JSON Schema
    }
  }

  if (schema) {
    const valid = YamlTypeJsonSchema.validate(schema, actual)
    if (!valid) {
      const errors = YamlTypeJsonSchema.getErrors(schema)!
      failures.push({
        key: options.key,
        message: 'JSON Schema validation failed',
        expected: errors,
        actual,
      })
    }
  }
  return failures
}
