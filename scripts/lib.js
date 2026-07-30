// Shared helpers for scripts/setup.js and scripts/start.js — one
// implementation of "build the scripts," "make a cert," "find my
// computer's address," and "is X installed," used by both the quiet
// power-user command and the interactive wizard.

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CERTS_DIR = path.join(ROOT, 'certs');
const KEY_PATH = path.join(CERTS_DIR, 'key.pem');
const CERT_PATH = path.join(CERTS_DIR, 'cert.pem');
const PROXY_PORT = 8080;

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  return result.status === 0;
}

function hasBinary(cmd) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]);
  return result.status === 0;
}

function buildScripts() {
  return run('node', ['build.js']);
}

// Generates certs/{key,cert}.pem if they don't already exist. Returns
// 'exists' | 'generated' | 'skipped' (no openssl) | 'failed'.
function ensureCert() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) return 'exists';
  if (!hasBinary('openssl')) return 'skipped';

  fs.mkdirSync(CERTS_DIR, { recursive: true });
  const ok = run('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048',
    '-keyout', KEY_PATH, '-out', CERT_PATH,
    '-days', '365', '-nodes',
    '-subj', '/CN=oem-unlock-local',
  ]);
  return ok ? 'generated' : 'failed';
}

// Best-effort "the address your phone should point its proxy at" — the
// first non-internal IPv4 address on this machine. null if none found
// (e.g. no network connection), in which case the wizard falls back to
// telling the user how to look it up themselves.
function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

module.exports = {
  ROOT,
  CERTS_DIR,
  KEY_PATH,
  CERT_PATH,
  PROXY_PORT,
  run,
  hasBinary,
  buildScripts,
  ensureCert,
  getLocalIp,
};
