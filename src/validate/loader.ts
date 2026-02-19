import { pathToFileURL } from 'node:url'
import { join, isAbsolute } from 'node:path'
import { ValidationOperatorHandler, ValidationContext } from './types.js'

export type CustomOperatorHandler = (
  actual: any,
  expected: any,
  fixture: any
) => Promise<boolean | string> | boolean | string

/**
 * Wraps a custom operator handler to match the internal ValidationOperatorHandler signature.
 */
export function wrapCustomOperator(
  handler: CustomOperatorHandler
): ValidationOperatorHandler {
  return async (actual, expected, ctx, validateMatch) => {
    const fixture = {
      ...(ctx.input && typeof ctx.input === 'object'
        ? ctx.input
        : { input: ctx.input }),
      $data: ctx.data,
      $validate: (act: any, exp: any) => validateMatch(act, exp, ctx),
    }
    const result = await handler(actual, expected, fixture)
    if (result !== true) {
      ctx.addFailure({
        message:
          typeof result === 'string'
            ? result
            : 'Custom operator validation failed',
        expected,
        actual,
      })
    }
    return ctx.failures
  }
}

/**
 * Loads operators from a record of strings or handlers.
 * Strings are treated as module paths with optional export names (e.g., "js://./utils.js#myOp").
 */
export async function loadOperators(
  operators: Record<
    string,
    string | ValidationOperatorHandler | CustomOperatorHandler
  >,
  baseDir?: string
): Promise<Record<string, ValidationOperatorHandler>> {
  const result: Record<string, ValidationOperatorHandler> = {}

  for (const [name, value] of Object.entries(operators)) {
    if (typeof value === 'function') {
      // It's already a function, we need to check if it's a standard or custom handler.
      // We'll assume if it takes 3 or 4 arguments it's a standard handler,
      // otherwise it's a custom one. But that's risky.
      // Let's assume for now all provided functions via options are custom handlers
      // unless they specifically match the internal signature.
      // Actually, standard handlers take 4 arguments (actual, expected, ctx, validateMatch).
      if (value.length === 4) {
        result[name] = value as ValidationOperatorHandler
      } else {
        result[name] = wrapCustomOperator(value as CustomOperatorHandler)
      }
    } else if (typeof value === 'string') {
      let url = value
      if (url.startsWith('js://')) {
        url = url.slice(5)
      }

      let [path, exportName] = url.split('#')
      let module: any
      if (path.startsWith('./') || path.startsWith('../')) {
        if (baseDir) {
          path = join(baseDir, path)
        }
        const fileUrl = pathToFileURL(path).href
        module = await import(fileUrl)
      } else if (isAbsolute(path)) {
        const fileUrl = pathToFileURL(path).href
        module = await import(fileUrl)
      } else {
        // Assume npm package or absolute path without file://
        module = await import(path)
      }

      const handler = exportName ? module[exportName] : module.default

      if (typeof handler !== 'function') {
        throw new Error(`Operator ${name} at ${value} is not a function`)
      }

      if (handler.length === 4) {
        result[name] = handler as ValidationOperatorHandler
      } else {
        result[name] = wrapCustomOperator(handler as CustomOperatorHandler)
      }
    }
  }

  return result
}
