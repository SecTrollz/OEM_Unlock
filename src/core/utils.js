'use strict';

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

module.exports = { getNested, setNested, byteLength, decompressGzip, generateUnlockToken, safeParseJson };
