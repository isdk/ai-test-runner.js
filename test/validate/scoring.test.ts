import { describe, it, expect, beforeEach } from 'vitest';
import { processValidationResult } from '../../src/validate/utils.js';
import { ValidationContext } from '../../src/validate/types.js';
import { AIValidationFailure } from '../../src/types.js';

describe('processValidationResult', () => {
  let ctx: ValidationContext;
  let expected: any;
  let actual: any;

  beforeEach(() => {
    ctx = new ValidationContext({ allocatedScore: 100 });
    expected = 'someExpectedValue';
    actual = 'someActualValue';
  });

  // Helper to assert common properties
  const assertResult = (
    actualProcessResult: boolean, // The actual boolean return value from processValidationResult
    expectedPassed: boolean,     // What we expect processValidationResult to return
    earnedScore: number,
    failureCount: number,
    message?: string,
    failureKey?: string
  ) => {
    expect(actualProcessResult).toBe(expectedPassed);
    expect(ctx.earnedScore).toBeCloseTo(earnedScore);
    expect(ctx.failures.length).toBe(failureCount);
    if (failureCount > 0) {
      expect(ctx.failures[0].message).toContain(message);
      expect(ctx.failures[0].key).toBe(failureKey !== undefined ? failureKey : '');
    }
  };

  it('should handle boolean true correctly', () => {
    const result = processValidationResult(true, expected, actual, ctx);
    assertResult(result, true, 100, 0);
  });

  it('should handle boolean false correctly', () => {
    const result = processValidationResult(false, expected, actual, ctx);
    assertResult(result, false, 0, 1, 'Validation failed');
  });

  it('should handle string message for failure correctly', () => {
    const result = processValidationResult('Error message', expected, actual, ctx);
    assertResult(result, false, 0, 1, 'Error message');
  });

  it('should handle number (score 0-1) correctly without threshold', () => {
    const result = processValidationResult(0.75, expected, actual, ctx);
    assertResult(result, true, 75, 0);
  });

  it('should handle number (score 0-1) with threshold - pass', () => {
    ctx.threshold = 0.5;
    const result = processValidationResult(0.6, expected, actual, ctx);
    assertResult(result, true, 60, 0);
  });

  it('should handle number (score 0-1) with threshold - fail', () => {
    ctx.threshold = 0.8;
    const result = processValidationResult(0.7, expected, actual, ctx);
    assertResult(result, false, 70, 1, 'Score 0.70 is below threshold 0.8');
  });

  it('should handle object { score: number } without threshold', () => {
    const result = processValidationResult({ score: 0.9 }, expected, actual, ctx);
    assertResult(result, true, 90, 0);
  });

  it('should handle object { score: number, message: string } without threshold', () => {
    const result = processValidationResult({ score: 0.1, message: 'Low score' }, expected, actual, ctx);
    assertResult(result, true, 10, 0); // Still passes if no threshold and score is just low
  });

  it('should handle object { score: number } with threshold - pass', () => {
    ctx.threshold = 0.5;
    const result = processValidationResult({ score: 0.5 }, expected, actual, ctx);
    assertResult(result, true, 50, 0);
  });

  it('should handle object { score: number } with threshold - fail', () => {
    ctx.threshold = 0.7;
    const result = processValidationResult({ score: 0.6 }, expected, actual, ctx);
    assertResult(result, false, 60, 1, 'Score 0.60 is below threshold 0.7');
  });

  it('should handle object { score: number, message: string } with threshold - fail (custom message)', () => {
    ctx.threshold = 0.7;
    const result = processValidationResult({ score: 0.6, message: 'Custom failure message' }, expected, actual, ctx);
    assertResult(result, false, 60, 1, 'Custom failure message');
  });

  it('should handle object { score: number, pass: true } overriding threshold', () => {
    ctx.threshold = 0.9;
    const result = processValidationResult({ score: 0.1, pass: true }, expected, actual, ctx);
    assertResult(result, true, 10, 0);
  });

  it('should handle object { score: number, pass: false } overriding threshold', () => {
    ctx.threshold = 0.1;
    const result = processValidationResult({ score: 0.9, pass: false, message: 'Forced fail' }, expected, actual, ctx);
    assertResult(result, false, 90, 1, 'Forced fail');
  });

  it('should handle unknown result type as failure', () => {
    const result = processValidationResult({ unknown: 'type' }, expected, actual, ctx);
    assertResult(result, false, 0, 1, 'Invalid validation result');
  });

  it('should correctly accumulate failures when key is set in context', () => {
    ctx = new ValidationContext({ allocatedScore: 100, key: 'my.path' });
    const result = processValidationResult(false, expected, actual, ctx);
    assertResult(result, false, 0, 1, 'Validation failed', 'my.path');
  });

  it('should ensure score is clamped between 0 and 1 for number results', () => {
    let result = processValidationResult(1.5, expected, actual, ctx);
    assertResult(result, true, 100, 0);
    ctx = new ValidationContext({ allocatedScore: 100 }); // Reset context
    result = processValidationResult(-0.5, expected, actual, ctx);
    assertResult(result, true, 0, 0); // No failure if score is just low
  });

  it('should ensure score is clamped between 0 and 1 for object results', () => {
    let result = processValidationResult({ score: 1.5 }, expected, actual, ctx);
    assertResult(result, true, 100, 0);
    ctx = new ValidationContext({ allocatedScore: 100 }); // Reset context
    result = processValidationResult({ score: -0.5 }, expected, actual, ctx);
    assertResult(result, true, 0, 0); // No failure if score is just low
  });
});

