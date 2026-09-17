import { createYamlObjectTag } from '@isdk/ai-tool'
import { AjvSchemaType } from '../match-ex/ajv-schema.js'

/**
 * YAML-flavoured JSON Schema type.
 *
 * The class itself carries only the YAML identity (the `!json-schema` tag name);
 * all schema compilation/validation logic comes from {@link AjvSchemaType}.
 * This keeps YAML — a runner-level fixture concern — out of the matching engine.
 */
export class YamlTypeJsonSchema extends AjvSchemaType {
  /** The standard YAML tag name for this type. */
  static YAMLTag = '!json-schema';
}

/**
 * The YAML object tag definition for registering with a YAML parser.
 */
export const yamlJsonSchemaTag = createYamlObjectTag(
  YamlTypeJsonSchema.YAMLTag,
  // `YamlTypeBaseObject` declares a `[name: string]: any` index signature which
  // `AjvSchemaType` intentionally does not have; the tag only needs the
  // constructor signature, so the cast is safe here.
  YamlTypeJsonSchema as any
)
