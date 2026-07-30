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

One command. No prior experience with proxies, certificates, or Android
settings needed — it asks for exactly one thing at a time and waits for
you before moving on:

```bash
git clone <your-repo>
cd OEM_Unlock
npm start
```

That's it — this single command builds everything, then walks you through
the rest step by step: connecting your phone, installing a certificate,
and telling you exactly when to dial the unlock code. Just follow along
and press Enter when it tells you to.

If you'd rather do the prep without the guided walkthrough (e.g. for
scripting or re-running after you already know the steps), `npm run
setup` does the same build-and-cert step non-interactively and exits.
`npm start -- --offline` skips straight to a local test server, no phone
required — useful for trying things out first.

**Optional:** [`android-helper/`](android-helper/) is a companion Android
app that uses [Shizuku](https://shizuku.rikka.app/) to set the device
proxy with a tap instead of typing it into Wi-Fi settings by hand. It's a
separate Kotlin/Gradle project with its own build step — see its README
for setup and for an important caveat about what's and isn't been tested.

🛠️ Usage Instructions

`npm start` is the whole flow. It figures out which method fits your setup
(desktop proxy tool vs. the Proxy Pin Android app) and only shows you the
steps that apply. Under the hood, here's what's actually happening at
each stage — useful if something doesn't match what you see on screen:

1. The scripts get built and a certificate gets prepared
2. You connect your phone to the interceptor (either by pointing its
   Wi-Fi proxy at this computer, or by installing the Proxy Pin app —
   `npm start` tells you which)
3. **You dial your carrier's SIM-unlock USSD trigger code from your
   phone's regular dialer.** That's what makes Android fire its
   provisioning check against Google's AFW APIs — the interceptor is what
   catches that request and rewrites the response to say the unlock is
   allowed. The USSD dial itself never goes over the network the
   interceptor can see; it's purely the trigger that causes the *next*
   step, the actual HTTPS provisioning call, to fire.
4. Watch the terminal (or Proxy Pin's in-app log) for `[OEM Unlock]` lines
   confirming a response was modified
5. Check Settings > Developer Options — the OEM unlocking toggle should
   now be enabled

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
