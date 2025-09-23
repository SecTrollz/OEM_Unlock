// == Pre-Unlock Request Modifier ==
// Modifies outgoing requests to ensure successful unlock attempts

proxy.onRequest(function(request) {
  if (request.hostname.includes("googleapis.com") && 
      request.body && typeof request.body === 'string') {
    
    try {
      const reqBody = JSON.parse(request.body);
      let modified = false;

      // Remove any unlock restrictions from outgoing requests
      if (reqBody.restrictions) {
        delete reqBody.restrictions.disallow_oem_unlock;
        delete reqBody.restrictions.oem_unlock_disallowed;
        modified = true;
      }

      // Force unlock commands to be accepted
      if (reqBody.command === "UNLOCK_DEVICE" || reqBody.action === "unlock") {
        reqBody.force = true;
        reqBody.bypass = true;
        modified = true;
      }

      if (modified) {
        request.body = JSON.stringify(reqBody);
        console.log("[OEM Unlock] Modified outgoing request to force unlock");
      }
    } catch (e) {
      // Silently fail if not JSON
    }
  }
});
