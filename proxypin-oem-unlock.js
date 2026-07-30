// AUTO-GENERATED from src/core + src/adapters — do not hand-edit.
// Edit the source and run 'npm run build' to regenerate this file.

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

function getNested(obj, path) {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
}

function setNested(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, p) => (o[p] = o[p] || {}), obj);
  target[lastKey] = value;
}

// oem_unlock.js used Buffer.byteLength, the Proxy Pin variants used
// TextEncoder — pick whichever the runtime actually has instead of
// assuming one.
function byteLength(str) {
  if (typeof Buffer !== 'undefined') return Buffer.byteLength(str);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
  return str.length;
}

// oem_unlock.js's ungzip() silently returned the still-compressed body if
// no global Zlib was present, so a modification pass would then run against
// binary garbage with no indication anything was wrong. This fails loudly
// instead.
function decompressGzip(body, headers) {
  const encoding = ((headers && headers['content-encoding']) || '').toLowerCase();
  if (encoding !== 'gzip') return { body, decompressed: false };

  if (typeof Zlib !== 'undefined' && Zlib.gunzipSync) {
    return { body: Zlib.gunzipSync(body).toString(), decompressed: true };
  }

  console.warn(
    '[oem-unlock] gzip response received but no Zlib available in this ' +
    'runtime — leaving body compressed, detectors will find nothing.'
  );
  return { body, decompressed: false };
}

function generateUnlockToken() {
  return 'perm_unlock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

// oem_unlock.js tried a plain JSON.parse then a wrapper-extraction regex;
// the other three adapters didn't try the fallback at all and would just
// give up on any non-strict-JSON body. One shared, best-effort parser.
function safeParseJson(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (e2) {
      return null;
    }
  }
}

// Consolidates modifyOemLockStatus/modifyProvisioningStatus/etc, which
// previously existed as four separate hand-written copies (oem_unlock.js,
// oem_unlock_proxy_pin.js, proxypin-oem-unlock.js, nuclear_unlock.js).
// `permanent` toggles the extra anti-relock fields proxypin-oem-unlock.js
// used to hardcode into its own private copy of these functions.

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

// Canonical config shared by every adapter. Previously this list existed in
// five disagreeing copies (oem_unlock.js: 4 hosts, proxypin-oem-unlock.js: 7
// hosts, commonissues.md: 12 hosts, ...). This is the one place to edit it.

const TARGET_HOSTS = [
  'afwprovisioning-pa.googleapis.com',
  'android.clients.google.com',
  'android.googleapis.com',
  'www.googleapis.com',
  'device-policy.googleapis.com',
  'mobile-services.googleapis.com',
  'carrier-services.googleapis.com',
  'devicesettings-pa.googleapis.com',
  'devicemanagement.googleapis.com',
  'androidmanagement.googleapis.com',
];

// Used by the broad-fallback adapter's regex-mutation pass when structured
// detection finds nothing. Kept narrower than the old nuclear_unlock.js
// list (which matched generic words like "api", "auth", "sync", "account"
// against every domain on the device) — every entry here is specific to
// device/carrier lock state, not general API traffic.
const LOCK_FIELDS = [
  'lock', 'unlock', 'oem', 'bootloader', 'carrier', 'sim',
  'network', 'provision', 'management', 'policy', 'restriction',
  'enforce', 'toggle',
];

// Shared by the two request-side guards (anti-relock.js targets Proxy Pin,
// pre_unlock.js targets a generic scripting proxy) so their blocklists
// never diverge again.
const REQUEST_GUARD_KEYWORDS = {
  block: ['lock', 'restrict', 'enforce', 'disable_unlock', 'carrier_policy'],
  unlock: ['unlock', 'oem'],
};

// The one ordered list of "detect X, then modify X" strategies. Previously
// each adapter (oem_unlock.js, oem_unlock_proxy_pin.js,
// proxypin-oem-unlock.js, nuclear_unlock.js) had its own copy of this
// waterfall, with different strategies present/missing/ordered
// differently in each.

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

// == Proxy Pin OEM Unlock Script ==
// Runtime: Proxy Pin Android app (Settings > Script Management).
// Runs the pipeline in permanent mode: adds anti-relock metadata on top of
// the standard unlock fields, meant to survive future carrier re-checks.

const CONFIG = {
  enabled: true,
  debug: true,
  permanent: true,
  targetHosts: TARGET_HOSTS,
};

proxy.onResponse(function (request, response) {
  if (!CONFIG.enabled) return response;

  try {
    if (!shouldIntercept(request.hostname, CONFIG.targetHosts)) return response;

    if (CONFIG.debug) console.log(`[OEM Unlock] Intercepting: ${request.hostname}${request.path}`);
    return processOemUnlockResponse(request, response);
  } catch (error) {
    if (CONFIG.debug) console.error('[OEM Unlock] Error:', error);
    return response;
  }
});

function processOemUnlockResponse(request, response) {
  const contentType = (response.headers['content-type'] || '').toLowerCase();
  const isJson = contentType.includes('json') || request.path.toLowerCase().includes('json');
  if (!isJson) return response;

  const parsedBody = safeParseJson(response.body);
  if (!parsedBody) return response;

  const { modified, body } = runPipeline(parsedBody, request.path, { permanent: CONFIG.permanent });
  if (!modified) return response;

  const newResponse = { ...response, body: JSON.stringify(body) };
  if (newResponse.headers['content-length']) {
    newResponse.headers['content-length'] = String(byteLength(newResponse.body));
  }

  if (CONFIG.debug) {
    console.log('=== OEM UNLOCK SUCCESS ===');
    console.log('Host: ' + request.hostname + request.path);
    console.log('Permanent unlock: ENABLED, anti-relock: ACTIVATED');
  }

  saveUnlockState(request);
  return newResponse;
}

function saveUnlockState(request) {
  try {
    const unlockState = {
      timestamp: Date.now(),
      hostname: request.hostname,
      path: request.path,
      permanent: true,
      token: generateUnlockToken(),
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oem_unlock_state', JSON.stringify(unlockState));
    }
  } catch (e) {
    // Storage unavailable in this runtime — non-fatal, response is still modified.
  }
}

console.log('[Permanent OEM Unlock] Proxy Pin script loaded and active');
console.log('[Permanent OEM Unlock] Target hosts: ' + CONFIG.targetHosts.join(', '));