import { weightedSumStrategy, maxStrategy, getStrategy } from '../../src/validate/strategies.js';

describe('Scoring Strategies', () => {
  let parentCtx: ValidationContext;
  let childCtxs: ValidationContext[];

  beforeEach(() => {
    parentCtx = new ValidationContext({ allocatedScore: 100 });
    childCtxs = [];
  });

  describe('weightedSumStrategy', () => {
    it('should distribute weights equally if no explicit scores', () => {
      const items = [null, null, null];
      const weights = weightedSumStrategy.distribute(items, items.length);
      expect(weights.length).toBe(3);
      expect(weights.every(w => w === 1 / 3)).toBe(true);
    });

    it('should distribute weights based on explicit numeric scores', () => {
      const items = [1, 2, null]; // scores of 1, 2, and default (1)
      // Provide explicit unassignedWeight to avoid default percentage-filling logic
      const weights = weightedSumStrategy.distribute(items, items.length, {maxScore: 4, unassignedWeight: 1 });
      // Total weight (1+2+1) = 4. Weights should be 1/4, 2/4, 1/4
      expect(weights[0]).toBeCloseTo(0.25);
      expect(weights[1]).toBeCloseTo(0.5);
      expect(weights[2]).toBeCloseTo(0.25);
    });

    it('should distribute weights based on explicit AIScoreConfig objects', () => {
      const items = [{ value: 10 }, { value: 20 }, null];
      const weights = weightedSumStrategy.distribute(items, items.length, {maxScore: 31});
      // Total weight (10+20+1) = 31. Weights should be 10/31, 20/31, 1/31
      expect(weights[0]).toBeCloseTo(10 / 31);
      expect(weights[1]).toBeCloseTo(20 / 31);
      expect(weights[2]).toBeCloseTo(1 / 31);
    });

    it('should aggregate by summing child earned scores', () => {
      const child1 = new ValidationContext({ allocatedScore: 50 });
      child1.earnedScore = 40;
      const child2 = new ValidationContext({ allocatedScore: 50 });
      child2.earnedScore = 30;
      childCtxs.push(child1, child2);

      weightedSumStrategy.aggregate(parentCtx, childCtxs);
      expect(parentCtx.earnedScore).toBe(70);
    });
  });

  describe('maxStrategy', () => {
    it('should distribute weights with independent scale', () => {
      const items = [null, null, null];
      const weights = maxStrategy.distribute(items, items.length);
      // In independent scale, default weights are typically 1
      expect(weights.every(w => w === 1)).toBe(true);
    });

    it('should aggregate by taking the maximum child earned score', () => {
      const child1 = new ValidationContext({ allocatedScore: 50 });
      child1.earnedScore = 40; // child1 passed with 80%
      const child2 = new ValidationContext({ allocatedScore: 50 });
      child2.earnedScore = 45; // child2 passed with 90%
      childCtxs.push(child1, child2);

      maxStrategy.aggregate(parentCtx, childCtxs);
      expect(parentCtx.earnedScore).toBe(45);
    });
  });

  describe('getStrategy', () => {
    it('should return weightedSumStrategy for "weighted" or unknown names', () => {
      expect(getStrategy('weighted')).toBe(weightedSumStrategy);
      expect(getStrategy('and')).toBe(weightedSumStrategy); // Alias
      expect(getStrategy('unknown')).toBe(weightedSumStrategy);
      expect(getStrategy(undefined)).toBe(weightedSumStrategy);
    });

    it('should return maxStrategy for "max" or "or" names', () => {
      expect(getStrategy('max')).toBe(maxStrategy);
      expect(getStrategy('or')).toBe(maxStrategy); // Alias
    });
  });
});
