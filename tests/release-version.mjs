import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion } from '../scripts/release-version.mjs';
test('first release and legacy migration', () =>
  assert.equal(nextVersion('7.0.1', ['v1.0.0', 'v7.0.0']), 'v7.0.1'));
test('each new main commit gets a unique version', () =>
  assert.equal(nextVersion('7.0.1', ['v7.0.0', 'v7.0.1', 'v7.0.2']), 'v7.0.3'));
test('rerunning an existing commit reuses its version', () =>
  assert.equal(nextVersion('7.0.1', ['v7.0.1', 'v7.0.2'], ['v7.0.1']), 'v7.0.1'));
test('an intentional major version bump is retained', () =>
  assert.equal(nextVersion('8.0.0', ['v7.0.20']), 'v8.0.0'));
test('non-release tags are ignored', () =>
  assert.equal(nextVersion('7.0.1', ['unrelated', 'v8.0.0-rc1']), 'v7.0.1'));
