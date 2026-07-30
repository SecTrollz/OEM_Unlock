#!/usr/bin/env node
// Non-interactive prep-only command: `npm run setup`.
// Builds the scripts and generates a local cert, then exits — no prompts.
// Most people don't need to run this directly: `npm start` does the same
// prep automatically before walking through the rest. This is here for
// scripting/CI, or if you just want the files regenerated without the
// guided walkthrough.

'use strict';

const { buildScripts, ensureCert, CERTS_DIR } = require('./lib');

console.log('Building the interceptor scripts from src/ ...');
if (!buildScripts()) {
  console.error('\nBuild failed — fix the error above before continuing.');
  process.exit(1);
}

console.log('\nChecking for a local HTTPS certificate ...');
const certResult = ensureCert();
switch (certResult) {
  case 'exists':
    console.log(`Found existing certs at ${CERTS_DIR}/ — leaving them as-is.`);
    break;
  case 'generated':
    console.log(`Generated ${CERTS_DIR}/key.pem and cert.pem.`);
    break;
  case 'skipped':
    console.warn('openssl not found — skipping local cert generation.');
    console.warn("Most proxy tools (Proxy Pin, mitmproxy, Burp) can generate their own CA cert instead.");
    break;
  case 'failed':
    console.warn("openssl failed — generate certs manually or use your proxy tool's built-in certificate.");
    break;
}

console.log('\nDone. Run `npm start` for the guided walkthrough on your phone.');
