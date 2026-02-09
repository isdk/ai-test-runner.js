import { describe, it, expect } from 'vitest'
import { validateMatch } from '../../src/validate/core.js'
import { YamlTypeJsonSchema } from '../../src/yaml-types/index.js'

describe('validate/schema', () => {
  it('should validate using YamlTypeJsonSchema', async () => {
    const schema = YamlTypeJsonSchema.create({ type: 'number' })
    const failures = await validateMatch(123, schema)
    expect(failures).toHaveLength(0)

    const failures2 = await validateMatch('abc', schema)
    expect(failures2).toHaveLength(1)
    expect(failures2[0].message).toBe('JSON Schema validation failed')
  })

  it('should validate if expected object looks like a schema', async () => {
    const failures = await validateMatch(123, { type: 'number' })
    expect(failures).toHaveLength(0)

    const failures2 = await validateMatch('abc', { type: 'number' })
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
    const failures = await validateMatch({ age: 10 }, schema)
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toBe('JSON Schema validation failed')
    expect(failures[0].expected).toBeDefined() // AJV errors
    expect(failures[0].expected[0].keyword).toBe('minimum')
  })
})
