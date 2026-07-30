// AUTO-GENERATED from src/core + src/adapters — do not hand-edit.
// Edit the source and run 'npm run build' to regenerate this file.

'use strict';

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

// == Anti-Relock Protection Script ==
// Runtime: Proxy Pin Android app, request-side hook.
// Blocks outgoing carrier-lock requests and stamps permanent-unlock flags
// onto outgoing unlock requests.

proxy.onRequest(function (request) {
  if (isCarrierLockRequest(request.url)) {
    console.log('[Anti-Relock] Blocking carrier lock request: ' + request.url);
    return { cancel: true };
  }

  if (isUnlockRequest(request.url) && request.body) {
    try {
      const body = JSON.parse(request.body);
      body.permanent_unlock = true;
      body.bypass_carrier = true;
      body.timestamp = Date.now();
      request.body = JSON.stringify(body);
    } catch (e) {
      // Not JSON — leave the request untouched.
    }
  }

  return request;
});

function isCarrierLockRequest(url) {
  const lower = url.toLowerCase();
  return REQUEST_GUARD_KEYWORDS.block.some((keyword) => lower.includes(keyword));
}

function isUnlockRequest(url) {
  const lower = url.toLowerCase();
  return REQUEST_GUARD_KEYWORDS.unlock.some((keyword) => lower.includes(keyword));
}
