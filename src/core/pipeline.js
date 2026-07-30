// The one ordered list of "detect X, then modify X" strategies. Previously
// each adapter (oem_unlock.js, oem_unlock_proxy_pin.js,
// proxypin-oem-unlock.js, nuclear_unlock.js) had its own copy of this
// waterfall, with different strategies present/missing/ordered
// differently in each.

'use strict';

const {
  hasOemLockStatus,
  hasProvisioningStatus,
  hasCarrierLockStatus,
  hasBootloaderStatus,
  hasPolicyRestrictions,
  isUnlockRelatedRequest,
} = require('./detectors');
const {
  modifyOemLockStatus,
  modifyProvisioningStatus,
  modifyCarrierLockStatus,
  modifyBootloaderStatus,
  modifyPolicyRestrictions,
  forceUnlockSuccess,
  addAntiRelockMeasures,
} = require('./modifiers');
const { TARGET_HOSTS } = require('./config');

// Used by every adapter's proxy.onResponse hook, and by
// broad-fallback (nuclear_unlock.js) in particular — which previously had
// no host check at all and ran its regex-mutation pass against every
// HTTPS request the device made.
function shouldIntercept(hostname, targetHosts = TARGET_HOSTS) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return targetHosts.some((target) => host === target || host.endsWith('.' + target));
}

// body must already be a parsed JSON object. Returns { modified, body }.
function runPipeline(body, path, { permanent = false } = {}) {
  if (!body || typeof body !== 'object') return { modified: false, body };

  let modified = false;
  const opts = { permanent };

  if (hasOemLockStatus(body)) {
    body = modifyOemLockStatus(body, opts);
    modified = true;
  }
  if (hasProvisioningStatus(body)) {
    body = modifyProvisioningStatus(body, opts);
    modified = true;
  }
  if (hasCarrierLockStatus(body)) {
    body = modifyCarrierLockStatus(body, opts);
    modified = true;
  }
  if (hasBootloaderStatus(body)) {
    body = modifyBootloaderStatus(body, opts);
    modified = true;
  }
  if (hasPolicyRestrictions(body)) {
    body = modifyPolicyRestrictions(body, opts);
    modified = true;
  }
  if (isUnlockRelatedRequest(path, body)) {
    body = forceUnlockSuccess(body);
    modified = true;
  }
  if (permanent && modified) {
    body = addAntiRelockMeasures(body);
  }

  return { modified, body };
}

module.exports = { runPipeline, shouldIntercept };
