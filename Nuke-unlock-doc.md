BROAD-SPECTRUM OEM UNLOCK FALLBACK

A wider-net fallback for when the standard scripts (`oem_unlock.js`,
`oem_unlock_proxy_pin.js`, `proxypin-oem-unlock.js`) don't find a matching
field on your device's provisioning responses.

🎯 The Script

Use [`nuclear_unlock.js`](nuclear_unlock.js) — generated from
[`src/adapters/broad-fallback.template.js`](src/adapters/broad-fallback.template.js).
Open it on GitHub and copy the whole file into your proxy tool; it's
self-contained.

**This is scoped to the same target hostnames as every other script in the
repo** (see [`src/core/config.js`](src/core/config.js)) — it does not
intercept every HTTPS request your device makes. What makes it "broad" is
that, for those target hosts, it also sweeps for lock-related field names
the structured detectors don't already know about, and falls back to raw
regex substitution if a response isn't valid JSON at all.

🚨 IMMEDIATE DEPLOYMENT COMMANDS

For Proxy Pin Android App:

1. Open [`nuclear_unlock.js`](nuclear_unlock.js) on GitHub, copy the full contents
2. Open Proxy Pin app → Scripts → New Script
3. Paste the script
4. Enable and start the proxy

For Desktop Proxy Tools:

```bash
# Burp Suite: Extender → Add → Select file
# MITMproxy: mitmproxy -s nuclear_unlock.js
# Charles: Tools → External Proxy Settings
```

💀 WHAT THIS SCRIPT DOES:

1. TARGETS THE SAME HOSTS AS THE OTHER SCRIPTS

- Every hostname in `src/core/config.js`'s `TARGET_HOSTS`
- JSON, XML, and plain-text response bodies

2. MULTI-LAYER MODIFICATION

- The same detect→modify pipeline as `oem_unlock.js`
- A wider field-name sweep for anything not already covered
- Regex substitution as a last resort for non-JSON bodies

3. WHY THIS IS THE FALLBACK, NOT THE FIRST TRY

Start with `oem_unlock.js` or the Proxy Pin variant. Reach for this one
only if those don't find anything on your device's actual responses — the
wider field sweep here is more likely to catch a field the maintainers
haven't seen yet, at the cost of being less precise about what it touches.

🔥 DEPLOYMENT CHECKLIST:

- Proxy Pin VPN active (red icon in status bar)
- Script loaded and enabled in Proxy Pin
- Certificate installed for HTTPS interception
- No other VPNs running
- WiFi/Mobile data working
- Developer options accessible
- OEM unlocking toggle visible (even if greyed out)

📱 TESTING PROCEDURE:

1. Start Proxy Pin with this script
2. Go to Settings → Developer options
3. Tap OEM unlocking repeatedly
4. Watch Proxy Pin logs for interception messages
5. Toggle should become enabled within 30 seconds

🚨 IF THIS STILL DOESN'T WORK:

The problem is very likely one of these — not the interception logic:

1. Proxy Pin not capturing traffic → check VPN status
2. Certificate not installed → reinstall the CA certificate
3. Device-specific hardware lock → may need a different approach
4. Carrier-specific SIM lock → try a different SIM card
5. The endpoint you're hitting isn't in `TARGET_HOSTS` → check Proxy Pin's
   traffic log for the actual hostname and add it to
   [`src/core/config.js`](src/core/config.js), then `npm run build`
