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
    expect(failures[0].message).toContain('$contains requires an array')
  })

  // --- New tests for updated 'expects' logic ---
  describe('operator requires array actual', () => {
    // Dummy operator for testing expects as array
    const dummyArrayExpectsOperator: ValidationOperatorHandler & { expects?: string[] | string } = async (actual, expected, ctx, validateMatch) => {
      // This operator expects an array and will simply pass if actual is an array
      if (Array.isArray(actual)) {
        ctx.earnedScore = ctx.allocatedScore;
      } else {
        ctx.addFailure({
          message: 'Dummy operator internal failure: expected array',
          expected: 'array',
          actual: typeof actual
        });
      }
      return ctx.failures;
    };
    dummyArrayExpectsOperator.expects = ['array']; // Explicitly set expects as an array, covering the new core.ts logic

    const dummyStringExpectsOperator: ValidationOperatorHandler & { expects?: string[] | string } = async (actual, expected, ctx, validateMatch) => {
      if (typeof actual === 'string') {
        ctx.earnedScore = ctx.allocatedScore;
      } else {
        ctx.addFailure({
          message: 'Dummy operator internal failure: expected string',
          expected: 'string',
          actual: typeof actual
        });
      }
      return ctx.failures;
    };
    dummyStringExpectsOperator.expects = 'string'; // Explicitly set expects as a string


    it('should fail with correct message when $all is used on non-array actual', async () => {
      const failures = await validateMatch({ a: 1 }, { $all: [1] });
      expect(failures).toHaveLength(1);
      expect(failures[0].message).toContain('$all requires an array');
    });

    it('should fail with correct message when $sequence is used on non-array actual', async () => {
      const failures = await validateMatch({ a: 1 }, { $sequence: [1] });
      expect(failures).toHaveLength(1);
      expect(failures[0].message).toContain('$sequence requires an array');
    });

    it('should pass if custom operator with expects = ["array"] is used on array actual', async () => {
      const failures = await validateMatch([1, 2, 3], { $customArrayOp: 'any' }, {
        operators: {
          $customArrayOp: dummyArrayExpectsOperator
        }
      });
      expect(failures).toHaveLength(0);
    });

    it('should fail if custom operator with expects = ["array"] is used on non-array actual', async () => {
      const failures = await validateMatch({ a: 1 }, { $customArrayOp: 'any' }, {
        operators: {
          $customArrayOp: dummyArrayExpectsOperator
        }
      });
      expect(failures).toHaveLength(1);
      // The message comes from core.ts's 'needsArray' check
      expect(failures[0].message).toContain('$customArrayOp requires an array');
    });

    // Test that the 'requires an array' check is NOT triggered if 'expects' is not related to 'array'
    it('should NOT fail with "requires an array" message if custom operator expects string and gets non-string', async () => {
      const failures = await validateMatch([1, 2], { $customStringOp: 'world' }, {
        operators: {
          $customStringOp: dummyStringExpectsOperator
        }
      });
      expect(failures).toHaveLength(1);
      // The failure message should come from the dummy operator's internal check, not core.ts's 'requires an array'
      expect(failures[0].message).toContain('Dummy operator internal failure: expected string');
      expect(failures[0].message).not.toContain('requires an array');
    });
  });
  // --- End new tests ---


  describe('$schema', () => {
    it('should validate using $schema operator', async () => {
      const failures = await validateMatch(123, { $schema: { type: 'number' } })
      expect(failures).toHaveLength(0)

      const failures2 = await validateMatch('abc', { $schema: { type: 'number' } })
      expect(failures2).toHaveLength(1)
      expect(failures2[0].message).toBe('JSON Schema validation failed')
    })

    it('should support templates in $schema operator', async () => {
      const failures = await validateMatch('AI', { 
        $schema: { type: 'string', pattern: '^{{prefix}}' } 
      }, { data: { prefix: 'AI' } })
      expect(failures).toHaveLength(0)
    })

    it('should validate complex objects with $schema', async () => {
      const actual = { id: 1, name: 'Alice' }
      const schema = {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' }
        }
      }
      const failures = await validateMatch(actual, { $schema: schema })
      expect(failures).toHaveLength(0)
    })

    it('should work with $not and $schema combined', async () => {
      const failures = await validateMatch(123, { $not: { $schema: { type: 'string' } } })
      expect(failures).toHaveLength(0)

      const failures2 = await validateMatch('abc', { $not: { $schema: { type: 'string' } } })
      expect(failures2).toHaveLength(1)
      expect(failures2[0].message).toContain('$not mismatch')
    })

    it('should support $schema nested inside an object', async () => {
      const actual = {
        user: { id: 123, tags: ['a', 'b'] }
      }
      const expected = {
        user: {
          id: 123,
          tags: { $schema: { type: 'array', minItems: 2 } }
        }
      }
      const failures = await validateMatch(actual, expected)
      expect(failures).toHaveLength(0)
    })
  })
})
