// Consolidates modifyOemLockStatus/modifyProvisioningStatus/etc, which
// previously existed as four separate hand-written copies (oem_unlock.js,
// oem_unlock_proxy_pin.js, proxypin-oem-unlock.js, nuclear_unlock.js).
// `permanent` toggles the extra anti-relock fields proxypin-oem-unlock.js
// used to hardcode into its own private copy of these functions.

'use strict';

const { setNested, generateUnlockToken } = require('./utils');

function modifyOemLockStatus(obj, { permanent = false } = {}) {
  const base = {
    locked: false,
    user_toggle_enabled: true,
    enforced_by_carrier: false,
    reason: 'OEM unlocking allowed',
    supported: true,
    modified_by_proxy: true,
  };

  const permanentFields = permanent ? {
    carrier_enforceable: false,
    permanent_unlock: true,
    unlock_date: Date.now(),
    unlock_reason: 'Permanent carrier unlock',
    future_lock_prevention: {
      allowed: false,
      require_user_consent: true,
      max_lock_duration: 0,
      carrier_override_disabled: true,
    },
  } : {};

  const merged = { ...base, ...permanentFields };

  ['oem_lock_status', 'status.oem_unlock'].forEach((path) => {
    setNested(obj, path, merged);
  });
  if (obj.oemUnlockStatus !== undefined) {
    obj.oemUnlockStatus = { locked: false, unlockAllowed: true, userToggleable: true, ...permanentFields };
  }

  if (obj.oem_unlock_allowed !== undefined) obj.oem_unlock_allowed = true;
  if (obj.isOemUnlockAllowed !== undefined) obj.isOemUnlockAllowed = true;
  if (obj.unlockAllowed !== undefined) obj.unlockAllowed = true;
  if (permanent) obj.permanent_unlock_granted = true;

  return obj;
}

function modifyProvisioningStatus(obj, { permanent = false } = {}) {
  if (obj.provisioningStatus !== undefined) {
    obj.provisioningStatus = permanent ? 'COMPLETE_PERMANENT' : 'COMPLETE';
    obj.isProvisioned = true;
    obj.requiresOemUnlock = false;
  }

  if (obj.afwProvisioning !== undefined) {
    obj.afwProvisioning = {
      completed: true,
      remainingSteps: 0,
      canOemUnlock: true,
      status: permanent ? 'SUCCESS_PERMANENT' : 'SUCCESS',
      ...(permanent ? { permanent_unlock: true } : {}),
    };
  }

  if (permanent && obj.managementStatus !== undefined) {
    obj.managementStatus = 'FULLY_MANAGED_UNLOCKED';
  }

  return obj;
}

function modifyCarrierLockStatus(obj, { permanent = false } = {}) {
  if (obj.carrier_lock !== undefined) {
    obj.carrier_lock = {
      locked: false,
      enforced: false,
      can_unlock: true,
      ...(permanent ? {
        permanent_unlock: true,
        enforceable: false,
        unlock_token: generateUnlockToken(),
        unlock_timestamp: Date.now(),
      } : {}),
    };
  }

  if (obj.simlock !== undefined) {
    obj.simlock = permanent
      ? { locked: false, state: 'UNLOCKED_PERMANENT', network_subset: false, service_provider: false, corporate: false, sim: false }
      : { locked: false, state: 'UNLOCKED' };
  }

  if (permanent && obj.network_lock !== undefined) {
    obj.network_lock = { locked: false, permanent: true };
  }

  return obj;
}

function modifyBootloaderStatus(obj, { permanent = false } = {}) {
  if (obj.bootloader !== undefined) {
    obj.bootloader = {
      locked: false,
      unlockable: true,
      verified: false, // allows custom ROMs
      ...(permanent ? { permanent_unlock: true, carrier_restricted: false } : {}),
    };
  }
  if (permanent && obj.bootloaderStatus !== undefined) {
    obj.bootloaderStatus = 'UNLOCKED_PERMANENT';
  }
  return obj;
}

function modifyPolicyRestrictions(obj, { permanent = false } = {}) {
  if (obj.policy !== undefined) {
    obj.policy = {
      ...obj.policy,
      oemUnlockAllowed: true,
      advancedSecurityDisabled: true,
      ...(permanent ? {
        carrierLockDisallowed: true,
        permanentUnlock: true,
        policy_enforcement: { enabled: false, carrier_override: false, temporary_unlock: false },
      } : {}),
    };
  }

  if (obj.restrictions !== undefined) {
    obj.restrictions = {
      ...obj.restrictions,
      disallow_oem_unlock: false,
      oem_unlock_disallowed: false,
      ...(permanent ? { carrier_lock_enforced: false, permanent_unlock_allowed: true } : {}),
    };
  }

  return obj;
}

function forceUnlockSuccess(obj) {
  if (obj.status !== undefined) {
    if (typeof obj.status === 'string') {
      obj.status = 'SUCCESS';
    } else if (typeof obj.status === 'object' && obj.status !== null) {
      obj.status.code = 0;
      obj.status.message = 'Success';
    }
  }

  if (obj.error !== undefined) obj.error = null;
  if (obj.success !== undefined) obj.success = true;
  obj.result = 'OK';
  obj.unlockResult = 'SUCCESS';

  return obj;
}

// Only applied when permanent:true — mirrors proxypin-oem-unlock.js's
// addAntiRelockMeasures, which stamps flags meant to survive future lock
// re-checks (reboot, carrier re-provisioning).
function addAntiRelockMeasures(obj) {
  obj.permanent_unlock_metadata = {
    unlocked: true,
    timestamp: Date.now(),
    carrier_restrictions_removed: true,
    future_checks_bypassed: true,
    verification: { required: false, online_check: false, carrier_check: false },
  };

  obj.device_config = {
    ...obj.device_config,
    oem_lock: {
      check_interval: 0,
      online_verification: false,
      carrier_verification: false,
      permanent_bypass: true,
    },
  };

  return obj;
}

module.exports = {
  modifyOemLockStatus,
  modifyProvisioningStatus,
  modifyCarrierLockStatus,
  modifyBootloaderStatus,
  modifyPolicyRestrictions,
  forceUnlockSuccess,
  addAntiRelockMeasures,
};
