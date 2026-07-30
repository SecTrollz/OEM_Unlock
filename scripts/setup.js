#!/usr/bin/env node
// Single setup command: `npm run setup`.
// 1. Regenerates the pastable scripts from src/ (same as `npm run build`).
// 2. Generates a local self-signed cert for HTTPS interception, if you
//    don't already have one and openssl is available.
// 3. Prints the one-time device-prep checklist — the parts of setup that
//    genuinely can't be automated from here because they happen on your
//    phone (installing a CA cert, setting the device proxy) or need sudo
//    on this machine (writing /etc/hosts).

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CERTS_DIR = path.join(ROOT, 'certs');
const KEY_PATH = path.join(CERTS_DIR, 'key.pem');
const CERT_PATH = path.join(CERTS_DIR, 'cert.pem');

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  return result.status === 0;
}

function hasBinary(cmd) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]);
  return result.status === 0;
}

console.log('=== 1/3: Building the interceptor scripts from src/ ===');
if (!run('node', ['build.js'])) {
  console.error('\nBuild failed — fix the error above before continuing.');
  process.exit(1);
}

console.log('\n=== 2/3: Local HTTPS certificate ===');
if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
  console.log(`Found existing certs at ${CERTS_DIR}/ — leaving them as-is.`);
} else if (hasBinary('openssl')) {
  fs.mkdirSync(CERTS_DIR, { recursive: true });
  const ok = run('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048',
    '-keyout', KEY_PATH, '-out', CERT_PATH,
    '-days', '365', '-nodes',
    '-subj', '/CN=oem-unlock-local',
  ]);
  if (ok) console.log(`Generated ${CERTS_DIR}/key.pem and cert.pem.`);
  else console.warn('openssl failed — generate certs manually or use your proxy tool\'s built-in certificate instead.');
} else {
  console.warn('openssl not found — skipping local cert generation.');
  console.warn('Most proxy tools (Proxy Pin, mitmproxy, Burp) can generate/install their own CA cert instead; see the relevant .md walkthrough.');
}

console.log(`
=== 3/3: One-time device prep (do this on your phone, once) ===

1. Set your device's proxy to this machine's IP and port 8080
     Settings > Wi-Fi > (your network) > Modify network > Advanced > Proxy: Manual
2. Install your proxy tool's CA certificate on the device
     (Proxy Pin: Certificate section in the app. mitmproxy/Burp: visit
     http://mitm.it or your tool's cert URL from the device browser.)
3. Load the matching script into your proxy tool (see README's "Which
   script do I use?" table) — or just run \`npm start\`, which will try to
   launch it for you.

Setup complete. Next: npm start
`);
