/**
 * Exports JSON Schema YAML type and related utilities.
 * Automatically registers the `!json-schema` tag when imported.
 */

import { registerYamlTag } from '@isdk/ai-tool'
import { JsonSchemaType } from '../validate/schema-type.js'
import { YamlTypeJsonSchema, yamlJsonSchemaTag } from './json-schema.js'

export * from './json-schema.js'

/**
 * `createYamlObjectTag` identifies nodes with `instanceof`, which would miss
 * schema instances produced by a different `JsonSchemaType` subclass
 * (e.g. `AjvSchemaType`). Broadening it keeps `stringifyYaml` working for any
 * schema instance created by the matching engine.
 */
yamlJsonSchemaTag.identify = (o: any) => JsonSchemaType.isInstance(o)

registerYamlTag(yamlJsonSchemaTag)
