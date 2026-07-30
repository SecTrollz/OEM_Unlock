<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-lockup-dark.svg">
  <img alt="OEM_UNLOCK — Provisioning Bypass Toolkit" src="assets/logo-lockup.svg" width="420">
</picture>

A powerful proxy script designed to bypass carrier restrictions and enable OEM unlocking on Android devices by intercepting and modifying Google's provisioning API responses.

See [`BRANDING.md`](BRANDING.md) for the logo and brand design blueprint.

⚠️ Important Disclaimer

This tool is for educational and research purposes only. Use at your own risk.

· May violate device warranties and carrier agreements
· Could potentially breach terms of service
· Use only on devices you own
· Not responsible for bricked devices or legal consequences
· Some regions have laws against carrier unlocking

🎯 Purpose

This script intercepts communications between your device and Google's AFW (Android for Work) provisioning services to:

· Remove carrier restrictions on OEM unlocking
· Enable greyed-out OEM unlock toggle switches
· Bypass enterprise policy restrictions
· Facilitate complete bootloader unlocking

🔧 How It Works

The script acts as a man-in-the-middle proxy that modifies API responses from:

· afwprovisioning-pa.googleapis.com
· android.clients.google.com
· android.googleapis.com
· Other Google provisioning endpoints

It strategically modifies response payloads to indicate that OEM unlocking is permitted, carrier restrictions are removed, and all unlock conditions are satisfied.

📋 Prerequisites

Required Tools

· Proxy Tool: Burp Suite, MITMproxy, Charles Proxy, or the Proxy Pin Android app
· Network Access: Ability to route device traffic through proxy
· Root/ADB Access: Depending on device configuration
· Technical Knowledge: Understanding of proxy setup and SSL interception

Device Requirements

· Android device with developer options enabled
· USB debugging enabled
· Bootloader in factory state (not previously unlocked)
· Physical access to the device

📁 Project Layout

The scripts you paste into your proxy tool (`oem_unlock.js`, `nuclear_unlock.js`,
etc.) are **generated** from `src/core/` + `src/adapters/` — that's the
actual source of truth, and where fixes/new fields should be made. Run
`npm run build` after editing anything in `src/` to regenerate them. See
[`ARCHITECTURE.md`](ARCHITECTURE.md) for the full breakdown of what each
file does and why it's structured this way.

🚀 Installation & Setup

Two commands, run once each per machine:

```bash
git clone <your-repo>
cd OEM_Unlock
npm run setup   # builds the scripts, generates a local cert, prints device-prep steps
npm start        # launches the interceptor (mitmproxy if installed) and tells you what's next
```

`npm run setup` builds all six interceptor scripts from `src/`, generates a
local HTTPS certificate if `openssl` is available, and prints the one-time
device-side steps (proxy settings + CA cert install) that genuinely can't
be automated from a repo script — they happen on your phone, not here.

`npm start` launches `mitmproxy -s oem_unlock.js` directly if `mitmproxy`
is installed (`pip install mitmproxy` first). If you're using the Proxy
Pin Android app instead, there's no desktop process for this command to
start — Proxy Pin runs entirely on the phone — so it prints the exact
manual steps for that path instead and starts the offline mock server as
a fallback. See `HOW-TO-WITH-PROXYPIN-OFFLINE.md`, `proxypinondevice.md`,
or `Nuke-unlock-doc.md` for which script fits your setup.

Everything from here on is manual by nature: installing a cert on a phone
and dialing a USSD code aren't things a setup script can do for you.

🛠️ Usage Instructions

Basic Flow

1. `npm run setup && npm start` (see above)
2. Confirm your device's proxy points at this machine, and the proxy
   tool's CA cert is installed on the device (both covered by `npm run setup`'s printed checklist)
3. **Go to your phone's dialer and enter your carrier's SIM-unlock USSD
   trigger code.** That's what makes Android fire its provisioning check
   against Google's AFW APIs — this proxy is what intercepts that request
   and rewrites the response to say the unlock is allowed. The USSD dial
   itself never goes over the network the proxy can see; it's purely the
   trigger that causes the *next* step, the actual HTTPS provisioning
   call, to fire.
4. Watch the proxy console (or Proxy Pin's in-app log) for `[OEM Unlock]`
   lines confirming a response was modified
5. Verify Unlock: check Settings > Developer Options — the OEM unlocking
   toggle should now be enabled

Advanced Usage

```javascript
// Enable specific device targeting in script
const allowedModels = ["Pixel 6", "Pixel 7", "SM-G998B"];
// Uncomment and modify the device model filtering section
```

Expected Success Indicators

```
[OEM Unlock] Found OEM lock status, modifying...
[OEM Unlock] Modified OEM lock: true -> false, toggle: false -> true
[OEM Unlock] ✓ Successfully modified response for full OEM unlock
```

🔍 Script Features

Multi-API Interception

· AFW Provisioning APIs
· Device management endpoints
· Carrier restriction checks
· Enterprise policy validation

Comprehensive Modification

· OEM lock status override
· Carrier restriction removal
· Policy compliance bypass
· Bootloader unlock enabling
· Success response forcing

Safety Features

· JSON validation and error handling
· Content-type checking
· Selective hostname targeting
· Modification logging

🐛 Troubleshooting

Common Issues

Proxy Not Intercepting

· Verify device proxy settings
· Check firewall rules
· Confirm SSL certificate installation

Script Not Modifying Responses

· Check hostname matching
· Verify JSON content-type
· Review proxy logs for errors

OEM Unlock Still Greyed Out

· Try different provisioning triggers
· Check for additional API endpoints
· Verify script is actively modifying responses

Debug Mode

Every generated script has a `CONFIG.debug` flag at the top (already
`true` by default) that controls verbose logging:

```javascript
const CONFIG = {
    enabled: true,
    debug: true, // set false to quiet the console output
    // ...
};
```

📝 Legal & Ethical Notes

Permitted Uses

· Research on mobile device security
· Educational demonstrations
· Unlocking carrier-locked devices you own
· Security testing on your own equipment

Prohibited Uses

· Unlocking stolen devices
· Circumventing legitimate enterprise controls
· Commercial unlocking services
· Any illegal activities

Responsibility

Users are solely responsible for:

· Compliance with local laws
· Respecting carrier agreements
· Understanding device warranty implications
· Proper usage of unlocked devices

🔒 Security Considerations

· Script only modifies specific API responses
· No permanent device modifications
· Reversible by disabling proxy
· No malware or backdoor functionality

🤝 Contributing

This is an educational resource. Improvements and ethical use cases are welcome through responsible disclosure and research-oriented contributions.

📚 References

· Android Enterprise Documentation
· OEM Unlocking Overview
· Mobile Security Research Guidelines

📄 License

Educational Use - See disclaimer section for important limitations and responsibilities.

---

Remember: With great power comes great responsibility. Use this tool ethically and legally.
