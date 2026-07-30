// == Anti-Relock Protection Script ==
// Runtime: Proxy Pin Android app, request-side hook.
// Blocks outgoing carrier-lock requests and stamps permanent-unlock flags
// onto outgoing unlock requests.

'use strict';

const { REQUEST_GUARD_KEYWORDS } = require('../core/config');

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
