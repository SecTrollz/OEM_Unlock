// == Proxy Pin OEM Unlock Script ==
// Runtime: Proxy Pin Android app (Settings > Script Management).
// Runs the pipeline in permanent mode: adds anti-relock metadata on top of
// the standard unlock fields, meant to survive future carrier re-checks.

'use strict';

const { runPipeline, shouldIntercept } = require('../core/pipeline');
const { byteLength, safeParseJson, generateUnlockToken } = require('../core/utils');
const { TARGET_HOSTS } = require('../core/config');

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
