import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion } from '../scripts/release-version.mjs';

// La versión depende de los tags y del commit, no de los reintentos.
test('first publication uses the package version', () =>
  assert.equal(nextVersion('7.4.1', []), 'v7.4.1'));
test('each new main commit gets a unique version', () =>
  assert.equal(nextVersion('7.4.1', ['v7.4.0', 'v7.4.1']), 'v7.4.2'));
test('rerunning an existing commit reuses its version', () =>
  assert.equal(nextVersion('7.4.1', ['v7.4.1', 'v7.4.2'], ['v7.4.1']), 'v7.4.1'));
test('an intentional major version bump is retained', () =>
  assert.equal(nextVersion('8.0.0', ['v7.4.1']), 'v8.0.0'));
test('non-release tags are ignored', () =>
  assert.equal(nextVersion('7.4.1', ['unrelated', 'v8.0.0-rc1']), 'v7.4.1'));
