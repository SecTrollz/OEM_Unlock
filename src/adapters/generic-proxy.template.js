// == OEM Unlock Proxy Script ==
// Targets Google's AFW Provisioning APIs to force OEM unlock capability.
// Runtime: a generic scripting proxy (MITMproxy/Burp-style) that exposes a
// global `proxy.onResponse(request, response)` hook.

'use strict';

const { runPipeline, shouldIntercept } = require('../core/pipeline');
const { byteLength, decompressGzip, safeParseJson } = require('../core/utils');
const { TARGET_HOSTS } = require('../core/config');

const CONFIG = {
  enabled: true,
  debug: true,
  permanent: false,
  targetHosts: TARGET_HOSTS,
};

proxy.onResponse(function (request, response) {
  if (!CONFIG.enabled) return response;
  if (!shouldIntercept(request.hostname, CONFIG.targetHosts)) return response;

  if (CONFIG.debug) console.log(`[OEM Unlock] Intercepting: ${request.hostname}${request.path}`);

  const contentType = (response.headers['content-type'] || '').toLowerCase();
  const isJson = contentType.includes('json') || request.path.includes('json');
  if (!isJson && CONFIG.debug) {
    console.log(`[OEM Unlock] Non-JSON content-type, attempting anyway: ${contentType}`);
  }

  let responseBody = response.body;
  const { body: decompressed, decompressed: didDecompress } = decompressGzip(responseBody, response.headers);
  if (didDecompress) {
    responseBody = decompressed;
    delete response.headers['content-encoding'];
    if (CONFIG.debug) console.log('[OEM Unlock] Decompressed gzip response');
  }

  const respJson = safeParseJson(responseBody);
  if (!respJson) {
    if (CONFIG.debug) console.log('[OEM Unlock] Response is not JSON, skipping');
    return response;
  }

  const { modified, body } = runPipeline(respJson, request.path, { permanent: CONFIG.permanent });
  if (!modified) return response;

  response.body = JSON.stringify(body);
  if (response.headers['content-length']) {
    response.headers['content-length'] = String(byteLength(response.body));
  }

  console.log('[OEM Unlock] ✓ Successfully modified response for OEM unlock');
  return response;
});

console.log('[OEM Unlock] Proxy script loaded - ready to intercept Google provisioning APIs');
