// Importing the plugin packages registers the template and JSON Schema
// implementations into @isdk/match-ex, preserving the out-of-the-box behavior
// this package had before the engine was extracted.
import '@isdk/match-ex-schema'
import '@isdk/match-ex-template'

export * from './types.js'
export * from './ai-test-runner.js'
export * from '@isdk/match-ex'
export * from '@isdk/match-ex/loader'
export * from './yaml-types/index.js'
