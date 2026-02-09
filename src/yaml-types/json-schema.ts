import { Ajv, ValidateFunction } from 'ajv'
import ajvKeywords from 'ajv-keywords'
import ajvFormats from 'ajv-formats'
import { createYamlObjectTag, YamlTypeBaseObject } from '@isdk/ai-tool'

/**
 * Global Ajv instance used for schema compilation.
 * Configured with `strictSchema: false` to allow for flexible YAML-based schemas.
 */
const ajv = new Ajv({ strictSchema: false })

// @ts-expect-error "typeof ajvKeywords"
ajvKeywords(ajv)
// @ts-expect-error "typeof ajvFormats"
ajvFormats(ajv)

/** Symbol for storing the compiled validation function privately on instances. */
const ValidateSymbol = Symbol('validate')

/**
 * Represents a YAML-compatible JSON Schema object.
 * When used with the `!json-schema` tag, it allows defining expectations 
 * that are automatically compiled into Ajv validation functions.
 * 
 * @example
 * ```yaml
 * output: !json-schema
 *   type: object
 *   properties:
 *     name: { type: string }
 * ```
 */
export class YamlTypeJsonSchema extends YamlTypeBaseObject {
  /** The standard YAML tag name for this type. */
  static YAMLTag = '!json-schema';

  /** @internal Compiled Ajv validation function. */
  declare [ValidateSymbol]: ValidateFunction<any>

  /**
   * Type guard to check if an object is an instance of YamlTypeJsonSchema.
   * Handles cases where the object might come from a different module instance 
   * by checking the constructor's static YAMLTag.
   *
   * @param obj - The object to check.
   * @returns True if the object is a YamlTypeJsonSchema.
   */
  static isInstance(obj: any): obj is YamlTypeJsonSchema {
    if (!obj || typeof obj !== 'object') return false
    let result = obj instanceof YamlTypeJsonSchema
    if (!result) {
      result = obj.constructor.YAMLTag === YamlTypeJsonSchema.YAMLTag
    }
    return result
  }

  /**
   * Ensures a value is a YamlTypeJsonSchema instance.
   * If the input is already an instance, it's returned as-is; 
   * otherwise, a new instance is created from the provided schema object.
   *
   * @param schema - A raw schema object or an existing YamlTypeJsonSchema instance.
   * @returns A YamlTypeJsonSchema instance.
   */
  static create(schema?: any): YamlTypeJsonSchema {
    if (!(schema instanceof YamlTypeJsonSchema)) {
      schema = new YamlTypeJsonSchema(schema)
    }
    return schema
  }

  /**
   * Static helper to validate data against a schema.
   *
   * @param schema - The schema to use (will be converted via `.create()` if needed).
   * @param data - The data to validate.
   * @returns True if the data is valid according to the schema.
   */
  static validate(schema: any, data: any) {
    if (!(schema instanceof YamlTypeJsonSchema)) {
      schema = new YamlTypeJsonSchema(schema)
    }
    return schema[ValidateSymbol](data)
  }

  /**
   * Static helper to retrieve AJV validation errors from a schema instance.
   *
   * @param schema - The schema instance to get errors from.
   * @returns An array of AJV error objects, or undefined if no errors exist.
   */
  static getErrors(schema: YamlTypeJsonSchema) {
    return schema[ValidateSymbol].errors
  }

  /**
   * Initializes a new YamlTypeJsonSchema instance and compiles the schema using Ajv.
   *
   * @param options - The raw JSON Schema definition properties.
   */
  constructor(options?: any) {
    super(options)

    Object.defineProperty(this, ValidateSymbol, {
      writable: false,
      enumerable: false,
      value: ajv.compile<any>(this.toJSON()),
    })
  }

  /**
   * Converts the instance to a plain JSON object suitable for Ajv compilation.
   * Filters out internal properties (starting with '_') inherited from YamlTypeBaseObject.
   *
   * @returns A plain JSON representation of the schema.
   */
  toJSON() {
    // filter private properties
    const result = Object.fromEntries(
      Object.entries(this).filter(([k]) => !k.startsWith('_'))
    )
    return result
  }

  /**
   * Validates data against this specific schema instance.
   *
   * @param data - The data to validate.
   * @returns True if the data is valid.
   */
  validate(data: any) {
    return this[ValidateSymbol](data)
  }

  /**
   * Returns AJV validation errors for the last `validate()` call on this instance.
   *
   * @returns An array of Ajv error objects or null if no validation has occurred or passed.
   */
  getErrors() {
    return this[ValidateSymbol].errors
  }
}

/** The YAML object tag definition for registering with a YAML parser. */
export const yamlJsonSchemaTag = createYamlObjectTag(
  YamlTypeJsonSchema.YAMLTag,
  YamlTypeJsonSchema
)