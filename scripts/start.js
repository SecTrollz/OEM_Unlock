#!/usr/bin/env node
// Single run command: `npm start`.
//
// If mitmproxy is installed, this launches it with oem_unlock.js already
// loaded — that's the whole "run" step for the desktop-proxy workflow.
// After it prints "ready", go to your phone and dial your carrier's
// SIM-unlock USSD trigger code: Android's AFW provisioning check fires
// right after, this proxy intercepts it, and the response is rewritten to
// say the unlock is allowed.
//
// If you're using the Proxy Pin Android app instead, there's no desktop
// process to launch — Proxy Pin runs entirely on the phone. `npm start`
// prints that reminder instead of pretending to automate something it
// can't reach, and offers the offline mock server as a fallback so this
// command always does something useful.

'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const offlineOnly = process.argv.includes('--offline');

function hasBinary(cmd) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]);
  return result.status === 0;
}

function startOfflineMockServer() {
  console.log('\nStarting the offline mock server (npm run start-offline) on http://localhost:3000 ...');
  spawn(process.execPath, [path.join(ROOT, 'mock-server.js')], { cwd: ROOT, stdio: 'inherit' });
}

if (offlineOnly) {
  startOfflineMockServer();
} else if (hasBinary('mitmproxy')) {
  console.log('Found mitmproxy — launching with oem_unlock.js loaded on port 8080.\n');
  console.log('Once you see "Proxy script loaded" below, go to your phone:');
  console.log('  1. Confirm the device proxy points at this machine (see `npm run setup`)');
  console.log('  2. Open the dialer and enter your carrier\'s SIM-unlock USSD trigger code');
  console.log('  3. Watch this terminal for [OEM Unlock] log lines\n');

  const proc = spawn('mitmproxy', ['-s', path.join(ROOT, 'oem_unlock.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  proc.on('exit', (code) => process.exit(code || 0));
} else {
  console.log(`
mitmproxy isn't installed, so there's no desktop process for this command
to launch — that's expected if you're using the Proxy Pin Android app,
which runs entirely on the phone with no CLI to start from here.

To run with Proxy Pin (see proxypinondevice.md / Nuke-unlock-doc.md):
  1. Open the Proxy Pin app, load the script you need, and enable it there
  2. Confirm the device proxy + CA cert are set up (npm run setup)
  3. Go to your phone's dialer and enter your carrier's SIM-unlock USSD
     trigger code — watch Proxy Pin's in-app log for [OEM Unlock] lines

To run with mitmproxy instead: pip install mitmproxy, then re-run npm start.
`);
  startOfflineMockServer();
}
