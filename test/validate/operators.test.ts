import { describe, it, expect } from 'vitest'
import { validateMatch } from '../../src/validate/core.js'

describe('validate/operators', () => {
  it('$contains should pass if array contains item', async () => {
    const failures = await validateMatch([1, 2, 3], { $contains: 2 })
    expect(failures).toHaveLength(0)
  })

  it('$contains should fail if array does not contain item', async () => {
    const failures = await validateMatch([1, 2, 3], { $contains: 4 })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toBe('$contains mismatch: item not found in array')
  })

  it('$all should pass if all items are present', async () => {
    const failures = await validateMatch([1, 2, 3], { $all: [1, 3] })
    expect(failures).toHaveLength(0)
  })

  it('$all should fail if any item is missing', async () => {
    const failures = await validateMatch([1, 2, 3], { $all: [1, 4] })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toBe('$contains mismatch: item not found in array')
  })

  it('$sequence should pass if items appear in order', async () => {
    const failures = await validateMatch([1, 2, 3, 4], { $sequence: [2, 4] })
    expect(failures).toHaveLength(0)
  })

  it('$sequence should fail if items appear out of order', async () => {
    const failures = await validateMatch([1, 4, 2, 3], { $sequence: [2, 4] })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('$sequence mismatch')
  })

  it('$not should pass if value does not match', async () => {
    const failures = await validateMatch('hello', { $not: 'world' })
    expect(failures).toHaveLength(0)
  })

  it('$not should fail if value matches', async () => {
    const failures = await validateMatch('hello', { $not: 'hello' })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toBe('$not mismatch: value matches expectation but should not')
  })

  it('$all with objects', async () => {
    const actual = [{ id: 1, type: 'a' }, { id: 2, type: 'b' }]
    const expected = {
      $all: [
        { type: 'b' },
        { id: 1 }
      ]
    }
    const failures = await validateMatch(actual, expected)
    expect(failures).toHaveLength(0)
  })

  it('$sequence with regex', async () => {
    const actual = ['start', 'processing', 'end']
    const expected = {
      $sequence: [
        /sta/,
        /end/
      ]
    }
    const failures = await validateMatch(actual, expected)
    expect(failures).toHaveLength(0)
  })

  it('$not with complex object', async () => {
    const actual = { a: 1, b: 2 }
    const failures = await validateMatch(actual, { $not: { a: 2 } })
    expect(failures).toHaveLength(0)

    const failures2 = await validateMatch(actual, { $not: { a: 1 } })
    expect(failures2).toHaveLength(1)
  })

  it('should fail if operator is used on non-array actual', async () => {
    const failures = await validateMatch({ a: 1 }, { $contains: 1 })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('requires an array')
  })
})
