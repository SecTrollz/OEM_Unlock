OEM Unlock Proxy Script

A powerful proxy script designed to bypass carrier restrictions and enable OEM unlocking on Android devices by intercepting and modifying Google's provisioning API responses.

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

· Proxy Tool: Burp Suite, MITMproxy, Charles Proxy, or similar
· Network Access: Ability to route device traffic through proxy
· Root/ADB Access: Depending on device configuration
· Technical Knowledge: Understanding of proxy setup and SSL interception

Device Requirements

· Android device with developer options enabled
· USB debugging enabled
· Bootloader in factory state (not previously unlocked)
· Physical access to the device

🚀 Installation & Setup

1. Proxy Configuration

```bash
# Using MITMproxy (Python)
pip install mitmproxy
mitmproxy -s oem_unlock_proxy.js

# Using Burp Suite
# Import the script via Extender > BApp Store > Custom Script
```

2. Device Proxy Setup

```bash
# Set up proxy on your device
adb shell settings put global http_proxy [proxy_ip]:[proxy_port]

# Or configure WiFi proxy manually in network settings
```

3. SSL Certificate Installation

```bash
# Download and install proxy CA certificate
wget http://mitm.it/cert/pem -O mitmproxy-ca-cert.pem
adb push mitmproxy-ca-cert.pem /sdcard/
# Install certificate via Security settings
```

4. Script Deployment

Copy the provided JavaScript code into your proxy's script directory or paste into the script editor of your proxy tool.

🛠️ Usage Instructions

Basic Flow

1. Start Proxy: Launch your proxy tool with the script loaded
2. Configure Device: Set device to use proxy for all traffic
3. Trigger Provisioning:
   · Go to Settings > Developer Options
   · Attempt to toggle OEM unlocking
   · Or perform factory reset to trigger provisioning
4. Monitor Logs: Watch proxy console for modification messages
5. Verify Unlock: Check if OEM unlock toggle is now enabled

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

Enable additional logging by uncommenting debug sections in the script:

```javascript
// Set to true for verbose logging
const DEBUG_MODE = true;
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
