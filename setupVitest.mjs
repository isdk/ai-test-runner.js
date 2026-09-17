// 这个 fetchMock 没有传递abort 中的 reason!

/*
import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';
// import './fetch-polyfill.mjs';

const fetchMocker = createFetchMock(vi);

// sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks();

// changes default behavior of fetchMock to use the real 'fetch' implementation and not mock responses
fetchMocker.dontMock();
*/

// Register the template and JSON Schema plugins into @isdk/match-ex.
// src/index.ts does this too, but some test files import the engine directly
// (e.g. via '@isdk/match-ex' or '../src/yaml-types/...') — the setup file
// covers them all regardless of the import path.
import '@isdk/match-ex-schema'
import '@isdk/match-ex-template'
