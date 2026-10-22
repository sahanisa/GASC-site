const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

function getLocalIpAddress() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Pick non-internal IPv4
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

async function generateQr(port = 5000) {
    const ip = getLocalIpAddress();
    const portalUrl = `http://${ip}:${port}`;
    console.log(`📡 [QR Generator] Detected LAN Address: ${portalUrl}`);

    const outputPath = path.join(__dirname, 'public', 'library-qr.png');
    const txtPath = path.join(__dirname, 'public', 'portal-url.txt');

    try {
        await QRCode.toFile(outputPath, portalUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 800,
            color: {
                dark: '#0f172a',  // deep slate blue / dark navy
                light: '#ffffff'
            }
        });

        fs.writeFileSync(txtPath, portalUrl, 'utf8');
        console.log(`✅ [QR Generator] High-Res QR Code created at: ${outputPath}`);
        console.log(`📄 [QR Generator] Direct Portal URL: ${portalUrl}`);
        return { portalUrl, outputPath };
    } catch (err) {
        console.error('❌ [QR Generator] Error generating QR code:', err);
        throw err;
    }
}

if (require.main === module) {
    const port = process.env.PORT || 5000;
    generateQr(port);
}

module.exports = { generateQr, getLocalIpAddress };
