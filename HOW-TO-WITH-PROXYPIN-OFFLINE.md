Local Proxy Pin Configuration for OEM Unlock Bypass

Here's how to set up the OEM unlock script to work fluently with Proxy Pin for local, offline operation.

🎯 Proxy Pin Configuration Script

The script itself lives at [`oem_unlock_proxy_pin.js`](oem_unlock_proxy_pin.js) in
the repo root. It's generated from [`src/adapters/proxypin-extension.template.js`](src/adapters/proxypin-extension.template.js) —
see [`ARCHITECTURE.md`](ARCHITECTURE.md) for why it's generated rather than
hand-written, and don't edit the generated file directly (`npm run build`
regenerates it and would overwrite any manual edits).

Open the generated file on GitHub and copy its full contents into Proxy
Pin's script editor — the file is self-contained (no imports), so pasting
the whole thing is all that's needed.

🔧 Proxy Pin Setup Instructions

1. Install Proxy Pin

```bash
# Method 1: Chrome Extension
# Install "Proxy Pin" from Chrome Web Store

# Method 2: Standalone
npm install -g proxy-pin
# or
yarn global add proxy-pin
```

2. Local Configuration (illustrative)

If your proxy tool of choice supports a config-file style setup rather than
pasting a script directly, it will look something like this — wire the
generated interceptor into whatever `rules`/`response` hook your specific
tool exposes:

```javascript
// example only — adapt to your proxy tool's actual config format
const { interceptOemUnlock } = require('./oem_unlock_proxy_pin.js');

module.exports = {
    port: 8080,
    ssl: true,
    rules: [
        {
            url: /googleapis\.com/,
            response: (req, res) => interceptOemUnlock(res),
        },
    ],
    certs: {
        key: './certs/key.pem',
        cert: './certs/cert.pem',
    },
};
```

3. Offline Mock Server

[`mock-server.js`](mock-server.js) is a small Node `http` server serving
canned JSON for `/v1/device/provisioning` and `/v1/device/unlock`, for
testing without hitting real Google endpoints. Run it with:

```bash
npm run start-offline
```

4. Hosts File Modification

Add to `/etc/hosts` (Windows: `C:\Windows\System32\drivers\etc\hosts`):

```bash
127.0.0.1 afwprovisioning-pa.googleapis.com
127.0.0.1 android.clients.google.com
127.0.0.1 android.googleapis.com
```

5. Start Local Proxy

```bash
# Start the mock server
npm run start-offline
```

Then load `oem_unlock_proxy_pin.js` into your proxy tool of choice
(Chrome extension script editor, or your proxy's script directory).

📱 Device Configuration for Local Proxy

Android ADB Commands:

```bash
# Set proxy to local machine
adb shell settings put global http_proxy 192.168.1.100:8080
```

```bash
# Install local CA certificate
adb push ./certs/mitmproxy-ca-cert.pem /sdcard/
adb shell am start -n com.android.certinstaller/.CertInstallerMain -a android.intent.action.VIEW -t application/x-x509-ca-cert -d file:///sdcard/mitmproxy-ca-cert.pem
```

Alternative: Use Proxy Pin's built-in certificate.

WiFi Proxy Settings:

1. Go to WiFi settings → Modify network → Advanced
2. Set proxy to your computer's local IP and port 8080
3. Install certificate from your proxy tool's certificate URL

🔍 Testing Offline Operation

1. Block Internet Access

```bash
# Block Google APIs to force local responses
sudo iptables -A OUTPUT -p tcp --dport 443 -d googleapis.com -j DROP
```

2. Verify Local Responses

```javascript
// Test script - test-local.js
const http = require('http');

const testRequest = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/v1/device/provisioning',
    method: 'GET'
};

const req = http.request(testRequest, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', JSON.parse(data)));
});

req.end();
```

🚀 Quick Start Commands

```bash
# 1. Clone and setup
git clone <your-repo>
cd OEM_Unlock
```
```bash
# 2. Regenerate the interceptor scripts from source (no dependencies to install)
npm run build
```
```bash
# 3. Generate certificates (only needed for HTTPS interception with a
# generic scripting proxy — Proxy Pin's built-in certificate covers most
# setups without this step)
mkdir certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```
```bash
# 4. Start the offline mock server
npm run start-offline
```

This ensures complete offline operation with Proxy Pin, using the local
mock server when Google APIs are unavailable.
