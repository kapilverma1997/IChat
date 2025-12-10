import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Generate a random encryption key
export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

// Derive key from password using PBKDF2
export function deriveKeyFromPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

// Generate RSA key pair
export function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  return { publicKey, privateKey };
}

// Encrypt data with AES-256-GCM
export function encryptAES(data, key) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return: iv:tag:encrypted
    return {
      encrypted: `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (error) {
    console.error('AES encryption error:', error);
    throw error;
  }
}

// Decrypt data with AES-256-GCM
export function decryptAES(encryptedData, key) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('AES decryption error:', error);
    throw error;
  }
}

// Encrypt with RSA public key
export function encryptRSA(data, publicKey) {
  try {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(data)
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('RSA encryption error:', error);
    throw error;
  }
}

// Decrypt with RSA private key
export function decryptRSA(encryptedData, privateKey) {
  try {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedData, 'base64')
    );
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('RSA decryption error:', error);
    throw error;
  }
}

// Encrypt field-level data (for database at rest)
export function encryptField(data, encryptionKey) {
  if (!data) return '';
  const encrypted = encryptAES(JSON.stringify(data), encryptionKey);
  return encrypted.encrypted;
}

// Decrypt field-level data
export function decryptField(encryptedData, encryptionKey) {
  if (!encryptedData) return null;
  try {
    const decrypted = decryptAES(encryptedData, encryptionKey);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Field decryption error:', error);
    return null;
  }
}

// Generate session key for E2EE
export function generateSessionKey() {
  return generateKey().toString('base64');
}

// Hash data (for integrity checking)
export function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Generate random salt
export function generateSalt() {
  return crypto.randomBytes(SALT_LENGTH);
}

// Encrypt file buffer
export function encryptFileBuffer(buffer, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted: Buffer.concat([iv, tag, encrypted]),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

// Decrypt file buffer
export function decryptFileBuffer(encryptedBuffer, key) {
  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const tag = encryptedBuffer.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedBuffer.slice(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}

