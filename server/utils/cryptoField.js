const crypto = require('crypto');

// Get encryption key from environment or use default (change in production!)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';

// Ensure key is exactly 32 bytes
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '!').slice(0, 32), 'utf-8');

const algorithm = 'aes-256-cbc';
const iv = Buffer.alloc(16, 0); // Initialization vector

/**
 * Encrypt a string field
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in hex format
 */
const encryptField = (text) => {
  try {
    if (!text) return text;
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt an encrypted field
 * @param {string} encryptedText - Encrypted text in hex format
 * @returns {string} - Decrypted plain text
 */
const decryptField = (encryptedText) => {
  try {
    if (!encryptedText) return encryptedText;
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

module.exports = { encryptField, decryptField };