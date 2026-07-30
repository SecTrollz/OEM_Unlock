// == Pre-Unlock Request Modifier ==
// Runtime: generic scripting proxy, request-side hook.
// Strips unlock restrictions and forces unlock commands to be accepted on
// outgoing requests to Google APIs.

'use strict';

const { REQUEST_GUARD_KEYWORDS } = require('../core/config');

proxy.onRequest(function (request) {
  if (!request.hostname.includes('googleapis.com') || typeof request.body !== 'string') {
    return request;
  }

  try {
    const reqBody = JSON.parse(request.body);
    let modified = false;

    if (reqBody.restrictions) {
      delete reqBody.restrictions.disallow_oem_unlock;
      delete reqBody.restrictions.oem_unlock_disallowed;
      modified = true;
    }

    const isUnlockCommand = reqBody.command === 'UNLOCK_DEVICE' ||
      REQUEST_GUARD_KEYWORDS.unlock.includes(reqBody.action);
    if (isUnlockCommand) {
      reqBody.force = true;
      reqBody.bypass = true;
      modified = true;
    }

    if (modified) {
      request.body = JSON.stringify(reqBody);
      console.log('[OEM Unlock] Modified outgoing request to force unlock');
    }
  } catch (e) {
    // Not JSON — leave the request untouched.
  }

  return request;
});
