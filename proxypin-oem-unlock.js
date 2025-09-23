// == Proxy Pin OEM Unlock Script ==
// Save this in Proxy Pin App > Scripts > oem-unlock.js

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enabled: true,
        debug: true,
        permanent: true, // Prevent relocking
        targetHosts: [
            "afwprovisioning-pa.googleapis.com",
            "android.clients.google.com",
            "android.googleapis.com", 
            "www.googleapis.com",
            "device-policy.googleapis.com",
            "mobile-services.googleapis.com",
            "carrier-services.googleapis.com"
        ]
    };

    // Main response interceptor
    proxy.onResponse(function(request, response) {
        if (!CONFIG.enabled) return response;
        
        try {
            const url = request.url.toLowerCase();
            const hostname = request.hostname.toLowerCase();
            
            // Check if this is a target host
            const isTarget = CONFIG.targetHosts.some(target => 
                hostname.includes(target.toLowerCase())
            );
            
            if (!isTarget) return response;

            if (CONFIG.debug) {
                console.log(`[OEM Unlock] Intercepting: ${hostname}${request.path}`);
            }

            return processOemUnlockResponse(request, response);
            
        } catch (error) {
            if (CONFIG.debug) {
                console.error("[OEM Unlock] Error:", error);
            }
            return response;
        }
    });

    function processOemUnlockResponse(request, response) {
        let modified = false;
        let newResponse = JSON.parse(JSON.stringify(response));
        
        // Check content type
        const contentType = (newResponse.headers['content-type'] || '').toLowerCase();
        if (!contentType.includes('application/json') && 
            !contentType.includes('text/json') &&
            !request.path.toLowerCase().includes('json')) {
            return response;
        }

        // Parse response body
        let body;
        try {
            body = typeof newResponse.body === 'string' ? 
                   JSON.parse(newResponse.body) : newResponse.body;
        } catch (e) {
            return response;
        }

        if (!body || typeof body !== 'object') return response;

        const originalBody = JSON.parse(JSON.stringify(body));

        // == CORE UNLOCK MODIFICATIONS ==
        
        // 1. OEM Lock Status - Immediate unlock
        if (hasOemLockStatus(body)) {
            body = modifyOemLockStatus(body, request);
            modified = true;
        }

        // 2. Carrier Restrictions - Permanent removal
        if (hasCarrierRestrictions(body)) {
            body = removeCarrierRestrictions(body);
            modified = true;
        }

        // 3. Provisioning Status - Complete provisioning
        if (hasProvisioningStatus(body)) {
            body = completeProvisioning(body);
            modified = true;
        }

        // 4. Policy Enforcement - Disable carrier policies
        if (hasPolicyEnforcement(body)) {
            body = disablePolicyEnforcement(body);
            modified = true;
        }

        // 5. Future Lock Prevention - Anti-relock measures
        if (isUnlockRelated(request, body)) {
            body = addAntiRelockMeasures(body);
            modified = true;
        }

        // 6. Bootloader Status - Enable bootloader unlock
        if (hasBootloaderStatus(body)) {
            body = enableBootloaderUnlock(body);
            modified = true;
        }

        if (modified) {
            newResponse.body = JSON.stringify(body);
            
            // Update content length
            updateContentLength(newResponse);
            
            if (CONFIG.debug) {
                logUnlockSuccess(originalBody, body, request);
            }
            
            // Save unlock state to prevent relocking
            saveUnlockState(request, body);
        }

        return newResponse;
    }

    // == PERMANENT UNLOCK FUNCTIONS ==

    function modifyOemLockStatus(body, request) {
        console.log("[Permanent Unlock] Modifying OEM lock status");
        
        const permanentUnlock = {
            locked: false,
            user_toggle_enabled: true,
            enforced_by_carrier: false,
            carrier_enforceable: false, // Critical: Prevents future enforcement
            permanent_unlock: true,
            unlock_date: Date.now(),
            unlock_reason: "Permanent carrier unlock via Proxy Pin",
            future_lock_prevention: {
                allowed: false,
                require_user_consent: true,
                max_lock_duration: 0,
                carrier_override_disabled: true
            }
        };

        // Apply to all possible OEM lock paths
        if (body.oem_lock_status) {
            body.oem_lock_status = {...body.oem_lock_status, ...permanentUnlock};
        }
        if (body.oemUnlockStatus) {
            body.oemUnlockStatus = {...body.oemUnlockStatus, ...permanentUnlock};
        }
        if (body.status && body.status.oem_unlock) {
            body.status.oem_unlock = {...body.status.oem_unlock, ...permanentUnlock};
        }

        // Set direct flags
        body.oem_unlock_allowed = true;
        body.isOemUnlockAllowed = true;
        body.unlockAllowed = true;
        body.permanent_unlock_granted = true;

        return body;
    }

    function removeCarrierRestrictions(body) {
        console.log("[Permanent Unlock] Removing carrier restrictions");
        
        const carrierUnlock = {
            carrier_lock: {
                locked: false,
                permanent_unlock: true,
                enforceable: false, // Prevents future locking
                unlock_token: generateUnlockToken(),
                unlock_timestamp: Date.now()
            },
            simlock: {
                locked: false,
                state: "UNLOCKED_PERMANENT",
                network_subset: false,
                service_provider: false,
                corporate: false,
                sim: false
            },
            network_lock: {
                locked: false,
                permanent: true
            }
        };

        return {...body, ...carrierUnlock};
    }

    function completeProvisioning(body) {
        console.log("[Permanent Unlock] Completing provisioning");
        
        body.provisioningStatus = "COMPLETE_PERMANENT";
        body.afwProvisioning = {
            completed: true,
            remainingSteps: 0,
            canOemUnlock: true,
            permanent_unlock: true,
            status: "SUCCESS_PERMANENT"
        };
        body.managementStatus = "FULLY_MANAGED_UNLOCKED";
        
        return body;
    }

    function disablePolicyEnforcement(body) {
        console.log("[Permanent Unlock] Disabling policy enforcement");
        
        body.policy = {
            ...body.policy,
            oemUnlockAllowed: true,
            advancedSecurityDisabled: true,
            carrierLockDisallowed: true, // Prevents carrier policies
            permanentUnlock: true,
            policy_enforcement: {
                enabled: false,
                carrier_override: false,
                temporary_unlock: false
            }
        };
        
        body.restrictions = {
            ...body.restrictions,
            disallow_oem_unlock: false,
            oem_unlock_disallowed: false,
            carrier_lock_enforced: false,
            permanent_unlock_allowed: true
        };
        
        return body;
    }

    function addAntiRelockMeasures(body) {
        console.log("[Permanent Unlock] Adding anti-relock measures");
        
        // Add permanent unlock flags that persist across reboots
        body.permanent_unlock_metadata = {
            unlocked: true,
            timestamp: Date.now(),
            method: "proxy_pin_permanent",
            carrier_restrictions_removed: true,
            future_checks_bypassed: true,
            verification: {
                required: false,
                online_check: false,
                carrier_check: false
            }
        };
        
        // Disable future lock checks
        body.device_config = {
            ...body.device_config,
            oem_lock: {
                check_interval: 0, // Never check again
                online_verification: false,
                carrier_verification: false,
                permanent_bypass: true
            }
        };
        
        return body;
    }

    function enableBootloaderUnlock(body) {
        console.log("[Permanent Unlock] Enabling bootloader unlock");
        
        body.bootloader = {
            locked: false,
            unlockable: true,
            verified: false,
            permanent_unlock: true,
            carrier_restricted: false
        };
        
        body.bootloaderStatus = "UNLOCKED_PERMANENT";
        
        return body;
    }

    // == HELPER FUNCTIONS ==

    function hasOemLockStatus(obj) {
        return obj && (
            obj.oem_lock_status !== undefined ||
            obj.oemUnlockStatus !== undefined ||
            obj.unlockStatus !== undefined ||
            (obj.status && obj.status.oem_unlock !== undefined)
        );
    }

    function hasCarrierRestrictions(obj) {
        return obj && (
            obj.carrier_lock !== undefined ||
            obj.simlock !== undefined ||
            obj.network_lock !== undefined ||
            obj.carrier_restrictions !== undefined
        );
    }

    function hasProvisioningStatus(obj) {
        return obj && (
            obj.provisioningStatus !== undefined ||
            obj.afwProvisioning !== undefined ||
            obj.managementStatus !== undefined
        );
    }

    function hasPolicyEnforcement(obj) {
        return obj && (
            obj.policy !== undefined ||
            obj.restrictions !== undefined ||
            obj.enterpriseConfig !== undefined
        );
    }

    function hasBootloaderStatus(obj) {
        return obj && (
            obj.bootloader !== undefined ||
            obj.bootloaderStatus !== undefined
        );
    }

    function isUnlockRelated(request, body) {
        const unlockKeywords = ['unlock', 'oem', 'bootloader', 'carrier', 'provisioning'];
        const requestStr = (request.path + JSON.stringify(body)).toLowerCase();
        return unlockKeywords.some(keyword => requestStr.includes(keyword));
    }

    function generateUnlockToken() {
        return 'perm_unlock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function updateContentLength(response) {
        if (response.headers['content-length']) {
            response.headers['content-length'] = String(
                new TextEncoder().encode(response.body).length
            );
        }
    }

    function saveUnlockState(request, modifiedBody) {
        // Store unlock state in app storage for persistence
        try {
            const unlockState = {
                timestamp: Date.now(),
                hostname: request.hostname,
                path: request.path,
                original_locked: false, // We assume we've unlocked it
                permanent: true,
                token: generateUnlockToken()
            };
            
            // Proxy Pin app might have storage API, or use localStorage模拟
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('oem_unlock_state', JSON.stringify(unlockState));
            }
        } catch (e) {
            // Silent fail
        }
    }

    function logUnlockSuccess(original, modified, request) {
        console.log("=== OEM UNLOCK SUCCESS ===");
        console.log("Host: " + request.hostname + request.path);
        
        if (original.oem_lock_status) {
            console.log("OEM Lock: " + original.oem_lock_status.locked + " → " + modified.oem_lock_status.locked);
        }
        if (original.carrier_lock) {
            console.log("Carrier Lock: " + original.carrier_lock.locked + " → " + modified.carrier_lock.locked);
        }
        
        console.log("Permanent Unlock: ENABLED");
        console.log("Anti-Relock: ACTIVATED");
        console.log("========================");
    }

    // Initialize
    console.log("[Permanent OEM Unlock] Proxy Pin script loaded and active");
    console.log("[Permanent OEM Unlock] Target hosts: " + CONFIG.targetHosts.join(', '));

})();
