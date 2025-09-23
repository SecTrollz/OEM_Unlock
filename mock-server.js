// mock-server.js - Local offline mocking
const http = require('http');
const fs = require('fs');

const MOCK_RESPONSES = {
    '/v1/device/provisioning': {
        status: 'COMPLETE',
        oem_lock_status: {
            locked: false,
            user_toggle_enabled: true,
            enforced_by_carrier: false
        },
        afwProvisioning: {
            completed: true,
            canOemUnlock: true
        }
    },
    '/v1/device/unlock': {
        success: true,
        result: 'UNLOCKED'
    }
};

const server = http.createServer((req, res) => {
    console.log(`[Mock Server] Request: ${req.url}`);
    
    // Set CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    const mockResponse = MOCK_RESPONSES[req.url] || MOCK_RESPONSES['/v1/device/provisioning'];
    
    res.end(JSON.stringify(mockResponse));
});

server.listen(3000, () => {
    console.log('Mock OEM Unlock Server running on http://localhost:3000');
});
