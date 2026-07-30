// Canonical config shared by every adapter. Previously this list existed in
// five disagreeing copies (oem_unlock.js: 4 hosts, proxypin-oem-unlock.js: 7
// hosts, commonissues.md: 12 hosts, ...). This is the one place to edit it.

'use strict';

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

module.exports = { TARGET_HOSTS, LOCK_FIELDS, REQUEST_GUARD_KEYWORDS };
