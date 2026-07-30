'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { byteLength, safeParseJson, getNested, setNested } = require('../src/core/utils');

test('byteLength matches Buffer.byteLength for ascii and multibyte', () => {
  assert.equal(byteLength('hello'), 5);
  assert.equal(byteLength('héllo'), Buffer.byteLength('héllo'));
});

test('safeParseJson parses strict JSON and passes through objects', () => {
  assert.deepEqual(safeParseJson('{"a":1}'), { a: 1 });
  assert.deepEqual(safeParseJson({ a: 1 }), { a: 1 });
});

test('safeParseJson extracts JSON from a wrapped/prefixed body', () => {
  assert.deepEqual(safeParseJson(")]}'\n{\"a\":1}"), { a: 1 });
});

test('safeParseJson returns null for unparseable input', () => {
  assert.equal(safeParseJson('not json at all'), null);
  assert.equal(safeParseJson(undefined), null);
});

test('getNested/setNested round-trip through dotted paths', () => {
  const obj = {};
  setNested(obj, 'status.oem_unlock', { locked: false });
  assert.equal(getNested(obj, 'status.oem_unlock').locked, false);
  assert.equal(getNested(obj, 'missing.path'), undefined);
});
