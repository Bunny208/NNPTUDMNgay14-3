# JWT RS256 Implementation Guide

## 🔐 RS256 vs HS256 - Sự khác biệt

### HS256 (HMAC - Symmetric Encryption)
```
Secret: "my-secret-key"
┌─────────────────────────────────────────────────────────┐
│ Sign:   jwt.sign(payload, secret)                       │
│ Verify: jwt.verify(token, secret)                       │
│                                                          │
│ ❌ Cùng secret cho cả sign và verify                    │
│ ❌ Secret phải được chia sẻ giữa các service            │
│ ❌ Ít bảo mật hơn                                       │
└─────────────────────────────────────────────────────────┘
```

### RS256 (RSA - Asymmetric Encryption) ✅ Hiện tại
```
├─ Private Key: Chỉ server dùng để SIGN
│  └─ Không bao giờ chia sẻ
└─ Public Key: Có thể chia sẻ để VERIFY
   └─ Bất cứ ai cũng có thể xác minh token nhưng KHÔNG thể tạo token

┌──────────────────────────────────────────────────────────────┐
│ Sign:   jwt.sign(payload, privateKey, {algorithm: 'RS256'}) │
│ Verify: jwt.verify(token, publicKey, {algorithms: ['RS256']})│
│                                                               │
│ ✅ Private key chỉ lưu ở auth server                         │
│ ✅ Public key có thể share cho các service khác               │
│ ✅ Bảo mật cao hơn (RSA 2048-bit)                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc File

```
d:\CHIEU T5\NNPTUDMNgay14-3\
├── keys/                          (TỰ ĐỘNG TẠO)
│   ├── private.pem                (1704 bytes)
│   └── public.pem                 (451 bytes)
│
├── utils/
│   ├── keys.js                    ✅ (MỚI) - Quản lý RSA keys
│   ├── authHandler.js             ✅ (CẬP NHẬT) - Verify RS256
│   └── validator.js
│
├── routes/
│   └── auth.js                    ✅ (CẬP NHẬT) - Sign RS256
│
└── app.js                         ✅ (CẬP NHẬT) - Khởi tạo keys
```

---

## 🚀 Cách hoạt động

### 1️⃣ Server Startup
```javascript
// app.js
let { getKeys } = require('./utils/keys');
getKeys(); // Tạo RSA keys nếu chưa tồn tại
```

**Output:**
```
✅ RSA keys generated successfully
```

### 2️⃣ User Login
```javascript
// routes/auth.js
const { privateKey } = getKeys();
let token = jwt.sign(
    { id: user._id },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h' }
);
```

**JWT Token structure:**
```
Header: { alg: 'RS256', typ: 'JWT' }
Payload: { id: 'user_id', iat: ..., exp: ... }
Signature: Signed with 2048-bit RSA private key
```

### 3️⃣ API Request with Token
```
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ Token Verification
```javascript
// utils/authHandler.js
const { publicKey } = getKeys();
let result = jwt.verify(token, publicKey, { 
    algorithms: ['RS256'] 
});
```

---

## 🧪 Testing Steps (Postman)

### Step 1: Register
```
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser123",
  "password": "SecurePass123!",
  "email": "test@example.com"
}

Response:
{
  "username": "testuser123",
  "_id": "507f1f77bcf86cd799439011",
  ...
}
```

### Step 2: Login (Get RS256 Token)
```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "testuser123",
  "password": "SecurePass123!"
}

Response (JWT RS256 Token):
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmOWY2YzExYzNjOTQxMjM2YzVkYTk4MCIsImlhdCI6MTYwNDAwMDAwMCwiZXhwIjoxNjA0MDAzNjAwfQ.signature...
```

### Step 3: Decode to See RS256
Use [jwt.io](https://jwt.io):
```
Header (Base64Url Decoded):
{
  "alg": "RS256",      ← Changed from HS256!
  "typ": "JWT"
}

Payload (Base64Url Decoded):
{
  "id": "507f1f77bcf86cd799439011",
  "iat": 1614440000,
  "exp": 1614443600   ← Expires in 1 hour
}

Signature:
(Signed with private key from keys/private.pem)
```

### Step 4: Get Current User
```
GET http://localhost:3000/api/v1/auth/me
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

Response:
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "testuser123",
  "email": "test@example.com",
  ...
}
```

### Step 5: Change Password
```
POST http://localhost:3000/api/v1/auth/changepassword
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "oldpassword": "SecurePass123!",
  "newpassword": "NewPassword456!"
}

Response:
{
  "message": "Thay doi password thanh cong"
}
```

---

## 🔒 Bảo mật - Keys Management

### Public Key có thể chia sẻ
```pem
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhq3Ba7r3AHCaGVrURQmh
wrurObs61ZKPjKbOlzCB8ktkUAAHUPPYq0AnxOnHIIROCFVb3wyz9Dl6OoZImXfS
...
-----END PUBLIC KEY-----
```

**Có thể sử dụng ở:**
- Các micro-service khác (để verify token)
- Client-side verification
- API Gateway
- Load Balancer

### Private Key - KHÔNG BỎNG JAR
- Chỉ lưu ở server
- Không commit lên Git (nên thêm vào `.gitignore`)
- Sẽ tự động tạo tại `keys/private.pem`

---

## 📊 So sánh Hiệu suất

| Metric | HS256 | RS256 |
|--------|-------|-------|
| **Sign Time** | ⚡ Nhanh (0.1ms) | 🐢 Chậm (1-2ms) |
| **Verify Time** | ⚡ Nhanh (0.1ms) | 🐢 Chậm (1-2ms) |
| **Key Size** | Nhỏ (string) | Lớn (2048-bit) |
| **Bảo mật** | ⚠️ Thấp | ✅ Cao |
| **Use Case** | Single Service | Microservices |

**Khuyến nghị:** RS256 tốt hơn cho hệ thống microservices dù chậm hơn một chút.

---

## 🛠️ Tùy chỉnh

### Thay đổi RSA Key Size
Sửa file `utils/keys.js`:
```javascript
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,  // Từ 2048 → 4096 (bảo mật cao hơn, chậm hơn)
    ...
});
```

### Thay đổi Token Expiry
Sửa file `routes/auth.js`:
```javascript
let token = jwt.sign(
    { id: user._id },
    privateKey,
    { 
        algorithm: 'RS256',
        expiresIn: '7d'  // Từ '1h' → '7d'
    }
);
```

### Thêm Custom Claims
```javascript
let token = jwt.sign(
    { 
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h' }
);
```

---

## ✅ Checklist

- ✅ RS256 được implement
- ✅ RSA keys tự động tạo tại startup
- ✅ Login trả về RS256 token
- ✅ /me endpoint verify RS256
- ✅ Changepassword hoạt động với RS256
- ✅ Private key không chia sẻ
- ✅ Public key có thể chia sẻ

**Hệ thống bây giờ sử dụng RS256 với bảo mật cao! 🎉**
