// == OEM Unlock Proxy Script ==
// Targets Google's AFW Provisioning APIs to force OEM unlock capability
// Bypasses carrier restrictions and enables greyed-out toggle switches

proxy.onResponse(function(request, response) {
  // Target multiple Google provisioning endpoints
  const targetHostnames = [
    "afwprovisioning-pa.googleapis.com",
    "android.clients.google.com",
    "android.googleapis.com",
    "www.googleapis.com"
  ];
  
  if (!targetHostnames.includes(request.hostname)) return;

  console.log(`[OEM Unlock] Intercepting: ${request.hostname}${request.path}`);

  // Handle different content types including gzip compression
  const contentType = (response.headers['content-type'] || "").toLowerCase();
  const isJson = contentType.includes("application/json") || 
                 contentType.includes("text/json") ||
                 request.path.includes("json");

  if (!isJson) {
    // Some APIs might use protobuf or other formats, but we'll try to decode
    console.log(`[OEM Unlock] Non-JSON content, attempting processing: ${contentType}`);
  }

  // Decompress if gzipped
  let responseBody = response.body;
  if (response.headers['content-encoding'] === 'gzip') {
    try {
      responseBody = ungzip(responseBody);
      delete response.headers['content-encoding'];
      console.log("[OEM Unlock] Decompressed gzip response");
    } catch (e) {
      console.warn("[OEM Unlock] Failed to decompress gzip:", e.message);
    }
  }

  // Safe JSON parse with multiple attempts
  let respJson = null;
  if (typeof responseBody === 'string') {
    try {
      respJson = JSON.parse(responseBody);
    } catch (e) {
      // Try to extract JSON from potential wrapper formats
      const jsonMatch = responseBody.match(/{[^]*}/);
      if (jsonMatch) {
        try {
          respJson = JSON.parse(jsonMatch[0]);
          console.log("[OEM Unlock] Extracted JSON from wrapper");
        } catch (e2) {
          console.warn("[OEM Unlock] Failed to parse JSON:", e2.message);
          return;
        }
      }
    }
  } else if (typeof responseBody === 'object') {
    respJson = responseBody;
  }

  if (!respJson || typeof respJson !== "object") {
    console.log("[OEM Unlock] Response is not a JSON object, skipping");
    return;
  }

  // Deep clone for modification tracking
  const originalJson = JSON.parse(JSON.stringify(respJson));
  let modified = false;

  // == STRATEGY 1: Direct OEM Lock Status Modification ==
  if (hasOemLockStatus(respJson)) {
    console.log("[OEM Unlock] Found OEM lock status, modifying...");
    
    respJson = modifyOemLockStatus(respJson);
    modified = true;
  }

  // == STRATEGY 2: Device Provisioning Status ==
  if (hasProvisioningStatus(respJson)) {
    console.log("[OEM Unlock] Found provisioning status, modifying...");
    
    respJson = modifyProvisioningStatus(respJson);
    modified = true;
  }

  // == STRATEGY 3: Carrier Lock Status ==
  if (hasCarrierLockStatus(respJson)) {
    console.log("[OEM Unlock] Found carrier lock status, modifying...");
    
    respJson = modifyCarrierLockStatus(respJson);
    modified = true;
  }

  // == STRATEGY 4: Bootloader Lock Status ==
  if (hasBootloaderStatus(respJson)) {
    console.log("[OEM Unlock] Found bootloader status, modifying...");
    
    respJson = modifyBootloaderStatus(respJson);
    modified = true;
  }

  // == STRATEGY 5: Enterprise Policy Restrictions ==
  if (hasPolicyRestrictions(respJson)) {
    console.log("[OEM Unlock] Found policy restrictions, modifying...");
    
    respJson = modifyPolicyRestrictions(respJson);
    modified = true;
  }

  // == STRATEGY 6: Generic Response Success Forcing ==
  if (isUnlockRelatedRequest(request, respJson)) {
    console.log("[OEM Unlock] Detected unlock-related request, forcing success...");
    
    respJson = forceUnlockSuccess(respJson);
    modified = true;
  }

  if (modified) {
    // Update response body
    response.body = JSON.stringify(respJson);
    
    // Update Content-Length header
    if (response.headers['content-length']) {
      response.headers['content-length'] = Buffer.byteLength(response.body).toString();
    }
    
    console.log("[OEM Unlock] ✓ Successfully modified response for full OEM unlock");
    logModificationSummary(originalJson, respJson);
  }
});

// === HELPER FUNCTIONS ===

function hasOemLockStatus(obj) {
  return obj && (
    obj.oem_lock_status !== undefined ||
    obj.oemUnlockStatus !== undefined ||
    obj.unlockStatus !== undefined ||
    (obj.status !== undefined && typeof obj.status === 'object' && obj.status.oem_unlock !== undefined)
  );
}

