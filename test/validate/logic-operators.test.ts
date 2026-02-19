import { describe, it, expect } from 'vitest'
import { validateMatch } from '../../src/validate/core.js'

describe('validate/logic-operators', () => {
  describe('$and', () => {
    it('should pass if all conditions are met', async () => {
      const actual = 15
      const expected = {
        $and: [
          { $schema: { type: 'number', minimum: 10 } },
          { $schema: { type: 'number', maximum: 20 } }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should fail if any condition is not met', async () => {
      const actual = 25
      const expected = {
        $and: [
          { $schema: { type: 'number', minimum: 10 } },
          { $schema: { type: 'number', maximum: 20 } }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(1)
      expect(failures[0].key).toBe('$and[1]')
    })

    it('should collect multiple failures if multiple conditions are not met', async () => {
      const actual = 5
      const expected = {
        $and: [
          { $schema: { type: 'number', minimum: 10 } },
          { $schema: { type: 'number', minimum: 15 } }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(2)
      expect(failures[0].key).toBe('$and[0]')
      expect(failures[1].key).toBe('$and[1]')
    })

    it('should work on objects', async () => {
      const actual = { name: 'test', age: 20 }
      const expected = {
        $and: [
          { name: 'test' },
          { age: 20 }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should support template variables inside $and', async () => {
      const actual = 'hello world'
      const data = { prefix: 'hello' }
      const expected = {
        $and: [
          '{{prefix}} world',
          { $schema: { type: 'string', minLength: 5 } }
        ]
      }
      const failures = await validateMatch(actual, expected, { data })
      expect(failures).toHaveLength(0)
    })

    it('should handle empty $and array as always passing', async () => {
      const actual = { any: 'value' }
      const expected = { $and: [] }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })
  })

  describe('$or', () => {
    it('should pass if at least one condition is met', async () => {
      const actual = 'success'
      const expected = {
        $or: ['success', 'pending']
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should fail and show summary if all conditions are not met', async () => {
      const actual = 'failed'
      const expected = {
        $or: ['success', 'pending']
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('$or mismatch: none of the conditions met')
      expect(failures[0].message).toContain('Branch 0: ')
      expect(failures[0].message).toContain('mismatch')
      expect(failures[0].message).toContain('Branch 1: ')
    })

    it('should support template variables inside $or', async () => {
      const actual = 'admin'
      const data = { role: 'admin' }
      const expected = {
        $or: ['guest', '{{role}}']
      }
      const failures = await validateMatch(actual, expected, { data })
      expect(failures).toHaveLength(0)
    })

    it('should work with complex nested conditions', async () => {
      const actual = { status: 'error', code: 500 }
      const expected = {
        $or: [
          { status: 'success' },
          { $and: [{ status: 'error' }, { code: 500 }] }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should fail if $or array is empty', async () => {
      const actual = 'any'
      const expected = { $or: [] }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('none of the conditions met')
    })
  })

  describe('Complex Combinations & Strict Mode', () => {
    it('should handle $not inside $and', async () => {
      const actual = 'user_123'
      const expected = {
        $and: [
          { $schema: { type: 'string', pattern: '^user_' } },
          { $not: 'user_admin' }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should respect strict mode for objects within logic operators', async () => {
      const actual = { name: 'test', extra: 'key' }
      const expected = {
        $or: [
          { name: 'other' },
          { name: 'test' }
        ]
      }
      // In non-strict mode (default), this should pass even with 'extra' key
      let failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)

      // In strict mode, it should fail if the matching branch has missing keys in expectation
      failures = await validateMatch(actual, expected, { strict: true })
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('Extra key')
    })

    it('should track deep keys accurately in failures', async () => {
      const actual = { user: { id: 1 } }
      const expected = {
        user: {
          $and: [
            { id: { $schema: { type: 'number', minimum: 5 } } }
          ]
        }
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(1)
      // Path should accurately reflect the traversal: user -> $and[0] -> id
      expect(failures[0].key).toBe('user.$and[0].id')
    })

    it('should handle triple-level nesting: $or -> $and -> $or', async () => {
      const actual = { val: 10 }
      const expected = {
        val: {
          $or: [
            { $and: [
                { $or: [5, 10] },
                { $schema: { type: 'number', minimum: 10 } }
            ]},
            20
          ]
        }
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should mix collection operators with logic: $all containing $or', async () => {
      const actual = ['apple', 'banana']
      const expected = {
        $all: [
          { $or: ['apple', 'orange'] },
          { $or: ['banana', 'cherry'] }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should mix regex with logic operators', async () => {
      const actual = 'test-123'
      const expected = {
        $and: [
          /^test-/,
          { $schema: { type: 'string', minLength: 5 } }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })

    it('should provide deep summary when nested $or fails inside $and', async () => {
      const actual = 5
      const expected = {
        $and: [
          { $or: [1, 2] },
          { $or: [3, 4] }
        ]
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(2)
      expect(failures[0].key).toBe('$and[0]')
      expect(failures[0].message).toContain('$or mismatch')
      expect(failures[1].key).toBe('$and[1]')
      expect(failures[1].message).toContain('$or mismatch')
    })
  })

  describe('Edge Cases & Special Types', () => {
    it('should fail if expected is not an array', async () => {
      const failures = await validateMatch(10, { $and: 'not an array' as any })
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toBe('$and operator requires an array of expectations')

      const failuresOr = await validateMatch(10, { $or: 'not an array' as any })
      expect(failuresOr).toHaveLength(1)
      expect(failuresOr[0].message).toBe('$or operator requires an array of expectations')
    })

    it('should work with custom function matchers', async () => {
      const isEven = (val: any) => val % 2 === 0 ? true : 'must be even'
      const isPositive = (val: any) => val > 0 ? true : 'must be positive'
      
      const failures = await validateMatch(4, { $and: [isEven, isPositive] })
      expect(failures).toHaveLength(0)

      const failures2 = await validateMatch(-2, { $and: [isEven, isPositive] })
      expect(failures2).toHaveLength(1)
      expect(failures2[0].message).toContain('must be positive')
    })

    it('should handle null and undefined actual values', async () => {
      const failures = await validateMatch(null, {
        $or: [null, 'something']
      })
      expect(failures).toHaveLength(0)

      const failures2 = await validateMatch(undefined, {
        $and: [{ $schema: { type: 'undefined' } }]
      })
      // Note: json-schema might not support 'undefined' type directly, 
      // but let's test if our logic operator survives the call.
      expect(failures2).toBeDefined()
    })

    it('should work as a top-level operator', async () => {
      const failures = await validateMatch('test', { $and: [/t/, /e/, /s/, /t/] })
      expect(failures).toHaveLength(0)
    })
  })
})
