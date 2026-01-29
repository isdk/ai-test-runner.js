import { Ajv, ValidateFunction } from 'ajv'
import ajvKeywords from 'ajv-keywords'
import ajvFormats from 'ajv-formats'
import { createYamlObjectTag, YamlTypeBaseObject } from '@isdk/ai-tool'

const ajv = new Ajv({ strictSchema: false })

// @ts-expect-error "typeof ajvKeywords"
ajvKeywords(ajv)
// @ts-expect-error "typeof ajvFormats"
ajvFormats(ajv)

const ValidateSymbol = Symbol('validate')

/**
 * Represents a YAML tag for JSON Schema validation.
 * Used to define expectations using standard JSON Schema.
 */
export class YamlTypeJsonSchema extends YamlTypeBaseObject {
  /** The YAML tag associated with this type. */
  static YAMLTag = '!json-schema';
  declare [ValidateSymbol]: ValidateFunction<any>

  /**
   * Checks if an object is an instance of YamlTypeJsonSchema.
   *
   * @param obj - The object to check.
   * @returns True if the object is a YamlTypeJsonSchema instance.
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
   * Creates a YamlTypeJsonSchema instance from a schema object.
   *
   * @param schema - The JSON Schema object.
   * @returns A YamlTypeJsonSchema instance.
   */
  static create(schema?: any): YamlTypeJsonSchema {
    if (!(schema instanceof YamlTypeJsonSchema)) {
      schema = new YamlTypeJsonSchema(schema)
    }
    return schema
  }

  /**
   * Validates data against a schema.
   *
   * @param schema - The YamlTypeJsonSchema or schema object.
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
   * Retrieves validation errors from a schema instance.
   *
   * @param schema - The YamlTypeJsonSchema instance.
   * @returns An array of AJV error objects, or undefined if no errors.
   */
  static getErrors(schema: YamlTypeJsonSchema) {
    return schema[ValidateSymbol].errors
  }

  /**
   * Initializes a new YamlTypeJsonSchema.
   *
   * @param options - Schema configuration.
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
   * Converts the schema to a plain JSON object, filtering out private properties.
   *
   * @returns The JSON representation of the schema.
   */
  toJSON() {
    // filter private properties
    const result = Object.fromEntries(
      Object.entries(this).filter(([k]) => !k.startsWith('_'))
    )
    return result
  }

  /**
   * Validates data against this schema instance.
   *
   * @param data - The data to validate.
   * @returns True if valid.
   */
  validate(data: any) {
    return this[ValidateSymbol](data)
  }

  /**
   * Returns validation errors for the last validation call on this instance.
   *
   * @returns An array of error objects or null.
   */
  getErrors() {
    return this[ValidateSymbol].errors
  }
}

export const yamlJsonSchemaTag = createYamlObjectTag(
  YamlTypeJsonSchema.YAMLTag,
  YamlTypeJsonSchema
)
