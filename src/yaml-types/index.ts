/**
 * Exports JSON Schema YAML type and related utilities.
 * Automatically registers the `!json-schema` tag when imported.
 */

import { registerYamlTag } from '@isdk/ai-tool'
import { yamlJsonSchemaTag } from './json-schema.js'

export * from './json-schema.js'

registerYamlTag(yamlJsonSchemaTag)
