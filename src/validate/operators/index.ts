import { ValidationOperatorHandler, ValidateMatchFn, ValidationContext } from '../types.js'
import { validateAnd } from './and.js'
import { validateOr } from './or.js'
import { validateContains } from './contains.js'
import { validateAll } from './all.js'
import { validateSequence } from './sequence.js'
import { validateNot } from './not.js'
import { validateSchemaOperator } from './schema.js'
import { validateExists } from './exists.js'
import { validateExpect } from './expect.js'
import { validateDiff } from './diff.js'

/** Map of supported collection validation operators. */
export const OPERATORS: Record<
  string,
  (
    actual: any,
    expected: any,
    ctx: ValidationContext,
    validateMatch: ValidateMatchFn
  ) => Promise<any[]>
> = {
  $and: validateAnd,
  $or: validateOr,
  $contains: validateContains,
  $all: validateAll,
  $sequence: validateSequence,
  $not: validateNot,
  $schema: validateSchemaOperator,
  $exists: validateExists,
  $expect: validateExpect,
  $diff: validateDiff,
}

export { validateAnd } from './and.js'
export { validateOr } from './or.js'
export { validateContains } from './contains.js'
export { validateAll } from './all.js'
export { validateSequence } from './sequence.js'
export { validateNot } from './not.js'
export { validateSchemaOperator } from './schema.js'
export { validateExists } from './exists.js'
export { validateExpect } from './expect.js'
export { validateDiff } from './diff.js'
