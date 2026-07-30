'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const detectors = require('../src/core/detectors');

test('hasOemLockStatus detects known shapes', () => {
  assert.equal(detectors.hasOemLockStatus({ oem_lock_status: { locked: true } }), true);
  assert.equal(detectors.hasOemLockStatus({ oemUnlockStatus: {} }), true);
  assert.equal(detectors.hasOemLockStatus({ status: { oem_unlock: {} } }), true);
  assert.equal(detectors.hasOemLockStatus({ unrelated: true }), false);
  assert.equal(detectors.hasOemLockStatus(null), false);
});

test('hasCarrierLockStatus detects known shapes', () => {
  assert.equal(detectors.hasCarrierLockStatus({ carrier_lock: {} }), true);
  assert.equal(detectors.hasCarrierLockStatus({ simlock: {} }), true);
  assert.equal(detectors.hasCarrierLockStatus({ carrier_restrictions: {} }), true);
  assert.equal(detectors.hasCarrierLockStatus({}), false);
});

test('isUnlockRelatedRequest matches on path or body keywords', () => {
  assert.equal(detectors.isUnlockRelatedRequest('/v1/device/unlock', {}), true);
  assert.equal(detectors.isUnlockRelatedRequest('/v1/other', { bootloader: true }), true);
  assert.equal(detectors.isUnlockRelatedRequest('/v1/other', { foo: 'bar' }), false);
});
