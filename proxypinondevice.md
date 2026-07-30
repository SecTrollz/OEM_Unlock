Proxy Pin Android App Configuration for Permanent OEM Unlock

Here's the complete setup for using the Proxy Pin Android App from the Play
Store to permanently unlock the greyed-out OEM toggle and prevent carrier
relocking.

📱 Proxy Pin Android App Configuration

1. Main Proxy Script

Use [`proxypin-oem-unlock.js`](proxypin-oem-unlock.js) — generated from
[`src/adapters/proxypin-android.template.js`](src/adapters/proxypin-android.template.js).
This is the one variant that runs the pipeline in **permanent mode**: on
top of the standard unlock fields, it stamps the anti-relock metadata
(`carrier_enforceable: false`, `future_lock_prevention`, etc.) meant to
survive future carrier re-checks.

Open the file on GitHub, copy the full contents, and save it in
**Proxy Pin App > Scripts > oem-unlock.js**.

🔧 Proxy Pin App Setup Instructions

1. Install and Configure Proxy Pin App

Step-by-Step:

1. Install "Proxy Pin" from Google Play Store
2. Open the app and grant VPN permissions
3. Go to Settings > Script Management
4. Create new script and paste the code from `proxypin-oem-unlock.js`
5. Enable the script and start the proxy

2. Device Network Configuration

In Proxy Pin App:

```javascript
// Additional network configuration
proxy.setConfig({
    port: 8080,
    mode: 'HTTP_HTTPS',
    certificate: 'system', // Use system certificate store
    bypass: [] // No bypass - capture all traffic
});
```

WiFi Proxy Setup (Alternative):

1. Go to Settings > Wi-Fi
2. Long-press your connected network → Modify network
3. Show advanced options → Set proxy to Manual
4. Proxy hostname: `127.0.0.1` Port: `8080`

3. Certificate Installation for HTTPS

In Proxy Pin App:

1. Go to Certificate section
2. Download and install the Proxy Pin CA certificate
3. Enable SSL Decryption in settings
4. Set certificate to System Trusted

Manual Certificate Install:

1. Download certificate from Proxy Pin
2. Go to Settings > Security > Encryption & credentials
3. Install certificate > CA certificate
4. Select the downloaded file

🛡️ Anti-Relock Protection Script

Use [`anti-relock.js`](anti-relock.js) — generated from
[`src/adapters/anti-relock.template.js`](src/adapters/anti-relock.template.js).
It's a request-side companion to `proxypin-oem-unlock.js`: it blocks
outgoing carrier-lock requests and stamps permanent-unlock flags onto
outgoing unlock requests. Same setup — paste the full file into a second
Proxy Pin script.

📋 Step-by-Step Unlock Procedure

Phase 1: Initial Setup

1. Install Proxy Pin from Play Store
2. Load `proxypin-oem-unlock.js` and `anti-relock.js` as two scripts in the app
3. Start the proxy and grant VPN permissions
4. Verify interception by visiting a website

Phase 2: Trigger OEM Unlock Check

1. Go to Settings > Developer options
2. Find OEM unlocking toggle
3. Wait for interception — check Proxy Pin logs
4. Verify successful modification in logs

Phase 3: Permanent Unlock Activation

1. Toggle OEM unlocking to ON position
2. Reboot device to apply changes
3. Verify toggle remains enabled after reboot
4. Check bootloader status via fastboot

Phase 4: Anti-Relock Verification

1. Simulate carrier check by inserting different SIM
2. Monitor Proxy Pin logs for relock attempts
3. Verify permanent flags are maintained
4. Test reboot persistence

🔍 Monitoring and Maintenance

Persistence Check:

`proxypin-oem-unlock.js` writes its last unlock state to `localStorage`
(where available) via `saveUnlockState()` — check Proxy Pin's script logs
after a reboot to confirm the permanent flags were still applied on the
next provisioning check.

🚨 Troubleshooting Common Issues

Issue: Toggle Still Greyed Out

Solution:

1. Check Proxy Pin is capturing traffic
2. Verify script is enabled and running
3. Check certificate is properly installed
4. Try different WiFi networks

Issue: Relocking After Reboot

Solution:

1. Ensure `anti-relock.js` is active
2. Check permanent flags in modified responses (Proxy Pin logs)
3. Verify carrier restriction removal
4. Monitor for new carrier API endpoints — see `commonissues.md`

Issue: HTTPS Interception Failing

Solution:

1. Reinstall Proxy Pin certificate
2. Enable SSL decryption in settings
3. Check app has VPN permissions
4. Try with HTTP endpoints first

This configuration should provide permanent OEM unlocking with robust
anti-relock protection using only the Proxy Pin Android app.
