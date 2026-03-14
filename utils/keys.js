const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Đường dẫn lưu khóa
const keysDir = path.join(__dirname, '..', 'keys');

// Tạo thư mục keys nếu chưa tồn tại
if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir);
}

const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

// Hàm tạo cặp khóa RSA
function generateKeys() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Lưu khóa vào file
    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);
    console.log('✅ RSA keys generated successfully');
    return { privateKey, publicKey };
}

// Lấy khóa từ file hoặc tạo mới
function getKeys() {
    let privateKey, publicKey;

    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        console.log('✅ RSA keys loaded from files');
    } else {
        console.log('⚠️ Keys not found, generating new keys...');
        const keys = generateKeys();
        privateKey = keys.privateKey;
        publicKey = keys.publicKey;
    }

    return { privateKey, publicKey };
}

module.exports = {
    getKeys,
    generateKeys
};
