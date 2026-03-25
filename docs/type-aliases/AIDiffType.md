[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AIDiffType

# Type Alias: AIDiffType

> **AIDiffType** = `"auto"` \| `"chars"` \| `"words"` \| `"wordsWithSpace"` \| `"lines"` \| `"sentences"` \| `"json"`

Defined in: [ai-tools/packages/ai-test-runner/src/types.ts:43](https://github.com/isdk/ai-test-runner.js/blob/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd/src/types.ts#L43)

Supported diff strategies for string comparison.
- `auto`: Automatically detect the best diff strategy based on content.
- `chars`: Character-level diffing.
- `words`: Word-level diffing (ignoring whitespace).
- `wordsWithSpace`: Word-level diffing (including whitespace).
- `lines`: Line-level diffing.
- `sentences`: Sentence-level diffing.
- `json`: JSON-level diffing (serializes objects to JSON first).
