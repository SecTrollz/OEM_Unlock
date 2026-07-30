// == Broad-Spectrum OEM Unlock Fallback ==
// For when the structured pipeline (generic-proxy/proxypin-*) finds
// nothing on a target host — tries a wider field-name sweep and, as a
// last resort, raw regex substitution on the response body.
//
// Unlike the earlier version of this script, this is scoped to
// CONFIG.targetHosts like every other adapter — it no longer intercepts
// every HTTPS request the device makes regardless of domain.

'use strict';

const { runPipeline, shouldIntercept } = require('../core/pipeline');
const { byteLength, safeParseJson } = require('../core/utils');
const { TARGET_HOSTS, LOCK_FIELDS } = require('../core/config');

const CONFIG = {
  enabled: true,
  debug: true,
  targetHosts: TARGET_HOSTS,
  lockFields: LOCK_FIELDS,
};

proxy.onResponse(function (request, response) {
  if (!CONFIG.enabled) return response;

  try {
    if (!shouldIntercept(request.hostname, CONFIG.targetHosts)) return response;

    if (CONFIG.debug) console.log('[Broad Fallback] Intercepting:', request.hostname + request.path);
    return processResponse(request, response);
  } catch (error) {
    if (CONFIG.debug) console.error('[Broad Fallback] Error:', error);
    return response;
  }
});

function processResponse(request, response) {
  const parsed = safeParseJson(response.body);

  if (!parsed) {
    return regexFallback(response);
  }

  let modified = false;
  const original = JSON.stringify(parsed);

  // Pass 1: known field shapes via the shared pipeline.
  const piped = runPipeline(parsed, request.path, { permanent: false });
  let body = piped.body;
  modified = modified || piped.modified;

  // Pass 2: unknown field names that merely look lock-related. This is
  // the genuinely "broad" part of broad-fallback — a wider net than the
  // structured detectors know about, still bounded to target hosts.
  if (bruteForceModify(body, CONFIG.lockFields, CONFIG.debug)) modified = true;

  if (!modified || JSON.stringify(body) === original) return response;

  const newResponse = { ...response, body: JSON.stringify(body) };
  if (newResponse.headers['content-length']) {
    newResponse.headers['content-length'] = String(byteLength(newResponse.body));
  }
  if (CONFIG.debug) console.log('[Broad Fallback] ✓ Modified response');
  return newResponse;
}

// Deep traversal: for any field whose name matches a lock keyword, force
// it toward an "unlocked" value based on its own type/name, without
// needing to know the exact field shape in advance.
function bruteForceModify(obj, lockFields, debug) {
  let modified = false;
  if (!obj || typeof obj !== 'object') return false;

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const keyLower = key.toLowerCase();
    const isLockField = lockFields.some((word) => keyLower.includes(word));

    if (isLockField) {
      if (typeof value === 'boolean' && keyLower.includes('lock') && value === true) {
        obj[key] = false;
        modified = true;
        if (debug) console.log('[Broad Fallback] Flipped boolean field:', key);
      } else if (typeof value === 'boolean' && (keyLower.includes('allow') || keyLower.includes('enable'))) {
        obj[key] = true;
        modified = true;
      } else if (typeof value === 'string' && value.toUpperCase().includes('LOCK')) {
        obj[key] = value.replace(/LOCK/gi, 'UNLOCK');
        modified = true;
      }
    }

    if (value && typeof value === 'object') {
      if (bruteForceModify(value, lockFields, debug)) modified = true;
    }
  });

  return modified;
}

// Only reached for target-host responses that aren't valid JSON at all
// (XML/plain-text APIs). Same substitutions as before, just host-scoped.
function regexFallback(response) {
  if (typeof response.body !== 'string') return response;

  const original = response.body;
  let body = original
    .replace(/"locked"\s*:\s*true/gi, '"locked":false')
    .replace(/"isLocked"\s*:\s*true/gi, '"isLocked":false')
    .replace(/"status"\s*:\s*"LOCKED"/gi, '"status":"UNLOCKED"')
    .replace(/<[Ll]ocked>true<\/[Ll]ocked>/g, (m) => m.replace('true', 'false'))
    .replace(/locked=true/gi, 'locked=false');

  if (body === original) return response;

  const newResponse = { ...response, body };
  if (CONFIG.debug) console.log('[Broad Fallback] ✓ Regex-modified non-JSON response');
  return newResponse;
}

console.log('[Broad Fallback] Loaded — targeting', CONFIG.targetHosts.length, 'hosts');
