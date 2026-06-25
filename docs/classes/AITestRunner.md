[**@isdk/ai-test-runner**](../README.md)

***

[@isdk/ai-test-runner](../globals.md) / AITestRunner

# Class: AITestRunner

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/ai-test-runner.ts:113](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/ai-test-runner.ts#L113)

Runner for executing AI script test fixtures and validating results.

## Fires

AITestRunner#test:start - Fired before executing a fixture.

## Fires

AITestRunner#test:pass - Fired when a fixture passes all validations.

## Fires

AITestRunner#test:fail - Fired when a fixture fails validation.

## Fires

AITestRunner#test:error - Fired when an exception occurs during execution.

## Fires

AITestRunner#test:skip - Fired when a fixture is skipped.

## Extends

- [`EventEmitter`](#)

## Constructors

### Constructor

> **new AITestRunner**(`executor`): `AITestRunner`

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/ai-test-runner.ts:119](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/ai-test-runner.ts#L119)

Creates a new AITestRunner instance.

#### Parameters

##### executor

[`AIScriptExecutor`](../interfaces/AIScriptExecutor.md)

The executor to use for running AI scripts.

#### Returns

`AITestRunner`

#### Overrides

`EventEmitter.constructor`

## Properties

### defaultMaxListeners

> `static` **defaultMaxListeners**: `number`

Defined in: events-ex.js/lib/event-emitter.d.ts:7

#### Inherited from

`EventEmitter.defaultMaxListeners`

## Methods

### emit()

> **emit**(`eventName`, ...`args`): `any`

Defined in: events-ex.js/lib/event-emitter.d.ts:58

Emits the specified event type with the given arguments.

#### Parameters

##### eventName

`string`

##### args

...`any`[]

The event type followed by any number of arguments to be passed to the listener functions.

#### Returns

`any`

The result of the event.

#### Inherited from

`EventEmitter.emit`

***

### emitAsync()

> **emitAsync**(`eventName`, ...`args`): `Promise`\<`any`\>

Defined in: events-ex.js/lib/event-emitter.d.ts:64

Asynchronously emits the specified event type with the given arguments.

#### Parameters

##### eventName

`string`

##### args

...`any`[]

The event type followed by any number of arguments to be passed to the listener functions.

#### Returns

`Promise`\<`any`\>

A promise that resolves with the result of the event.

#### Inherited from

`EventEmitter.emitAsync`

***

### listenerCount()

> **listenerCount**(`eventName`): `number`

Defined in: events-ex.js/lib/event-emitter.d.ts:93

Returns the count of listeners that are registered to listen for the specified event.

#### Parameters

##### eventName

`string` \| `RegExp`

The name of the event to get the listeners for.

#### Returns

`number`

- the listeners count

#### Inherited from

`EventEmitter.listenerCount`

***

### listeners()

> **listeners**(`eventName`): `Function`[]

Defined in: events-ex.js/lib/event-emitter.d.ts:86

Returns an array of functions that are registered to listen for the specified event.

#### Parameters

##### eventName

`string` \| `RegExp`

The name of the event to get the listeners for.

#### Returns

`Function`[]

- An array of functions that are registered to listen for the specified event.

#### Inherited from

`EventEmitter.listeners`

***

### off()

> **off**(`eventName`, `listener`): [`EventEmitter`](#)

Defined in: events-ex.js/lib/event-emitter.d.ts:43

Removes a listener function from the specified event type.

#### Parameters

##### eventName

`string` \| `RegExp`

##### listener

`Function`

The listener function to be removed.

#### Returns

[`EventEmitter`](#)

The EventEmitter instance to allow chaining.

#### Throws

If the listener is not a function.

#### See

[removeListener](#removelistener)

#### Inherited from

`EventEmitter.off`

***

### on()

> **on**(`eventName`, `listener`, `index?`): [`EventEmitter`](#)

Defined in: events-ex.js/lib/event-emitter.d.ts:21

Adds a listener function to the specified event type.

#### Parameters

##### eventName

`string` \| `RegExp`

##### listener

`Function`

The listener function to be called when the event is emitted.

##### index?

`number` \| `"first"` \| `"last"`

The index at which to insert the listener.
       - 'first' or -Infinity: adds to the beginning of the listeners (stay at the front).
       - 'last' or Infinity: adds to the end of the listeners (stay at the back).
       - number: inserts at the specified index within the normal listeners zone.
       If not specified, the listener will be added at the end of the normal listeners.

#### Returns

[`EventEmitter`](#)

The EventEmitter instance to allow chaining.

#### Throws

If the listener is not a function.

#### Inherited from

`EventEmitter.on`

***

### once()

> **once**(`eventName`, `listener`, `index?`): [`EventEmitter`](#)

Defined in: events-ex.js/lib/event-emitter.d.ts:34

Adds a one-time listener function to the specified event type.

#### Parameters

##### eventName

`string` \| `RegExp`

##### listener

`Function`

The listener function to be called once when the event is emitted.

##### index?

`number` \| `"first"` \| `"last"`

The index at which to insert the listener.
       - 'first' or -Infinity: adds to the beginning of the listeners (stay at the front).
       - 'last' or Infinity: adds to the end of the listeners (stay at the back).
       - number: inserts at the specified index within the normal listeners zone.
       If not specified, the listener will be added at the end of the normal listeners.

#### Returns

[`EventEmitter`](#)

The EventEmitter instance to allow chaining.

#### Throws

If the listener is not a function.

#### Inherited from

`EventEmitter.once`

***

### removeAllListeners()

> **removeAllListeners**(`eventName?`): [`EventEmitter`](#)

Defined in: events-ex.js/lib/event-emitter.d.ts:71

Removes all listeners for a specific event or all events from an event emitter.

#### Parameters

##### eventName?

`string` \| `RegExp`

The event to remove listeners for. If not provided, all listeners for all events will be removed.

#### Returns

[`EventEmitter`](#)

- The event emitter with all listeners removed.

#### Inherited from

`EventEmitter.removeAllListeners`

***

### removeListener()

> **removeListener**(`eventName`, `listener`): [`EventEmitter`](#)

Defined in: events-ex.js/lib/event-emitter.d.ts:52

Removes a listener function from the specified event type.

#### Parameters

##### eventName

`string` \| `RegExp`

##### listener

`Function`

The listener function to be removed.

#### Returns

[`EventEmitter`](#)

The EventEmitter instance to allow chaining.

#### Throws

If the listener is not a function.

#### See

[off](#off)

#### Inherited from

`EventEmitter.removeListener`

***

### run()

> **run**(`script`, `fixtures`, `options?`): `Promise`\<[`AITestFixtureResult`](../interfaces/AITestFixtureResult.md)\>

Defined in: [@isdk/ai-tools/packages/ai-test-runner/src/ai-test-runner.ts:131](https://github.com/isdk/ai-test-runner.js/blob/ce75971deab69ffa520dfde898dcc765f6ed0187/src/ai-test-runner.ts#L131)

Runs a set of test fixtures against a specified script.

#### Parameters

##### script

`string`

The default script to run if not specified in fixtures.

##### fixtures

[`AITestFixture`](../interfaces/AITestFixture.md)[]

An array of test fixtures.

##### options?

[`AITestRunnerOptions`](../interfaces/AITestRunnerOptions.md) = `{}`

Global runner options.

#### Returns

`Promise`\<[`AITestFixtureResult`](../interfaces/AITestFixtureResult.md)\>

A promise that resolves to the overall test results.

***

### setMaxListeners()

> **setMaxListeners**(`n`): [`EventEmitter`](#)

Defined in: events-ex.js/lib/event-emitter.d.ts:79

Sets the maximum number of listeners allowed for the event emitter.

#### Parameters

##### n

`number`

The maximum number of listeners to set. Must be a positive integer.

#### Returns

[`EventEmitter`](#)

The [EventEmitter](#) instance for method chaining.

#### Throws

If `n` is not a positive integer.

#### Inherited from

`EventEmitter.setMaxListeners`

***

### ~~listenerCount()~~

> `static` **listenerCount**(`emitter`, `eventName`): `number`

Defined in: events-ex.js/lib/event-emitter.d.ts:101

Returns the count of listeners that are registered to listen for the specified event.

#### Parameters

##### emitter

[`EventEmitter`](#)

##### eventName

`string` \| `RegExp`

#### Returns

`number`

#### Deprecated

use emitter.listenerCount instead

#### Inherited from

`EventEmitter.listenerCount`
