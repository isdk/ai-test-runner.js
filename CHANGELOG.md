# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.3.0](https://github.com/isdk/ai-test-runner.js/compare/v0.2.3...v0.3.0) (2026-06-25)


### ⚠ BREAKING CHANGES

* rename input var used in $expr to fixture
* add nullable as non-exists supports by default, add nullAsAbsent argument(if true, null will be treat exists)

### Features

* add actualMeta to AITestLogItem, meta to AIExecutionResult ([149c052](https://github.com/isdk/ai-test-runner.js/commit/149c0526b0e971f312fb01e57c3e26226d9c7a55))
* add nullable as non-exists supports by default, add nullAsAbsent argument(if true, null will be treat exists) ([80b5a0e](https://github.com/isdk/ai-test-runner.js/commit/80b5a0e7e73018ad2c0f9c307007db89e567839f))


### Refactor

* rename input var used in $expr to fixture ([ce75971](https://github.com/isdk/ai-test-runner.js/commit/ce75971deab69ffa520dfde898dcc765f6ed0187))

## [0.2.3](https://github.com/isdk/ai-test-runner.js/compare/v0.2.1...v0.2.3) (2026-03-26)


### Features

* add comparison and expression validation operators ([ceaffe2](https://github.com/isdk/ai-test-runner.js/commit/ceaffe26ad89416462ebc546b2508d1ef1d311a2))
* **validate:** add `$sort`, `$nth`, `$first`, and `$last` array processing operators ([0e872fc](https://github.com/isdk/ai-test-runner.js/commit/0e872fc8b105f95482bdab69cdced6ec96cd0e56))
* **validate:** enhance $sort operator with function and expression support ([26beed9](https://github.com/isdk/ai-test-runner.js/commit/26beed9596be872b157e2e95587682721c3a51f4))

## [0.2.2](https://github.com/isdk/ai-test-runner.js/compare/v0.2.1...v0.2.2) (2026-03-25)


### Features

* add comparison and expression validation operators ([ceaffe2](https://github.com/isdk/ai-test-runner.js/commit/ceaffe26ad89416462ebc546b2508d1ef1d311a2))
* **validate:** add , , , and  array processing operators ([1f0f3f6](https://github.com/isdk/ai-test-runner.js/commit/1f0f3f63b582b1826ae6418f15b9e3bc4e7440dd))

## [0.2.1](https://github.com/isdk/ai-test-runner.js/compare/v0.2.0...v0.2.1) (2026-03-25)


### Features

* **validate:** add  operator and elaborate on array operators documentation ([8981666](https://github.com/isdk/ai-test-runner.js/commit/8981666864a0ecd1b4b3ecafad53b31be4126a40))
* **validate:** enhance $contains to support string/object ([5e30b1f](https://github.com/isdk/ai-test-runner.js/commit/5e30b1f8de58ca04e7827dd4622347362c351aee))

## [0.2.0](https://github.com/isdk/ai-test-runner.js/compare/v0.1.2...v0.2.0) (2026-03-25)


### ⚠ BREAKING CHANGES

* **scoring:** Legacy metadata keys `score`, `title`, `critical`, `description`, `dimension` are no longer supported as metadata. They are now treated as normal business data. You must migrate to using `$meta` or the new `$`-prefixed shorthands.

### Refactor

* **scoring:** implement strict metadata separation with $meta and $shorthands ([377c154](https://github.com/isdk/ai-test-runner.js/commit/377c15407b6bafe4f8a761af78baade4190788a4))

## [0.1.2](https://github.com/isdk/ai-test-runner.js/compare/v0.1.1...v0.1.2) (2026-03-24)


### Features

* add $and and $or logic operators to validation engine ([3c2e539](https://github.com/isdk/ai-test-runner.js/commit/3c2e5390e717ea0a7a018f1ba20a01753c0ea535))
* add $exists validation operator ([2abe046](https://github.com/isdk/ai-test-runner.js/commit/2abe0466600190c828430319ea631ed01cb0dabe))
* add AITestFixture type and enhance AITestLogItem with debugging fields ([7c5e4d3](https://github.com/isdk/ai-test-runner.js/commit/7c5e4d39d453f13fd8f15bb64145e84e9960e873))
* add optional title to fixture ([65bfbef](https://github.com/isdk/ai-test-runner.js/commit/65bfbefa32260e9ce10400420d6a7557556dfabc))
* add skippedCount to AITestFixtureResult and track skipped tests in logs ([be5aa21](https://github.com/isdk/ai-test-runner.js/commit/be5aa213ef0b9d257f133862a4bdcd260d545727))
* add support for custom validation operators with js:// protocol ([43a90eb](https://github.com/isdk/ai-test-runner.js/commit/43a90eb82a4ad8bfa09568cf1891a59e78f4ee4f))
* **diff:** implement structured JSON diffing and smart auto-detection strategies ([7c765ae](https://github.com/isdk/ai-test-runner.js/commit/7c765ae61642fe1353864fa809a65e46f96b4917))
* enhance diff validation with permissive mode and mandatory items ([3a024f7](https://github.com/isdk/ai-test-runner.js/commit/3a024f75978429f6ad016d0d0f1bd015a9803d45))
* Enhance operator input type declaration ([9207f4e](https://github.com/isdk/ai-test-runner.js/commit/9207f4e73d443cdf80e5dbeeb9bb2a8dc85b202b))
* enhance tool testing and advanced validation operators ([e85b00a](https://github.com/isdk/ai-test-runner.js/commit/e85b00a56f6a2e29808a23283a8f062758b7a7f4))
* enhance validation with ValidationContext, $schema operator, and disableHeuristicSchema option ([b51599a](https://github.com/isdk/ai-test-runner.js/commit/b51599ace4a31a20b63983e3c891196985c9a926))
* Implement flexible scoring strategies and fuzzy validation ([78e20b5](https://github.com/isdk/ai-test-runner.js/commit/78e20b512d5c8c9e2609d81a90918dae1701cce6))
* implement hierarchical scoring strategy for non-deterministic AI outputs ([92afc9d](https://github.com/isdk/ai-test-runner.js/commit/92afc9df123743b1c1006fb917824af659b2471c))
* implement multi-dimensional scoring, deductions, and detailed score breakdown ([f2638ab](https://github.com/isdk/ai-test-runner.js/commit/f2638abc96f2b49d94e3e767a75d2f9123ec4878))
* improve RegExp mismatch error message with full regex string and actual value ([45214c3](https://github.com/isdk/ai-test-runner.js/commit/45214c3f6660d5d7893c81ed655c7483ac289ab6))
* support 'tools: true' for automatic tool resolution and overhaul documentation ([5b29061](https://github.com/isdk/ai-test-runner.js/commit/5b29061f241af1857802898d19abcb163de548e6))
* **validate:** enhance custom operators with parameter support and auto-inference ([c6a6af0](https://github.com/isdk/ai-test-runner.js/commit/c6a6af035ef647a070e90fc682aa37c97c6f646d))


### Bug Fixes

* add missing count property to AIDiffItem for TypeScript compatibility ([0b04d44](https://github.com/isdk/ai-test-runner.js/commit/0b04d4467398b29a44a589cdf803e3ec1c6ef96e))
* if the expected is function return its name first ([5e7886e](https://github.com/isdk/ai-test-runner.js/commit/5e7886efc5dfdea1c146fb155ca288a44341a51e))
* should allow the input value is '' ([0ac1fd2](https://github.com/isdk/ai-test-runner.js/commit/0ac1fd2ced2ef35f932fb1aa60ba17a0bc4ae4b0))
* **ts:** add ValidationResult type to result param of processValidationResult ([abf1747](https://github.com/isdk/ai-test-runner.js/commit/abf1747de941dbbea71834a7b8cb71bc5d1030a6))
* **ts:** add ValidationResult type to return type for CustomOperatorHandler ([bba588e](https://github.com/isdk/ai-test-runner.js/commit/bba588e1694f553bb64ae0b93573aa84d1c03379))


### Refactor

* clarify scoring 'critical' vs diff 'required' and cleanup redundant params ([21decbb](https://github.com/isdk/ai-test-runner.js/commit/21decbb1d461310907facf04a0dd22f010db4dd3))
* implement pure-function architecture and unified scoring scale ([3c2e4f4](https://github.com/isdk/ai-test-runner.js/commit/3c2e4f4bc378c69956a046aff16d3cf51a9b9e3e))
* modularize validate-match and support nested path keys ([2a21762](https://github.com/isdk/ai-test-runner.js/commit/2a217629e7d0921defa235e211a66824ee242974))
* rename score.required to critical, and isRequiredBranch to isCriticalBranch, failedRequired to failedCritical ([f95a81b](https://github.com/isdk/ai-test-runner.js/commit/f95a81bb7c33b7b77843871cb4af6db884247ade))
* **validate:** implement operator strategy and enhanced path automation ([88aad73](https://github.com/isdk/ai-test-runner.js/commit/88aad735f463f653d0f24bfff96b8a5e9d7eb524))
* **validate:** simplify metadata patching and enhance path automation ([1c84766](https://github.com/isdk/ai-test-runner.js/commit/1c84766133a927a0626aa4936b45f101a0bbe4f4))
* **validate:** split operators into individual files ([41fd715](https://github.com/isdk/ai-test-runner.js/commit/41fd715a151b2c35cd8ac2a99dc75e62cfe70671))

## 0.1.1 (2026-01-29)
