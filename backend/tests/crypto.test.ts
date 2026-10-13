import { describe, it, expect } from 'vitest';
import {
  encryptData,
  decryptData,
  hashMobile,
  maskMobile,
  maskName,
  maskDob,
} from '../src/services/crypto.js';

describe('PII Security - Encryption, Decryption, Hashing & Masking', () => {
  const secretKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const hmacSecret = 'super_secret_hmac_key_test_value_enable_2026';

  describe('AES-256-GCM Round-trip Encryption & Decryption', () => {
    it('encrypts and decrypts sensitive name correctly', () => {
      const original = 'Aarav Sharma';
      const encrypted = encryptData(original, secretKey);

      expect(encrypted).not.toBe(original);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

      const decrypted = decryptData(encrypted, secretKey);
      expect(decrypted).toBe(original);
    });

    it('encrypts and decrypts sensitive mobile number correctly', () => {
      const original = '9876543210';
      const encrypted = encryptData(original, secretKey);
      const decrypted = decryptData(encrypted, secretKey);
      expect(decrypted).toBe(original);
    });

    it('encrypts and decrypts DOB correctly', () => {
      const original = '1995-12-25';
      const encrypted = encryptData(original, secretKey);
      const decrypted = decryptData(encrypted, secretKey);
      expect(decrypted).toBe(original);
    });

    it('fails decryption if encrypted ciphertext is tampered with', () => {
      const original = 'Secret Data';
      const encrypted = encryptData(original, secretKey);
      const parts = encrypted.split(':');
      // Tamper ciphertext
      parts[2] = parts[2].slice(0, -2) + 'ff';
      const tampered = parts.join(':');

      expect(() => decryptData(tampered, secretKey)).toThrow();
    });
  });

  describe('HMAC-SHA256 Mobile Hashing', () => {
    it('produces deterministic hash for the same mobile number', () => {
      const mobile1 = '9876543210';
      const mobile2 = '+91 98765-43210'; // variations normalized to digits
      const hash1 = hashMobile(mobile1, hmacSecret);
      const hash2 = hashMobile(mobile2, hmacSecret);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    it('produces different hashes for different numbers', () => {
      const hash1 = hashMobile('9876543210', hmacSecret);
      const hash2 = hashMobile('9876543211', hmacSecret);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('PII Masking Functions', () => {
    it('masks mobile number showing only last 4 digits', () => {
      expect(maskMobile('9876543210')).toBe('******3210');
      expect(maskMobile('1234567890')).toBe('******7890');
      expect(maskMobile('1234')).toBe('****');
    });

    it('masks full name leaving first and last letter of each word', () => {
      expect(maskName('Rahul')).toBe('R***l');
      expect(maskName('John Doe')).toBe('J**n D*e');
      expect(maskName('Priya Nair')).toBe('P***a N**r');
    });

    it('masks DOB revealing only the day or month according to standard format', () => {
      expect(maskDob('1990-05-15')).toBe('****-**-15');
      expect(maskDob('25/12/1998')).toBe('25/**/****');
    });
  });
});
