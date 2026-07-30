'use strict';

function hasOemLockStatus(obj) {
  return !!(obj && (
    obj.oem_lock_status !== undefined ||
    obj.oemUnlockStatus !== undefined ||
    obj.unlockStatus !== undefined ||
    (obj.status && typeof obj.status === 'object' && obj.status.oem_unlock !== undefined)
  ));
}

function hasProvisioningStatus(obj) {
  return !!(obj && (
    obj.provisioningStatus !== undefined ||
    obj.afwProvisioning !== undefined ||
    obj.managementStatus !== undefined
  ));
}

function hasCarrierLockStatus(obj) {
  return !!(obj && (
    obj.carrier_lock !== undefined ||
    obj.simlock !== undefined ||
    obj.network_lock !== undefined ||
    obj.carrier_restrictions !== undefined
  ));
}

function hasBootloaderStatus(obj) {
  return !!(obj && (
    obj.bootloader !== undefined ||
    obj.bootloaderStatus !== undefined
  ));
}

function hasPolicyRestrictions(obj) {
  return !!(obj && (
    obj.policy !== undefined ||
    obj.restrictions !== undefined ||
    obj.enterpriseConfig !== undefined
  ));
}

function isUnlockRelatedRequest(path, obj) {
  const unlockKeywords = [
    'unlock', 'oem', 'bootloader', 'carrier', 'simlock',
    'provisioning', 'afw', 'enterprise',
  ];
  const haystack = ((path || '') + JSON.stringify(obj || {})).toLowerCase();
  return unlockKeywords.some((keyword) => haystack.includes(keyword));
}

module.exports = {
  hasOemLockStatus,
  hasProvisioningStatus,
  hasCarrierLockStatus,
  hasBootloaderStatus,
  hasPolicyRestrictions,
  isUnlockRelatedRequest,
};
