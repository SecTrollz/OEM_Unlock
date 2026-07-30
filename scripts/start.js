#!/usr/bin/env node
// The one command: `npm start`.
//
// Builds everything, then walks you through the rest one plain-language
// step at a time — pausing after each one so you can go do it on your
// phone before coming back. No prior knowledge of proxies, certificates,
// or Android settings assumed; every step says exactly what to tap.
//
// `npm start -- --offline` skips straight to the local test server,
// no phone required.

'use strict';

const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');
const {
  ROOT,
  PROXY_PORT,
  hasBinary,
  buildScripts,
  ensureCert,
  getLocalIp,
} = require('./lib');

const offlineOnly = process.argv.includes('--offline');
const isTTY = Boolean(process.stdin.isTTY);

function bold(s) {
  return isTTY ? `\x1b[1m${s}\x1b[0m` : s;
}

function heading(text) {
  console.log('\n' + bold(text));
  console.log(bold('-'.repeat(text.length)));
}

// Pauses for the user to go do something on their phone, then continue.
// If there's no interactive terminal attached (CI, piped input), don't
// hang — just note that and move on immediately.
function pause(message) {
  if (!isTTY) {
    console.log(`${message}\n(no interactive terminal detected — continuing automatically)\n`);
    return Promise.resolve();
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message}\n>>> Press ENTER when you've done this... `, () => {
      rl.close();
      console.log('');
      resolve();
    });
  });
}

function startOfflineMockServer() {
  console.log('\nStarting the local test server on http://localhost:3000 ...\n');
  return spawn(process.execPath, [path.join(ROOT, 'mock-server.js')], { cwd: ROOT, stdio: 'inherit' });
}

async function runDesktopProxyPath() {
  const ip = getLocalIp();

  heading('STEP 1 of 4 — Connect your phone to this computer');
  console.log(`Your computer's address: ${bold(ip || '(couldn\'t detect it — check your Wi-Fi settings for "IP address")')}`);
  console.log(`Port: ${bold(String(PROXY_PORT))}`);
  console.log(`
On your phone:
  Settings → Wi-Fi → tap your network → Modify network → Advanced
  Set "Proxy" to Manual
  Proxy hostname: ${ip || '<this computer\'s IP address>'}
  Proxy port: ${PROXY_PORT}`);
  await pause('Go do that now.');

  heading('STEP 2 of 4 — Install the security certificate');
  console.log(`
On your phone, open a web browser and go to:
  http://mitm.it

Tap the Android icon, download the certificate, and install it
(any name is fine when it asks).`);
  await pause('Go do that now.');

  heading('STEP 3 of 4 — Trigger the unlock');
  console.log(`
📱  Open your phone's dialer app
📞  Type your carrier's SIM-unlock code (ask your carrier if you don't have it)
☎️   Press call

Watch below — you'll see "[OEM Unlock]" lines appear when it works. ✅
Press Ctrl+C here when you're done.`);

  heading('STEP 4 of 4 — Listening for the unlock request...');
  const proc = spawn('mitmproxy', ['-s', path.join(ROOT, 'oem_unlock.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  proc.on('exit', (code) => process.exit(code || 0));
}

async function runProxyPinPath() {
  heading("STEP 1 of 4 — Install \"Proxy Pin\" on your phone");
  console.log(`
Open the Play Store on your phone and install the free app
called "Proxy Pin".`);
  await pause('Go do that now.');

  heading('STEP 2 of 4 — Load the unlock script');
  console.log(`
1. Open Proxy Pin and grant it VPN permission when it asks
2. Go to Scripts → New Script
3. On this computer, open the file: ${bold('proxypin-oem-unlock.js')}
4. Copy ALL of its text and paste it into Proxy Pin
5. Turn the script ON`);
  await pause('Go do that now.');

  heading('STEP 3 of 4 — Turn on the certificate');
  console.log(`
1. In Proxy Pin, go to the Certificate section
2. Tap Install / Download Certificate
3. Follow the on-screen steps to trust it`);
  await pause('Go do that now.');

  heading('STEP 4 of 4 — Trigger the unlock');
  console.log(`
📱  Open your phone's dialer app
📞  Type your carrier's SIM-unlock code (ask your carrier if you don't have it)
☎️   Press call

Watch Proxy Pin's log inside the app — you'll see "[OEM Unlock]"
lines appear when it works. ✅

(This window is running a local test server in the background, in
case you want to try the offline walkthrough first — see
HOW-TO-WITH-PROXYPIN-OFFLINE.md. Press Ctrl+C to stop it.)`);
  startOfflineMockServer();
}

async function main() {
  console.log(bold('\n🔓  OEM UNLOCK — EASY MODE\n'));
  console.log("This walks you through unlocking your phone's OEM unlock");
  console.log('toggle, one step at a time. Nothing technical required —');
  console.log("just follow along and tap what it says.\n");

  if (offlineOnly) {
    console.log("Offline mode: no phone needed, just testing the scripts locally.");
    startOfflineMockServer();
    return;
  }

  console.log('Getting things ready...');
  if (!buildScripts()) {
    console.error('\nSomething went wrong building the scripts — see the error above.');
    process.exit(1);
  }
  console.log('  ✓ Unlock scripts ready');

  const certResult = ensureCert();
  if (certResult === 'generated' || certResult === 'exists') {
    console.log('  ✓ Certificate ready');
  }

  if (hasBinary('mitmproxy')) {
    await runDesktopProxyPath();
  } else {
    console.log('  (Using the phone-only method — no extra software needed on this computer.)');
    await runProxyPinPath();
  }
}

main();
