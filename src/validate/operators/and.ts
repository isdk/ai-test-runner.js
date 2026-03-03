import { ValidationResult } from '../../types.js'
import { ValidationContext, ValidateMatchFn, MatchResult } from '../types.js'
import { getStrategy } from '../strategies.js'

/**
 * Validates that a value matches ALL specified expectations.
 * 
 * @param actual - The value to validate.
 * @param expectedList - Array of expectations.
 * @param ctx - Validation context.
 * @param validateMatch - Recursive validation function.
 */
export async function validateAnd(
  actual: any,
  expectedList: any[],
  ctx: ValidationContext,
  validateMatch: ValidateMatchFn
): Promise<ValidationResult> {
  if (!Array.isArray(expectedList)) {
    return {
      score: 0,
      pass: false,
      message: '$and operator requires an array of expectations',
    }
  }

  const explicitWeights = expectedList.map((item) =>
    item && typeof item === 'object' && item.score !== undefined
      ? item.score
      : null
  )

  const strategy = ctx.strategy || getStrategy('weighted')
  const weights = strategy.distribute(explicitWeights, {
    totalUnassignedWeight: ctx.unassignedWeight,
    maxScore: ctx.maxScore,
  })

  const results: MatchResult[] = []

  for (let i = 0; i < expectedList.length; i++) {
    /**
     * 【业务逻辑保留理由】
     * 显式创建包含 $and[i] 的子上下文。
     * 由于 $and 在核心引擎中被标记为透明（Transparent），它本身不会增加路径层级。
     * 我们在这里手动增加索引，既能保证路径简洁（避免 output.$and.$and[0]），
     * 又能在报错时准确指出是哪一个分支失败（output.$and[0]）。
     */
    const subCtx = ctx.createSubContext(`$and[${i}]`)
    subCtx.allocatedScore = weights[i] * ctx.allocatedScore
    const res = await validateMatch(actual, expectedList[i], subCtx)
    results.push(res)
  }

  return strategy.aggregate(results, weights)
}
