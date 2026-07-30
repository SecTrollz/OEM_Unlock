'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const modifiers = require('../src/core/modifiers');

test('modifyOemLockStatus unlocks a locked device', () => {
  const body = { oem_lock_status: { locked: true, user_toggle_enabled: false } };
  const result = modifiers.modifyOemLockStatus(body, { permanent: false });
  assert.equal(result.oem_lock_status.locked, false);
  assert.equal(result.oem_lock_status.user_toggle_enabled, true);
  assert.equal(result.oem_lock_status.carrier_enforceable, undefined);
});

test('modifyOemLockStatus adds anti-relock fields only in permanent mode', () => {
  const body = { oem_lock_status: { locked: true } };
  const result = modifiers.modifyOemLockStatus(body, { permanent: true });
  assert.equal(result.oem_lock_status.locked, false);
  assert.equal(result.oem_lock_status.carrier_enforceable, false);
  assert.equal(result.permanent_unlock_granted, true);
});

test('modifyCarrierLockStatus unlocks carrier and sim locks', () => {
  const body = { carrier_lock: { locked: true }, simlock: { locked: true } };
  const result = modifiers.modifyCarrierLockStatus(body, {});
  assert.equal(result.carrier_lock.locked, false);
  assert.equal(result.simlock.state, 'UNLOCKED');
});

test('forceUnlockSuccess normalizes success fields', () => {
  const body = { status: 'FAILED', error: 'nope', success: false };
  const result = modifiers.forceUnlockSuccess(body);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.error, null);
  assert.equal(result.success, true);
  assert.equal(result.result, 'OK');
});
