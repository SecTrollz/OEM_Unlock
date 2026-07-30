Common issues with Proxy Pin and OEM unlocking, and how to work through them.

🔥 MAIN PROBLEMS & SOLUTIONS

1. PROXY PIN NOT CAPTURING TRAFFIC

```javascript
// Add this debug to verify interception
proxy.onRequest(function(request) {
    console.log("🔍 REQUEST CAPTURED:", request.hostname + request.path);
    return request;
});

proxy.onResponse(function(request, response) {
    console.log("📡 RESPONSE CAPTURED:", request.hostname, response.status);
    return response;
});
```

Check:

- Is Proxy Pin VPN actually running? (red VPN icon in status bar)
- Did you grant VPN permissions?
- Is there another VPN/app conflicting?

2. GOOGLE API ENDPOINTS CHANGED

Carriers and Google both change endpoints over time. The canonical target
host list lives in one place now — [`src/core/config.js`](src/core/config.js)
(`TARGET_HOSTS`) — instead of being copied and re-copied across every
script and doc. If you find traffic to a provisioning-related host that
isn't in that list:

1. Add it to `TARGET_HOSTS` in `src/core/config.js`
2. Run `npm run build` to regenerate all six scripts with the new host included
3. Reload the updated script into your proxy tool

3. HTTPS/CERTIFICATE ISSUES

```bash
# Check if certificate is installed
adb shell settings get global captive_portal_https_url

# Reinstall certificate
adb push mitmproxy-ca-cert.pem /sdcard/
adb shell am start -n com.android.certinstaller/.CertInstallerMain
```

4. SCRIPT NOT LOADING PROPERLY

Test with this minimal script first to confirm interception is working at
all, independent of the unlock logic:

```javascript
// MINIMAL TEST SCRIPT - PROVE INTERCEPTION WORKS
proxy.onResponse(function(request, response) {
    console.log("🎯 INTERCEPTING:", request.hostname);

    if (request.hostname.includes("google")) {
        console.log("✅ Google API intercepted!");

        try {
            let body = typeof response.body === 'string' ?
                      JSON.parse(response.body) : response.body;

            body.proxy_pin_test = "SCRIPT_IS_WORKING_" + Date.now();

            response.body = JSON.stringify(body);
            console.log("✅ Response modified!");
        } catch(e) {
            console.log("❌ JSON parse error:", e.message);
        }
    }

    return response;
});
```

5. CARRIER-SPECIFIC APIS

Different carriers use different APIs beyond Google's own endpoints. If
you identify one, add it to `TARGET_HOSTS` in `src/core/config.js` the same
way as step 2 above, rather than hardcoding a separate list here.

🚨 IMMEDIATE DEBUGGING STEPS

Step 1: Verify Proxy Pin is Working

```javascript
console.log("🔊 PROXY PIN SCRIPT LOADED!");

proxy.onRequest(function(request) {
    if (request.hostname.includes("google")) {
        console.log("📡 CAPTURED GOOGLE TRAFFIC:", request.url);
    }
    return request;
});
```

Step 2: Check What's Being Intercepted

In Proxy Pin app:

1. Go to Logs tab
2. Look for any Google API traffic
3. If nothing appears → VPN not working
4. If traffic appears but not modified → script issue, or the hostname isn't in `TARGET_HOSTS` yet

Step 3: Test with Simple Modification

```javascript
proxy.onResponse(function(request, response) {
    if (request.hostname.includes("googleapis.com")) {
        console.log("🎯 FOUND GOOGLE API - MODIFYING");

        try {
            let body = JSON.parse(response.body);
            body._proxy_test = Date.now();
            response.body = JSON.stringify(body);
            console.log("✅ SUCCESS: Response modified");
        } catch(e) {
            console.log("❌ FAILED:", e.message);
        }
    }
    return response;
});
```

Step 4: Check Device-Specific Issues

Some devices need additional steps:

```bash
# Clear Google Play Services cache (often blocks unlocks)
adb shell pm clear com.google.android.gms

# Reset carrier services
adb shell pm clear com.google.android.ims
```

💀 COMMON FAILURE MODES

Problem: "Script loaded but no logs"

Solution: Proxy Pin VPN not active or conflicting with another VPN

Problem: "Traffic captured but not modified"

Solution: JSON parsing error, wrong content-type, or the hostname isn't in
`TARGET_HOSTS` — check `src/core/config.js`

Problem: "OEM toggle still greyed out"

Solution: Wrong API endpoint or carrier-specific lock — see `nuclear_unlock.js`
(`Nuke-unlock-doc.md`) for the broader-net fallback

Problem: "HTTPS interception failing"

Solution: Certificate not properly installed

🛠️ WIDER-NET DEBUGGING

If you need to see everything hitting Google-related domains to find the
right endpoint before adding it to `TARGET_HOSTS`, log broadly first
(temporarily — don't ship this as your actual interceptor):

```javascript
// LOG EVERYTHING to find the right endpoint, then add it to
// src/core/config.js and go back to the real scripts
proxy.onResponse(function(request, response) {
    if (request.url.startsWith("https")) {
        console.log("🌐 HTTPS TRAFFIC:", request.hostname + request.path);
    }

    if (request.hostname.includes('google') ||
        request.path.includes('device') ||
        request.path.includes('unlock') ||
        request.path.includes('provision') ||
        request.path.includes('policy')) {
        console.log("🎯 POTENTIAL TARGET:", request.url);
    }

    return response;
});
```

📱 PROXY PIN APP SPECIFIC ISSUES

In the Proxy Pin app, make sure:

1. VPN permission granted
2. Script enabled (toggle on)
3. Certificate installed (green checkmark)
4. No other VPN running
5. WiFi/Mobile data working normally

Test with:

1. Open Chrome and visit http://google.com
2. Check Proxy Pin logs for traffic
3. If no traffic → VPN issue
4. If traffic but no modification → script issue

The Proxy Pin logs will usually tell you exactly what's wrong — check them
first before changing anything.
