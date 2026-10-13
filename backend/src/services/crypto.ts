import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag

/**
 * Normalizes encryption key into a 32-byte Buffer.
 */
function getKeyBuffer(keyHexOrString: string): Buffer {
  if (keyHexOrString.length === 64 && /^[0-9a-fA-F]+$/.test(keyHexOrString)) {
    return Buffer.from(keyHexOrString, 'hex');
  }
  // If string, hash it to ensure exactly 32 bytes
  return crypto.createHash('sha256').update(keyHexOrString).digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptData(plaintext: string, secretKey: string): string {
  if (!plaintext) return '';
  const key = getKeyBuffer(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM formatted string (iv:authTag:ciphertext).
 */
export function decryptData(encryptedString: string, secretKey: string): string {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getKeyBuffer(secretKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates deterministic HMAC-SHA256 for searching and uniqueness checks
 * without storing or exposing plain mobile numbers.
 */
export function hashMobile(mobile: string, hmacSecret: string): string {
  const digits = mobile.replace(/[^0-9]/g, '');
  // Normalize 10-digit mobile if prefixed with 91 or 0
  let normalized = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    normalized = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    normalized = digits.slice(1);
  }
  return crypto.createHmac('sha256', hmacSecret).update(normalized).digest('hex');
}

/**
 * Masks mobile number: shows only last 4 digits (e.g. "******7890")
 */
export function maskMobile(mobile: string): string {
  const digits = mobile.trim();
  if (digits.length <= 4) {
    return '****';
  }
  const maskedSection = '*'.repeat(digits.length - 4);
  const visible = digits.slice(-4);
  return `${maskedSection}${visible}`;
}

/**
 * Masks full name: keeps first and last characters of each word, masks the rest.
 * E.g. "Johnathan Doe" -> "J*******n D*e"
 */
export function maskName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '***';

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) {
        return word[0] + '*';
      }
      return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
    })
    .join(' ');
}

/**
 * Masks DOB: keeps only day, masks year and month. E.g. "1990-05-15" -> "****-**-15"
 */
export function maskDob(dob: string): string {
  const clean = dob.trim();
  // If YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `****-**-${isoMatch[3]}`;
  }
  // If DD/MM/YYYY
  const slashMatch = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[1]}/**/****`;
  }
  return '****-**-**';
}
