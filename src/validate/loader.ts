import { pathToFileURL } from 'node:url'
import { join, isAbsolute } from 'node:path'
import { camelCase } from 'lodash-es'
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
    const fixture: any = {
      ...(ctx.input && typeof ctx.input === 'object'
        ? ctx.input
        : { input: ctx.input }),
      $data: ctx.data,
      $validate: (act: any, exp: any) => validateMatch(act, exp, ctx),
    }

    let options: any
    if (
      expected !== null &&
      typeof expected === 'object' &&
      '$value' in expected
    ) {
      options = { ...expected }
      delete options.$value
      expected = expected.$value
    }
    fixture.$options = options

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
 * Loads operators from a record of strings or handlers, or an array of strings.
 * Strings are treated as module paths with optional export names (e.g., "js://./utils.js#myOp").
 * If an array is provided, names are inferred from the paths or export names.
 */
export async function loadOperators(
  operators:
    | Record<string, string | ValidationOperatorHandler | CustomOperatorHandler>
    | (string | ValidationOperatorHandler | CustomOperatorHandler)[],
  baseDir?: string
): Promise<Record<string, ValidationOperatorHandler>> {
  const result: Record<string, ValidationOperatorHandler> = {}
  if (!operators) return result

  const opEntries = Array.isArray(operators)
    ? operators
        .map((v, index) => {
          if (!v) return null
          let name = ''
          if (typeof v === 'string') {
            const filename = v.split('#')[0].split('/').pop() || ''
            const part =
              v.split('#')[1] ||
              camelCase(filename.replace(/\.(js|ts|mjs|cjs|jsx|tsx)$/, ''))
            name = part || ''
          } else if (typeof v === 'function') {
            name = v.name || `op${index}`
          }
          if (name && !name.startsWith('$')) {
            name = '$' + name
          }
          return name ? ([name, v] as [string, any]) : null
        })
        .filter((entry): entry is [string, any] => !!entry)
    : Object.entries(operators)

  for (let [name, value] of opEntries) {
    if (!name.startsWith('$')) {
      name = '$' + name
    }
    if (typeof value === 'function') {
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

      const moduleName = name.startsWith('$') ? name.slice(1) : name
      const handler = exportName
        ? module[exportName]
        : typeof module.default === 'function'
          ? module.default
          : module[moduleName] || module.default

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
