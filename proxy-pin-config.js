// proxy-pin-config.js
const { interceptOemUnlock } = require('./oem_unlock_proxy_pin.js');

module.exports = {
    port: 8080,
    ssl: true,
    rules: [
        {
            url: /googleapis\.com/,
            response: (req, res) => {
                return interceptOemUnlock(res);
            }
        }
    ],
    // Local certificate for HTTPS interception
    certs: {
        key: './certs/key.pem',
        cert: './certs/cert.pem'
    }
};