function modifyOemLockStatus(obj) {
  const paths = [
    'oem_lock_status',
    'oemUnlockStatus', 
    'unlockStatus',
    'status.oem_unlock',
    'result.oem_lock_status'
  ];
  
  paths.forEach(path => {
    if (getNested(obj, path) !== undefined) {
      setNested(obj, path, {
        locked: false,
        unlockAllowed: true,
        user_toggle_enabled: true,
        enforced_by_carrier: false,
        reason: "OEM unlocking allowed",
        supported: true,
        permanent: false,
        modified_by_proxy: true,
        timestamp: Date.now()
      });
    }
  });
  
  // Direct boolean properties
  if (obj.oem_unlock_allowed !== undefined) obj.oem_unlock_allowed = true;
  if (obj.isOemUnlockAllowed !== undefined) obj.isOemUnlockAllowed = true;
  if (obj.unlockAllowed !== undefined) obj.unlockAllowed = true;
  
  return obj;
}

function hasProvisioningStatus(obj) {
  return obj && (
    obj.provisioningStatus !== undefined ||
    obj.afwProvisioning !== undefined ||
    obj.managementStatus !== undefined
  );
}

function modifyProvisioningStatus(obj) {
  if (obj.provisioningStatus) {
    obj.provisioningStatus = "COMPLETE";
    obj.isProvisioned = true;
    obj.requiresOemUnlock = false;
  }
  
  if (obj.afwProvisioning) {
    obj.afwProvisioning.completed = true;
    obj.afwProvisioning.remainingSteps = 0;
    obj.afwProvisioning.canOemUnlock = true;
  }
  
  return obj;
}

function hasCarrierLockStatus(obj) {
  return obj && (
    obj.carrier_lock !== undefined ||
    obj.simlock !== undefined ||
    obj.network_lock !== undefined
  );
}

function modifyCarrierLockStatus(obj) {
  if (obj.carrier_lock) {
    obj.carrier_lock.locked = false;
    obj.carrier_lock.enforced = false;
    obj.carrier_lock.can_unlock = true;
  }
  
  if (obj.simlock) {
    obj.simlock.locked = false;
    obj.simlock.state = "UNLOCKED";
  }
  
  return obj;
}

function hasBootloaderStatus(obj) {
  return obj && (
    obj.bootloader !== undefined ||
    obj.bootloaderStatus !== undefined
  );
}

function modifyBootloaderStatus(obj) {
  if (obj.bootloader) {
    obj.bootloader.locked = false;
    obj.bootloader.unlockable = true;
    obj.bootloader.verified = false; // Allow custom ROMs
  }
  
  return obj;
}

function hasPolicyRestrictions(obj) {
  return obj && (
    obj.policy !== undefined ||
    obj.restrictions !== undefined ||
    obj.enterpriseConfig !== undefined
  );
}

function modifyPolicyRestrictions(obj) {
  if (obj.policy) {
    obj.policy.oemUnlockAllowed = true;
    obj.policy.advancedSecurityDisabled = true;
  }
  
  if (obj.restrictions) {
    obj.restrictions.oem_unlock_disallowed = false;
    obj.restrictions.disallow_oem_unlock = false;
  }
  
  return obj;
}

function isUnlockRelatedRequest(request, obj) {
  const unlockKeywords = [
    'unlock', 'oem', 'bootloader', 'carrier', 'simlock',
    'provisioning', 'afw', 'enterprise'
  ];
  
  const requestStr = (request.path + JSON.stringify(obj)).toLowerCase();
  return unlockKeywords.some(keyword => requestStr.includes(keyword));
}

function forceUnlockSuccess(obj) {
  // Force success status for any unlock operations
  if (obj.status !== undefined) {
    if (typeof obj.status === 'string') {
      obj.status = "SUCCESS";
    } else if (typeof obj.status === 'object') {
      obj.status.code = 0;
      obj.status.message = "Success";
    }
  }
  
  if (obj.error !== undefined) {
    obj.error = null;
  }
  
  if (obj.success !== undefined) {
    obj.success = true;
  }
  
  obj.result = "OK";
  obj.unlockResult = "SUCCESS";
  
  return obj;
}

// Utility functions
function getNested(obj, path) {
  return path.split('.').reduce((o, p) => o ? o[p] : undefined, obj);
}

function setNested(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, p) => o[p] = o[p] || {}, obj);
  target[lastKey] = value;
}

function logModificationSummary(original, modified) {
  console.log("[OEM Unlock] Modification Summary:");
  console.log("  - OEM Lock: " + (original.oem_lock_status?.locked ? "LOCKED → UNLOCKED" : "UNLOCKED"));
  console.log("  - User Toggle: " + (original.oem_lock_status?.user_toggle_enabled ? "ENABLED" : "DISABLED → ENABLED"));
  console.log("  - Carrier Enforcement: " + (original.oem_lock_status?.enforced_by_carrier ? "ENFORCED → REMOVED" : "NOT ENFORCED"));
}

// Gzip decompression helper
function ungzip(data) {
  // Implementation depends on your environment
  // This is a placeholder - implement based on your proxy's capabilities
  if (typeof Zlib !== 'undefined') {
    return Zlib.gunzipSync(data);
  }
  return data; // Fallback if decompression not available
}

console.log("[OEM Unlock] Proxy script loaded - ready to intercept Google provisioning APIs");
