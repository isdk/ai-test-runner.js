import { describe, it, expect } from 'vitest'
import { validateMatch } from '../../src/validate/core.js'

describe('validate/diff', () => {
  it('should fail with diff info when string mismatch', async () => {
    const failures = await validateMatch('actual', 'expected')
    expect(failures).toHaveLength(1)
    expect(failures[0].diff).toBeDefined()
  })

  it('should pass if expectedDiff list matches', async () => {
    const failures = await validateMatch('hello world', 'hello', {
      input: {
        diff: [
          { value: ' world', added: true }
        ]
      }
    })
    expect(failures).toHaveLength(0)
  })

  it('should fail if expectedDiff list does not match all changes', async () => {
    const failures = await validateMatch('hello world!', 'hello', {
      input: {
        diff: [
          { value: ' world', added: true, required: true }
        ]
      }
    })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('unverified changes')
    expect(failures[0].message).toContain('missing required diff items')
  })

  it('should report both unverified and missing items', async () => {
    const failures = await validateMatch('hello world!', 'hello', {
      input: {
        diff: [
          { value: 'missing', added: true, required: true }
        ]
      }
    })
    expect(failures[0].message).toContain('unverified changes')
    expect(failures[0].message).toContain('missing required diff items')
  })

  it('should pass in non-strict diff mode with partial expectedDiff', async () => {
     const failures = await validateMatch('abcde', 'abc', {
       input: {
         diff: [{ value: 'de', added: true }]
       }
     })
     expect(failures).toHaveLength(0)
  })

  it('should fail in strict diff mode if extra changes exist', async () => {
    const failures = await validateMatch('abcde', 'abc', {
      strict: 'diff',
      input: {
        diff: []
      }
    })
    expect(failures).toHaveLength(1)
    expect(failures[0].message).include('unverified changes')
  })

  it('should pass in strict diff mode if all changes are matched', async () => {
    const failures = await validateMatch('abcde', 'abc', {
      strict: 'diff',
      input: {
        diff: [{ value: 'de', added: true }]
      }
    })
    expect(failures).toHaveLength(0)
  })

  it('should support RegExp in expectedDiff', async () => {
    const failures = await validateMatch('abcde', 'abc', {
      input: {
        diff: [{ value: /d/, added: true }]
      }
    })
    expect(failures).toHaveLength(0)
  })

  it('should pass with custom diff function', async () => {
    const failures = await validateMatch('hello world', 'hello', {
      input: {
        diff: (actual: any, input: any, diff: any) => {
          return diff // return all items as verified
        }
      }
    })
    expect(failures).toHaveLength(0)
  })

  describe('Chinese diff specific cases', () => {
    const expected = '这是应该输出的内容'
    const expectedDiff = [
      { value: '\n', added: true },
      { value: '的', removed: true },
      { value: '地', added: true }
    ]

    it('should match with replacements and extra newline', async () => {
      const actual = '这是应该输出地内容\n'
      const failures = await validateMatch(actual, expected, {
        input: { diff: expectedDiff }
      })
      expect(failures).toHaveLength(0)
    })

    it('should match original content by making expectedDiff optional', async () => {
      const actual = '这是应该输出的内容'
      const failures = await validateMatch(actual, expected, {
        input: { diff: expectedDiff }
      })
      expect(failures).toHaveLength(0)
    })

    it('should pass on equality even if diff: true is set', async () => {
      const failures = await validateMatch('hello', 'hello', {
        input: { diff: true }
      })
      expect(failures).toHaveLength(0)
    })

    it('should fail if a required diff item is missing', async () => {
      const actual = 'abc' // missing the 'd' that is required
      const failures = await validateMatch(actual, 'abc', {
        input: {
          diff: [{ value: 'd', added: true, required: true }]
        }
      })
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('missing required diff items: +"d"')
    })

    it('should pass if a required diff item is present', async () => {
      const actual = 'abcd'
      const failures = await validateMatch(actual, 'abc', {
        input: {
          diff: [{ value: 'd', added: true, required: true }]
        }
      })
      expect(failures).toHaveLength(0)
    })

    it('should fail on unverified changes by default (whitelist mode)', async () => {
      const actual = 'abcde'
      const failures = await validateMatch(actual, 'abc', {
        input: {
          diff: [{ value: 'd', added: true }]
        }
      })
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toContain('unverified changes')
    })

    it('should pass on unverified changes if diffPermissive is true', async () => {
      const actual = 'abcde'
      const failures = await validateMatch(actual, 'abc', {
        input: {
          diff: [{ value: 'd', added: true }],
          diffPermissive: true
        }
      })
      expect(failures).toHaveLength(0)
    })

    it('should support diff options as an object', async () => {
      const actual = 'abcde'
      const failures = await validateMatch(actual, 'abc', {
        input: {
          diff: {
            items: [{ value: 'd', added: true }],
            permissive: true
          }
        }
      })
      expect(failures).toHaveLength(0)
    })
  })
})
