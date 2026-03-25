import { describe, it, expect } from 'vitest'
import { validate } from '../../src/validate/core.js'
import { ValidationContext } from '../../src/validate/types.js'

describe('Array Processing Operators', () => {
  describe('$sort', () => {
    it('should sort an array of objects by a single string field (asc and desc)', async () => {
      const actual = [
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' }
      ]

      // Ascending
      const rs1 = await validate(actual, {
        $sort: {
          $by: 'id',
          $first: { name: 'Alice' }
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs1.pass).toBe(true)

      // Descending
      const rs2 = await validate(actual, {
        $sort: {
          $by: '-id',
          $first: { name: 'Charlie' }
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs2.pass).toBe(true)
    })

    it('should sort an array of objects by multiple fields', async () => {
      const actual = [
        { score: 90, age: 20 },
        { score: 90, age: 25 },
        { score: 80, age: 22 }
      ]

      const rs = await validate(actual, {
        $sort: {
          $by: ['-score', 'age'], // score desc, then age asc
          $first: { age: 20 },
          $last: { score: 80 }
        }
      }, new ValidationContext({ scoring: true }))

      expect(rs.pass).toBe(true)
    })

    it('should fall back to natural sort if $by is empty array, and fail if $by is invalid type', async () => {
      const actual = [3, 1, 2]

      const rs1 = await validate(actual, {
        $sort: {
          $by: [],
          $sequence: [1, 2, 3]
        }
      }, new ValidationContext())
      expect(rs1.pass).toBe(true)

      const rs2 = await validate(actual, {
        $sort: {
          $by: 123, // invalid
          $sequence: [1, 2, 3]
        }
      }, new ValidationContext())
      expect(rs2.pass).toBe(false)
      expect(rs2.failures[0].message).toContain('must be a string or an array of strings')
    })

    it('should chain nicely with $each', async () => {
      const actual = [
        { val: 1 },
        { val: 2 },
        { val: 3 }
      ]
      const rs = await validate(actual, {
        $sort: {
          $by: '-val',
          $each: {
            val: { $gt: 0 }
          }
        }
      }, new ValidationContext())
      expect(rs.pass).toBe(true)
    })
  })

  describe('$nth / $first / $last', () => {
    const actual = [
      { id: 1, type: 'A' },
      { id: 2, type: 'B' },
      { id: 3, type: 'C' }
    ]

    it('should extract correct element with $nth', async () => {
      const rs = await validate(actual, {
        $nth: {
          $index: 1,
          type: 'B'
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs.pass).toBe(true)
    })

    it('should handle negative index in $nth', async () => {
      const rs = await validate(actual, {
        $nth: {
          $index: -2,
          type: 'B'
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs.pass).toBe(true)
    })

    it('should return fail if index is out of bounds for $nth', async () => {
      const rs = await validate(actual, {
        $nth: {
          $index: 5,
          type: 'A'
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs.pass).toBe(false)
      expect(rs.failures[0].message).toContain('is out of bounds for array of length 3')
    })

    it('should default to first element if $index is omitted in $nth', async () => {
      const rs = await validate(actual, {
        $nth: {
          type: 'A'
        }
      }, new ValidationContext())
      expect(rs.pass).toBe(true)

      const rs2 = await validate(actual, {
        $nth: {
          type: 'B' // wrong
        }
      }, new ValidationContext())
      expect(rs2.pass).toBe(false)
    })

    it('should work correctly with $first alias', async () => {
      const rs = await validate(actual, {
        $first: {
          type: 'A'
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs.pass).toBe(true)
    })

    it('should work correctly with $last alias', async () => {
      const rs = await validate(actual, {
        $last: {
          type: 'C'
        }
      }, new ValidationContext({ scoring: true }))
      expect(rs.pass).toBe(true)
    })

    it('should report failure with meaningful path', async () => {
      const rs = await validate({ items: actual }, {
        items: {
          $last: {
            type: 'Z' // will fail
          }
        }
      }, new ValidationContext({ key: 'root' }))

      expect(rs.pass).toBe(false)
      // Path tracing check:
      // The path should look like 'root.items[2].type'
      expect(rs.failures[0].key).toBe('root.items[2].type')
    })
  })

  describe('Integration (Chaining Modifiers)', () => {
    it('should compose $sort and $first smoothly', async () => {
      const actual = [
        { date: '2023-01-01', v: 10 },
        { date: '2023-01-03', v: 30 },
        { date: '2023-01-02', v: 20 }
      ]

      const rs = await validate(actual, {
        $sort: {
          $by: '-date',
          $first: { v: 30 },
          $last: { v: 10 }
        }
      }, new ValidationContext())

      expect(rs.pass).toBe(true)
    })
  })
})
