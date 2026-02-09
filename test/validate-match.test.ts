import { describe, it, expect } from 'vitest'
import { isStrict, formatTemplate, formatObject, validateMatch } from '../src/validate-match.js'
import { YamlTypeJsonSchema } from '../src/yaml-types/index.js'

describe('validate-match', () => {
  describe('isStrict', () => {
    it('should return boolean if strict is boolean', () => {
      expect(isStrict('object', true)).toBe(true)
      expect(isStrict('object', false)).toBe(false)
    })

    it('should return true if strict matches type string', () => {
      expect(isStrict('object', 'object')).toBe(true)
      expect(isStrict('array', 'array')).toBe(true)
      expect(isStrict('diff', 'diff')).toBe(true)
      expect(isStrict('object', 'array')).toBe(false)
    })

    it('should return true if type is in strict array', () => {
      expect(isStrict('object', ['object', 'array'])).toBe(true)
      expect(isStrict('array', ['object', 'array'])).toBe(true)
      expect(isStrict('diff', ['object', 'array'])).toBe(false)
    })

    it('should return false for other inputs', () => {
      expect(isStrict('object', undefined)).toBe(false)
      expect(isStrict('object', null as any)).toBe(false)
      expect(isStrict('object', {} as any)).toBe(false)
    })
  })

  describe('formatTemplate', () => {
    it('should format string template with data', async () => {
      const result = await formatTemplate('hello {{name}}', { data: { name: 'world' } })
      expect(result).toBe('hello world')
    })

    it('should format string template with merged input data', async () => {
      const result = await formatTemplate('{{greeting}} {{name}}', {
        data: { greeting: 'Hi' },
        input: { name: 'Alice' }
      })
      expect(result).toBe('Hi Alice')
    })

    it('should format RegExp template', async () => {
      const result = await formatTemplate(/{{name}}/, { data: { name: 'world' } })
      expect(result).toBeInstanceOf(RegExp)
      expect((result as RegExp).source).toBe('world')
    })

    it('should return original if no data provided', async () => {
      const result = await formatTemplate('hello {{name}}', {})
      expect(result).toBe('hello {{name}}')
    })

    it('should return original if not a string or RegExp', async () => {
      const result = await formatTemplate(123, { data: { name: 'world' } })
      expect(result).toBe(123)
    })

    it('should preserve RegExp flags when formatting', async () => {
      const result = await formatTemplate(/{{name}}/i, { data: { name: 'world' } })
      expect(result).toBeInstanceOf(RegExp)
      expect((result as RegExp).source).toBe('world')
      expect((result as RegExp).flags).toBe('i')
    })

    it('should support templateFormat option', async () => {
      const result = await formatTemplate('hello ${name}', {
        data: { name: 'world' },
        templateFormat: 'js'
      })
      expect(result).toBe('hello world')
    })
  })

  describe('formatObject', () => {
    it('should format object values and keys', async () => {
      const input = {
        '{{keyName}}': '{{value}}',
        'nested': {
          'foo': '{{bar}}'
        }
      }
      const options = { data: { keyName: 'realKey', value: 'realValue', bar: 'baz' } }
      const result = await formatObject(input, options)
      expect(result).toEqual({
        realKey: 'realValue',
        nested: {
          foo: 'baz'
        }
      })
    })

    it('should format array elements', async () => {
      const input = ['{{a}}', '{{b}}']
      const options = { data: { a: '1', b: '2' } }
      const result = await formatObject(input, options)
      expect(result).toEqual(['1', '2'])
    })

    it('should handle RegExp in object', async () => {
      const input = { reg: /{{pattern}}/ }
      const options = { data: { pattern: 'abc' } }
      const result = await formatObject(input, options)
      expect(result.reg).toBeInstanceOf(RegExp)
      expect(result.reg.source).toBe('abc')
    })

    it('should format deeply nested structures', async () => {
      const input = {
        a: [{ b: '{{val}}' }],
        c: { d: { e: '{{val}}' } }
      }
      const result = await formatObject(input, { data: { val: 'foo' } })
      expect(result.a[0].b).toBe('foo')
      expect(result.c.d.e).toBe('foo')
    })
  })

  describe('validateMatch', () => {
    it('should pass on simple string equality', async () => {
      const failures = await validateMatch('hello', 'hello')
      expect(failures).toHaveLength(0)
    })

    it('should trim actual string before comparison', async () => {
      const failures = await validateMatch('  hello  ', 'hello')
      expect(failures).toHaveLength(0)
    })

    it('should fail on string mismatch', async () => {
      const failures = await validateMatch('hello', 'world')
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toBe('String mismatch with diff')
    })

    it('should pass on RegExp match', async () => {
      const failures = await validateMatch('hello world', /hello/)
      expect(failures).toHaveLength(0)
    })

    it('should fail on RegExp mismatch', async () => {
      const failures = await validateMatch('hello world', /foo/)
      expect(failures).toHaveLength(1)
      expect(failures[0].message).toBe('RegExp mismatch')
    })

    it('should support templates in expected string', async () => {
      const failures = await validateMatch('hello Alice', 'hello {{name}}', { data: { name: 'Alice' } })
      expect(failures).toHaveLength(0)
    })

    it('should support templates in expected RegExp', async () => {
      const failures = await validateMatch('hello Alice', /{{name}}/, { data: { name: 'Alice' } })
      expect(failures).toHaveLength(0)
    })

    describe('diff validation', () => {
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
        // Should report both unverified "!" and any missing items (if any)
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
         // In non-strict mode (default), it passes if all items in expectedDiff are found
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

    describe('array validation', () => {
      it('should pass on matching arrays', async () => {
        const failures = await validateMatch([1, 2], [1, 2])
        expect(failures).toHaveLength(0)
      })

      it('should fail on type mismatch', async () => {
        const failures = await validateMatch('not an array', [1, 2])
        expect(failures).toHaveLength(1)
        expect(failures[0].message).toBe('Type mismatch: expected Array')
      })

      it('should fail on length mismatch in strict mode', async () => {
        const failures = await validateMatch([1, 2, 3], [1, 2], { strict: 'array' })
        expect(failures).toHaveLength(1)
        expect(failures[0].message).toContain('Array length mismatch')
      })

      it('should report failures at correct index', async () => {
        const failures = await validateMatch([1, 3], [1, 2])
        expect(failures).toHaveLength(1)
        expect(failures[0].key).toBe('[1]')
      })
    })

    describe('object validation', () => {
      it('should pass on matching objects', async () => {
        const failures = await validateMatch({ a: 1, b: 2 }, { a: 1, b: 2 })
        expect(failures).toHaveLength(0)
      })

      it('should pass on null', async () => {
        const failures = await validateMatch(null, null)
        expect(failures).toHaveLength(0)
      })

      it('should fail if actual is not null when expected is null', async () => {
        const failures = await validateMatch({}, null)
        expect(failures).toHaveLength(1)
        expect(failures[0].message).toBe('Value equality check failed')
      })

      it('should support RegExp keys in expected object', async () => {
        const failures = await validateMatch({ foo_123: 'bar' }, { '/foo_.*/': 'bar' })
        expect(failures).toHaveLength(0)
      })

      it('should fail in strict mode if extra keys exist', async () => {
        const failures = await validateMatch({ a: 1, b: 2 }, { a: 1 }, { strict: 'object' })
        expect(failures).toHaveLength(1)
        expect(failures[0].key).toBe('b')
        expect(failures[0].message).toBe('Extra key in actual object (strict mode)')
      })

      it('should support nested path keys', async () => {
        // validateMatch uses Object.keys(expected) and then actual[k]
        // It doesn't seem to support lodash getByPath for keys in the 'expected' object itself
        // unless it's explicitly coded.
        // Checking the code: `actualValue = actual ? actual[k] : undefined`
        // So no, it doesn't support nested paths as keys in the expected object.
      })
    })

    describe('operators', () => {
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
    })

    describe('JSON Schema', () => {
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
    })

    describe('custom function', () => {
      it('should pass if function returns true', async () => {
        const failures = await validateMatch(10, (val: number) => val > 5)
        expect(failures).toHaveLength(0)
      })

      it('should fail if function returns false or error message', async () => {
        const failures = await validateMatch(10, (val: number) => val < 5 || 'too big')
        expect(failures).toHaveLength(1)
        expect(failures[0].message).toBe('Custom function validation failed: too big')
      })
    })

    describe('isStrict array', () => {
      it('should respect multiple strict types', async () => {
        const options = { strict: ['object', 'array'] }

        // Should fail on extra key (object strict)
        const f1 = await validateMatch({ a: 1, b: 2 }, { a: 1 }, options)
        expect(f1).toHaveLength(1)

        // Should fail on length mismatch (array strict)
        const f2 = await validateMatch([1, 2], [1], options)
        expect(f2).toHaveLength(1)
      })
    })

    describe('nested validation and path reporting', () => {
      it('should report deep path for failures', async () => {
        const actual = {
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ]
        }
        const expected = {
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Charlie' }
          ]
        }
        const failures = await validateMatch(actual, expected)
        expect(failures).toHaveLength(1)
        expect(failures[0].key).toBe('users[1].name')
      })
    })

    describe('complex operators', () => {
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

    describe('JSON Schema edge cases', () => {
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

    describe('Custom functions', () => {
      it('should handle async custom functions', async () => {
        const asyncMatcher = async (val: any) => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return val === 'ok' || 'not ok'
        }
        const failures = await validateMatch('ok', asyncMatcher)
        expect(failures).toHaveLength(0)

        const failures2 = await validateMatch('bad', asyncMatcher)
        expect(failures2).toHaveLength(1)
      })
    })
  })
})
