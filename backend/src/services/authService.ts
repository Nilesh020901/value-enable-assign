import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { env } from '../config/env.js';
import {
  decryptData,
  encryptData,
  hashMobile,
  maskDob,
  maskMobile,
  maskName,
} from './crypto.js';

export interface RegisterDTO {
  name: string;
  email: string;
  mobile: string;
  dob: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  mobile: string;
  dob: string;
  rawDob?: string;
  createdAt: string;
}

export interface AuthResult {
  user: UserResponse;
  token: string;
}

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

export async function registerUser(dto: RegisterDTO): Promise<AuthResult> {
  const normalizedEmail = dto.email.trim().toLowerCase();
  const mobileHash = hashMobile(dto.mobile, env.HMAC_SECRET);

  // Check if user with same email or mobile already exists
  const existing = await query(
    'SELECT id, email, mobile_hash FROM users WHERE email = $1 OR mobile_hash = $2',
    [normalizedEmail, mobileHash]
  );

  if (existing.rowCount > 0) {
    const matched = existing.rows[0];
    if (matched.email === normalizedEmail) {
      throw new Error('An account with this email address already exists.');
    }
    if (matched.mobile_hash === mobileHash) {
      throw new Error('An account with this mobile number already exists.');
    }
  }

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  // Encrypt sensitive PII with AES-256-GCM
  const nameEncrypted = encryptData(dto.name.trim(), env.ENCRYPTION_KEY);
  const dobEncrypted = encryptData(dto.dob.trim(), env.ENCRYPTION_KEY);
  const mobileEncrypted = encryptData(dto.mobile.trim(), env.ENCRYPTION_KEY);

  // Generate masked representations
  const nameMasked = maskName(dto.name);
  const dobMasked = maskDob(dto.dob);
  const mobileMasked = maskMobile(dto.mobile);

  // Insert new user into database
  const result = await query(
    `INSERT INTO users (
      email, password_hash,
      full_name_encrypted, full_name_masked,
      dob_encrypted, dob_masked,
      mobile_encrypted, mobile_masked,
      mobile_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, email, full_name_masked, dob_masked, mobile_masked, created_at`,
    [
      normalizedEmail,
      passwordHash,
      nameEncrypted,
      nameMasked,
      dobEncrypted,
      dobMasked,
      mobileEncrypted,
      mobileMasked,
      mobileHash,
    ]
  );

  const newUser = result.rows[0];

  const token = jwt.sign({ userId: newUser.id, email: newUser.email }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.full_name_masked,
      mobile: newUser.mobile_masked,
      dob: newUser.dob_masked,
      rawDob: dto.dob.trim(),
      createdAt: newUser.created_at,
    },
    token,
  };
}

export async function loginUser(emailInput: string, passwordInput: string): Promise<AuthResult> {
  const normalizedEmail = emailInput.trim().toLowerCase();

  const result = await query(
    `SELECT id, email, password_hash, full_name_masked, dob_encrypted, dob_masked, mobile_masked, created_at
     FROM users WHERE email = $1`,
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    throw new Error('Invalid email or password.');
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(passwordInput, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  let rawDob: string | undefined;
  if (user.dob_encrypted) {
    try {
      rawDob = decryptData(user.dob_encrypted, env.ENCRYPTION_KEY);
    } catch {
      rawDob = undefined;
    }
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.full_name_masked,
      mobile: user.mobile_masked,
      dob: user.dob_masked,
      rawDob,
      createdAt: user.created_at,
    },
    token,
  };
}

export async function getUserById(userId: string): Promise<UserResponse | null> {
  const result = await query(
    `SELECT id, email, full_name_masked, dob_encrypted, dob_masked, mobile_masked, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rowCount === 0) return null;

  const user = result.rows[0];
  let rawDob: string | undefined;
  if (user.dob_encrypted) {
    try {
      rawDob = decryptData(user.dob_encrypted, env.ENCRYPTION_KEY);
    } catch {
      rawDob = undefined;
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.full_name_masked,
    mobile: user.mobile_masked,
    dob: user.dob_masked,
    rawDob,
    createdAt: user.created_at,
  };
}
