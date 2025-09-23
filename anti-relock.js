// == Anti-Relock Protection Script ==
// Save as: anti-relock.js in Proxy Pin

proxy.onRequest(function(request) {
    // Block carrier lock requests
    if (isCarrierLockRequest(request)) {
        console.log("[Anti-Relock] Blocking carrier lock request: " + request.url);
        return {cancel: true}; // Block the request completely
    }
    
    // Modify outgoing unlock requests to include permanent flags
    if (isUnlockRequest(request) && request.body) {
        try {
            const body = JSON.parse(request.body);
            body.permanent_unlock = true;
            body.bypass_carrier = true;
            body.timestamp = Date.now();
            request.body = JSON.stringify(body);
        } catch (e) {}
    }
    
    return request;
});

function isCarrierLockRequest(request) {
    const lockKeywords = [
        'lock',
        'restrict',
        'enforce',
        'disable_unlock',
        'carrier_policy'
    ];
    
    return lockKeywords.some(keyword => 
        request.url.toLowerCase().includes(keyword)
    );
}

function isUnlockRequest(request) {
    return request.url.toLowerCase().includes('unlock') ||
           request.url.toLowerCase().includes('oem');
}
