import { describe, it, expect } from 'vitest'
import { validateMatch } from '../../src/validate/core.js'

describe('validate/$exists', () => {
  it('should pass if property exists (non-strict)', async () => {
    const actual = { foo: 1 }
    const failures = await validateMatch(actual, { foo: { $exists: true } })
    expect(failures).toHaveLength(0)
  })

  it('should fail if property is missing (non-strict)', async () => {
    const actual = {}
    const failures = await validateMatch(actual, { foo: { $exists: true } })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('value expected to be defined')
  })

  it('should pass if property is missing and $exists is false (non-strict)', async () => {
    const actual = {}
    const failures = await validateMatch(actual, { foo: { $exists: false } })
    expect(failures).toHaveLength(0)
  })

  it('should fail if property is present and $exists is false (non-strict)', async () => {
    const actual = { foo: 1 }
    const failures = await validateMatch(actual, { foo: { $exists: false } })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('value expected to be undefined')
  })

  it('should pass if property is undefined and $exists is false (non-strict)', async () => {
    const actual = { foo: undefined }
    const failures = await validateMatch(actual, { foo: { $exists: false } })
    expect(failures).toHaveLength(0)
  })

  describe('strict mode', () => {
    it('should fail if property is undefined but present when $exists: { $value: false, strict: true }', async () => {
      const actual = { foo: undefined }
      const failures = await validateMatch(actual, {
        foo: {
          $exists: { $value: false, strict: true }
        }
      })
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('key expected to be missing but it exists')
    })

    it('should pass if property is missing when $exists: { $value: false, strict: true }', async () => {
      const actual = {}
      const failures = await validateMatch(actual, {
        foo: {
          $exists: { $value: false, strict: true }
        }
      })
      expect(failures).toHaveLength(0)
    })

    it('should pass if property is present (even if undefined) when $exists: { $value: true, strict: true }', async () => {
      const actual = { foo: undefined }
      const failures = await validateMatch(actual, {
        foo: {
          $exists: { $value: true, strict: true }
        }
      })
      expect(failures).toHaveLength(0)
    })

    it('should fail if property is missing when $exists: { $value: true, strict: true }', async () => {
      const actual = {}
      const failures = await validateMatch(actual, {
        foo: {
          $exists: { $value: true, strict: true }
        }
      })
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('key expected to be present but it is missing')
    })
  })

  it('should support deep paths', async () => {
    const actual = { a: { b: 1 } }
    const failures = await validateMatch(actual, { 'a.b': { $exists: true } })
    expect(failures).toHaveLength(0)

    const failures2 = await validateMatch(actual, { 'a.c': { $exists: false } })
    expect(failures2).toHaveLength(0)
  })

  it('should support templates in $exists', async () => {
    const actual = { foo: 1 }
    // Using template to determine if it should exist
    const failures = await validateMatch(actual,
      { foo: { $exists: '{{shouldExist}}' } },
      { data: { shouldExist: true } }
    )
    expect(failures).toHaveLength(0)

        const failures2 = await validateMatch(actual,
          { foo: { $exists: '{{shouldNotExist}}' } },
          { data: { shouldNotExist: false } }
        )
        expect(failures2).toHaveLength(1)
      })

      it('should treat falsy values as defined', async () => {
        const scenarios = [0, '', false, null]
        for (const val of scenarios) {
          const failures = await validateMatch({ foo: val }, { foo: { $exists: true } })
          expect(failures, `Failed for value: ${val}`).toHaveLength(0)
        }
      })

      it('should work with $and operator', async () => {
        const actual = { foo: 'bar' }
        const expected = {
          foo: {
            $and: [
              { $exists: true },
              /ba/
            ]
          }
        }
        const failures = await validateMatch(actual, expected)
        expect(failures).toHaveLength(0)

            const actualMissing = {}
            const failures2 = await validateMatch(actualMissing, expected)
            // It returns 2 failures: one for $exists and one for the RegExp mismatch
            expect(failures2).toHaveLength(2)
            expect(failures2[0].message).toContain('value expected to be defined')
          })
        
          it('should distinguish inherited properties in strict mode', async () => {
            const proto = { inherited: 1 }
            const actual = Object.create(proto)
            actual.own = 2
        
            // Non-strict: both should "exist" as they have values
            expect(await validateMatch(actual, { own: { $exists: true } })).toHaveLength(0)
            expect(await validateMatch(actual, { inherited: { $exists: true } })).toHaveLength(0)
        
            // Strict: inherited property is not "present" on the object itself
            const failures = await validateMatch(actual, { 
              inherited: { $exists: { $value: true, strict: true } } 
            })
            expect(failures).toHaveLength(1)
            expect(failures[0].message).toContain('key expected to be present but it is missing')
          })
        
          it('should work with regex keys', async () => {
        
        const actual = { user_123: 'Alice' }
        // Test regex key exists
        const failures = await validateMatch(actual, { '/^user_/': { $exists: true } })
        expect(failures).toHaveLength(0)

        // Test regex key does not exist
        const failures2 = await validateMatch(actual, { '/^admin_/': { $exists: false } })
        expect(failures2).toHaveLength(0)
      })

      it('should support array index paths', async () => {
        const actual = { tags: ['a', 'b'] }
        const failures = await validateMatch(actual, { 'tags[1]': { $exists: true } })
        expect(failures).toHaveLength(0)

        const failures2 = await validateMatch(actual, { 'tags[2]': { $exists: false } })
        expect(failures2).toHaveLength(0)
      })

      it('should handle complex nesting', async () => {
        const actual = {
          a: {
            b: [
              { c: 1 }
            ]
          }
        }
        const failures = await validateMatch(actual, { 'a.b[0].c': { $exists: true } })
        expect(failures).toHaveLength(0)

        const failures2 = await validateMatch(actual, { 'a.b[0].d': { $exists: false } })
        expect(failures2).toHaveLength(0)
      })

      it('should fail when combined with $not incorrectly', async () => {
        const actual = { foo: 1 }
        // foo exists, so $exists: true is true, then $not makes it false -> should fail
        const failures = await validateMatch(actual, { foo: { $not: { $exists: true } } })
        expect(failures).toHaveLength(1)
      })
    })

