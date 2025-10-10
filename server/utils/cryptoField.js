const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'my-32-character-encryption!!'; // Must be 32 chars
const ALGORITHM = 'aes-256-cbc';

// Ensure key is exactly 32 bytes
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32), 'utf-8');

// Use a FIXED IV for deterministic encryption (same input = same output)
const FIXED_IV = Buffer.alloc(16, 0); // All zeros for consistency

const encryptField = (text) => {
  if (!text) return null;
  
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, key, FIXED_IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

const decryptField = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, FIXED_IV);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

module.exports = { encryptField, decryptField };