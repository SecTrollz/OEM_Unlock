// == OEM Unlock Proxy Pin Configuration ==
// Runtime: Proxy Pin browser extension (global `proxy`), standalone
// `window.proxyPin`, or plain Node (for local testing via module.exports).

'use strict';

const { runPipeline, shouldIntercept } = require('../core/pipeline');
const { byteLength, safeParseJson } = require('../core/utils');
const { TARGET_HOSTS } = require('../core/config');

(function () {
  const CONFIG = {
    enabled: true,
    debug: true,
    permanent: false,
    targetHosts: TARGET_HOSTS,
  };

  function interceptOemUnlock(response) {
    if (!CONFIG.enabled) return response;

    try {
      const url = new URL(response.url);
      if (!shouldIntercept(url.hostname, CONFIG.targetHosts)) return response;

      if (CONFIG.debug) console.log(`[OEM Unlock] Intercepting: ${url.hostname}${url.pathname}`);
      return processResponse(response, url.pathname);
    } catch (error) {
      if (CONFIG.debug) console.error('[OEM Unlock] Interception error:', error);
      return response;
    }
  }

  function processResponse(response, pathname) {
    const modifiedResponse = { ...response };
    const contentType = (modifiedResponse.headers['content-type'] || '').toLowerCase();
    const isJson = contentType.includes('json') || pathname.includes('json');
    if (!isJson) {
      if (CONFIG.debug) console.log(`[OEM Unlock] Non-JSON content, skipping: ${contentType}`);
      return modifiedResponse;
    }

    const parsedBody = safeParseJson(modifiedResponse.body);
    if (!parsedBody) return modifiedResponse;

    const { modified, body } = runPipeline(parsedBody, pathname, { permanent: CONFIG.permanent });
    if (!modified) return modifiedResponse;

    modifiedResponse.body = JSON.stringify(body);
    if (modifiedResponse.headers['content-length']) {
      modifiedResponse.headers['content-length'] = String(byteLength(modifiedResponse.body));
    }
    if (CONFIG.debug) console.log('[OEM Unlock] ✓ Response modified successfully');

    return modifiedResponse;
  }

  if (typeof proxy !== 'undefined') {
    proxy.onResponse(function (request, response) {
      return interceptOemUnlock(response);
    });
    console.log('[OEM Unlock] Proxy Pin handler registered');
  } else if (typeof window !== 'undefined' && window.proxyPin) {
    window.proxyPin.addResponseInterceptor(interceptOemUnlock);
    console.log('[OEM Unlock] Window proxyPin handler registered');
  } else {
    console.log('[OEM Unlock] Script loaded - configure your proxy to use this interceptor');
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { interceptOemUnlock, CONFIG };
  }
})();
