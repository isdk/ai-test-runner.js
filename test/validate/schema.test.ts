import { describe, it, expect } from 'vitest'
import { validate } from '../../src/validate/core.js'
import { ValidationContext } from '../../src/validate/types.js'
import { isJsonSchema } from '../../src/validate/schema.js'
import { YamlTypeJsonSchema } from '../../src/yaml-types/index.js'

describe('validate/schema', () => {
  describe('isJsonSchema heuristic', () => {
    it('should return true for YamlTypeJsonSchema instances', () => {
      const schema = YamlTypeJsonSchema.create({ type: 'string' })
      expect(isJsonSchema(schema)).toBe(true)
    })

    it('should return true for objects with standard JSON Schema types', () => {
      expect(isJsonSchema({ type: 'string' })).toBe(true)
      expect(isJsonSchema({ type: 'number' })).toBe(true)
      expect(isJsonSchema({ type: 'boolean' })).toBe(true)
      expect(isJsonSchema({ type: 'object' })).toBe(true)
      expect(isJsonSchema({ type: 'array' })).toBe(true)
      expect(isJsonSchema({ type: 'null' })).toBe(true)
    })

    it('should return false for objects with non-standard types', () => {
      // Prevents misidentifying custom domain objects as schemas
      expect(isJsonSchema({ type: 'my-custom-type' })).toBe(false)
      expect(isJsonSchema({ type: 'button' })).toBe(false)
    })

    it('should return false if custom operators are present', () => {
      // Even if it has type: 'object', if it has $contains, it's likely an operator object
      expect(isJsonSchema({ type: 'object', $contains: 'foo' })).toBe(false)
    })

    it('should return false for null or non-objects', () => {
      expect(isJsonSchema(null)).toBe(false)
      expect(isJsonSchema('string')).toBe(false)
      expect(isJsonSchema(123)).toBe(false)
    })
  })

  describe('schema validation integration', () => {
    it('should validate using YamlTypeJsonSchema instance', async () => {
      const schema = YamlTypeJsonSchema.create({ type: 'number' })
      const { failures } = await validate(123, schema, new ValidationContext())
      expect(failures).toHaveLength(0)

      const { failures: failures2 } = await validate('abc', schema, new ValidationContext())
      expect(failures2).toHaveLength(1)
      expect(failures2[0].message).toBe('JSON Schema validation failed')
    })

    it('should validate if expected object looks like a schema (automatic recognition)', async () => {
      // This tests that validateMatch internally calls validateJsonSchema for plain objects
      const { failures } = await validate(123, { type: 'number' }, new ValidationContext())
      expect(failures).toHaveLength(0)

      const { failures: failures2 } = await validate('abc', { type: 'number' }, new ValidationContext())
      expect(failures2).toHaveLength(1)
      expect(failures2[0].message).toBe('JSON Schema validation failed')
    })

    it('should report detailed errors from JSON Schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18 }
        }
      }
      const { failures } = await validate({ age: 10 }, schema, new ValidationContext())
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toBe('JSON Schema validation failed')
      expect(failures[0].expected).toBeDefined() // AJV errors
      expect(failures[0].expected[0].keyword).toBe('minimum')
    })

    it('should support templates within automatic schema recognition', async () => {
      const schema = { type: 'string', pattern: '^{{prefix}}' }
      const options = { data: { prefix: 'AI' } }
      const { failures } = await validate('AI is cool', schema, new ValidationContext(options))
      expect(failures).toHaveLength(0)

      const { failures: failures2 } = await validate('Human is cool', schema, new ValidationContext(options))
      expect(failures2).toHaveLength(1)
    })

    it('should NOT validate as schema if disableHeuristicSchema is true', async () => {
      const schema = { type: 'number' }
      // Should fail as value equality check because it's treated as a normal object
      const { failures } = await validate(123, schema, new ValidationContext({ disableHeuristicSchema: true }))
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toBe('Value equality check failed')
    })

    it('should still validate YamlTypeJsonSchema instances even if disableHeuristicSchema is true', async () => {
      const schema = YamlTypeJsonSchema.create({ type: 'number' })
      const { failures } = await validate(123, schema, new ValidationContext({ disableHeuristicSchema: true }))
      expect(failures).toHaveLength(0)
    })

    it('should propagate disableHeuristicSchema to nested objects', async () => {
      const actual = {
        meta: { version: 1 }
      }
      const expected = {
        meta: { version: { type: 'number' } } // This would be recognized as schema by heuristic
      }

      // When disabled, { type: 'number' } is treated as a plain object to match against { version: 1 }
      // It should fail because { type: 'number' } !== 1
      const { failures } = await validate(actual, expected, new ValidationContext({ disableHeuristicSchema: true }))
      expect(failures).toHaveLength(1)
      expect(failures[0].key).toBe('meta.version')
      expect(failures[0].message).toBe('Value equality check failed')
    })
  })
})
