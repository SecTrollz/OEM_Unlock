// == OEM Unlock Proxy Pin Configuration ==
// Save as: oem_unlock_proxy_pin.js

(function() {
    'use strict';

    // Configuration - Adjust these for your environment
    const CONFIG = {
        ENABLED: true,
        DEBUG_MODE: true,
        TARGET_HOSTS: [
            "afwprovisioning-pa.googleapis.com",
            "android.clients.google.com", 
            "android.googleapis.com",
            "www.googleapis.com"
        ],
        // Local mock responses for offline testing
        USE_LOCAL_MOCKS: true,
        MOCK_RESPONSES: {
            "/v1/device/unlock": {
                status: "SUCCESS",
                unlockAllowed: true,
                oemLockStatus: {
                    locked: false,
                    user_toggle_enabled: true,
                    enforced_by_carrier: false
                }
            }
        }
    };

    // Main interception function
    function interceptOemUnlock(response) {
        if (!CONFIG.ENABLED) return response;
        
        try {
            const url = new URL(response.url);
            const hostname = url.hostname;
            
            // Only process target hosts
            if (!CONFIG.TARGET_HOSTS.includes(hostname)) {
                return response;
            }

            if (CONFIG.DEBUG_MODE) {
                console.log(`[OEM Unlock] Intercepting: ${hostname}${url.pathname}`);
            }

            // Process response
            return processResponse(response, hostname, url.pathname);
            
        } catch (error) {
            if (CONFIG.DEBUG_MODE) {
                console.error("[OEM Unlock] Interception error:", error);
            }
            return response;
        }
    }

    function processResponse(response, hostname, pathname) {
        let modifiedResponse = {...response};
        let body = modifiedResponse.body;
        
        // Handle different content types
        const contentType = (modifiedResponse.headers['content-type'] || '').toLowerCase();
        const isJson = contentType.includes('application/json') || 
                       contentType.includes('text/json') ||
                       pathname.includes('json');

        if (!isJson) {
            if (CONFIG.DEBUG_MODE) {
                console.log(`[OEM Unlock] Non-JSON content, skipping: ${contentType}`);
            }
            return modifiedResponse;
        }

        // Parse JSON body
        let parsedBody;
        try {
            parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
            if (CONFIG.DEBUG_MODE) {
                console.warn("[OEM Unlock] Failed to parse JSON body");
            }
            return modifiedResponse;
        }

        if (!parsedBody || typeof parsedBody !== 'object') {
            return modifiedResponse;
        }

        // Apply modifications
        const originalBody = JSON.parse(JSON.stringify(parsedBody));
        const modifiedBody = applyOemUnlockModifications(parsedBody, pathname);

        if (JSON.stringify(originalBody) !== JSON.stringify(modifiedBody)) {
            modifiedResponse.body = JSON.stringify(modifiedBody);
            
            // Update content length
            if (modifiedResponse.headers['content-length']) {
                modifiedResponse.headers['content-length'] = String(
                    new TextEncoder().encode(modifiedResponse.body).length
                );
            }
            
            if (CONFIG.DEBUG_MODE) {
                console.log("[OEM Unlock] ✓ Response modified successfully");
                logChanges(originalBody, modifiedBody);
            }
        }

        return modifiedResponse;
    }

    function applyOemUnlockModifications(body, pathname) {
        let modified = false;

        // Strategy 1: Direct OEM lock status modification
        if (hasOemLockStatus(body)) {
            body = modifyOemLockStatus(body);
            modified = true;
        }

        // Strategy 2: Provisioning status modification
        if (hasProvisioningStatus(body)) {
            body = modifyProvisioningStatus(body);
            modified = true;
        }

        // Strategy 3: Carrier lock removal
        if (hasCarrierLock(body)) {
            body = modifyCarrierLock(body);
            modified = true;
        }

        // Strategy 4: Force success responses
        if (isUnlockRelated(pathname, body)) {
            body = forceSuccessResponse(body);
            modified = true;
        }

        return body;
    }

    // Detection functions
    function hasOemLockStatus(obj) {
        return obj && (
            obj.oem_lock_status !== undefined ||
            obj.oemUnlockStatus !== undefined ||
            obj.unlockStatus !== undefined ||
            (obj.status && obj.status.oem_unlock !== undefined)
        );
    }

    function hasProvisioningStatus(obj) {
        return obj && (
            obj.provisioningStatus !== undefined ||
            obj.afwProvisioning !== undefined ||
            obj.managementStatus !== undefined
        );
    }

    function hasCarrierLock(obj) {
        return obj && (
            obj.carrier_lock !== undefined ||
            obj.simlock !== undefined ||
            obj.network_lock !== undefined
        );
    }

    function isUnlockRelated(pathname, obj) {
        const unlockPaths = ['unlock', 'oem', 'bootloader', 'provisioning', 'afw'];
        return unlockPaths.some(path => pathname.toLowerCase().includes(path));
    }

    // Modification functions
    function modifyOemLockStatus(obj) {
        console.log("[OEM Unlock] Modifying OEM lock status");

        // Handle nested OEM lock status
        if (obj.oem_lock_status) {
            obj.oem_lock_status = {
                locked: false,
                user_toggle_enabled: true,
                enforced_by_carrier: false,
                reason: "Unlocked via Proxy Pin",
                supported: true,
                modified_by_proxy: true
            };
        }

        if (obj.oemUnlockStatus) {
            obj.oemUnlockStatus = {
                locked: false,
                unlockAllowed: true,
                userToggleable: true
            };
        }

        // Set direct flags
        if (obj.oem_unlock_allowed !== undefined) obj.oem_unlock_allowed = true;
        if (obj.isOemUnlockAllowed !== undefined) obj.isOemUnlockAllowed = true;
        if (obj.unlockAllowed !== undefined) obj.unlockAllowed = true;

        return obj;
    }

    function modifyProvisioningStatus(obj) {
        console.log("[OEM Unlock] Modifying provisioning status");

        if (obj.provisioningStatus) {
            obj.provisioningStatus = "COMPLETE";
            obj.isProvisioned = true;
        }

        if (obj.afwProvisioning) {
            obj.afwProvisioning = {
                completed: true,
                remainingSteps: 0,
                canOemUnlock: true,
                status: "SUCCESS"
            };
        }

        return obj;
    }

    function modifyCarrierLock(obj) {
        console.log("[OEM Unlock] Removing carrier restrictions");

        if (obj.carrier_lock) {
            obj.carrier_lock = {
                locked: false,
                enforced: false,
                can_unlock: true,
                reason: "No carrier restrictions"
            };
        }

        if (obj.simlock) {
            obj.simlock = {
                locked: false,
                state: "UNLOCKED"
            };
        }

        return obj;
    }

    function forceSuccessResponse(obj) {
        console.log("[OEM Unlock] Forcing success response");

        if (obj.status) {
            if (typeof obj.status === 'string') {
                obj.status = "SUCCESS";
            } else if (typeof obj.status === 'object') {
                obj.status = {code: 0, message: "Success", status: "SUCCESS"};
            }
        }

        obj.success = true;
        obj.error = null;
        obj.result = "OK";

        return obj;
    }

    function logChanges(original, modified) {
        const changes = [];
        
        if (original.oem_lock_status?.locked !== modified.oem_lock_status?.locked) {
            changes.push(`OEM Lock: ${original.oem_lock_status?.locked} → ${modified.oem_lock_status?.locked}`);
        }
        
        if (changes.length > 0) {
            console.log("[OEM Unlock] Changes applied:", changes.join(', '));
        }
    }

    // Proxy Pin API integration
    if (typeof proxy !== 'undefined') {
        // For Proxy Pin browser extension
        proxy.onResponse(function(request, response) {
            return interceptOemUnlock(response);
        });
        
        console.log("[OEM Unlock] Proxy Pin handler registered");
    } else if (typeof window !== 'undefined' && window.proxyPin) {
        // For standalone Proxy Pin
        window.proxyPin.addResponseInterceptor(interceptOemUnlock);
        console.log("[OEM Unlock] Window proxyPin handler registered");
    } else {
        // Manual setup mode
        console.log("[OEM Unlock] Script loaded - configure your proxy to use this interceptor");
    }

    // Export for Node.js/other environments
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { interceptOemUnlock, CONFIG };
    }

})();
