'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runPipeline, shouldIntercept } = require('../src/core/pipeline');

test('runPipeline unlocks a standard provisioning response', () => {
  const body = {
    oem_lock_status: { locked: true },
    afwProvisioning: { completed: false, remainingSteps: 3, canOemUnlock: false },
  };
  const { modified, body: out } = runPipeline(body, '/v1/device/provisioning', { permanent: false });
  assert.equal(modified, true);
  assert.equal(out.oem_lock_status.locked, false);
  assert.equal(out.afwProvisioning.canOemUnlock, true);
  assert.equal(out.permanent_unlock_metadata, undefined);
});

test('runPipeline adds anti-relock metadata when permanent:true', () => {
  const body = { oem_lock_status: { locked: true } };
  const { body: out } = runPipeline(body, '/v1/device/unlock', { permanent: true });
  assert.ok(out.permanent_unlock_metadata);
  assert.equal(out.permanent_unlock_metadata.unlocked, true);
});

test('runPipeline leaves unrelated bodies untouched', () => {
  const body = { weather: 'sunny', temp: 72 };
  const { modified, body: out } = runPipeline(body, '/v1/weather', {});
  assert.equal(modified, false);
  assert.deepEqual(out, { weather: 'sunny', temp: 72 });
});

test('shouldIntercept only matches configured target hosts', () => {
  assert.equal(shouldIntercept('android.googleapis.com'), true);
  assert.equal(shouldIntercept('sub.android.googleapis.com'), true);
  assert.equal(shouldIntercept('example.com'), false);
  assert.equal(shouldIntercept('evil-android.googleapis.com.attacker.net'), false);
  assert.equal(shouldIntercept(''), false);
});
