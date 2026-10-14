import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
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
  const existing = await UserModel.findByEmailOrMobileHash(normalizedEmail, mobileHash);

  if (existing) {
    if (existing.email === normalizedEmail) {
      throw new Error('An account with this email address already exists.');
    }
    if (existing.mobile_hash === mobileHash) {
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

  // Insert new user into database via UserModel
  const newUser = await UserModel.create({
    email: normalizedEmail,
    passwordHash,
    fullNameEncrypted: nameEncrypted,
    fullNameMasked: nameMasked,
    dobEncrypted,
    dobMasked,
    mobileEncrypted,
    mobileMasked,
    mobileHash,
  });

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
      createdAt: newUser.created_at.toISOString(),
    },
    token,
  };
}

export async function loginUser(emailInput: string, passwordInput: string): Promise<AuthResult> {
  const normalizedEmail = emailInput.trim().toLowerCase();

  const user = await UserModel.findByEmail(normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

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
      createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : String(user.created_at),
    },
    token,
  };
}

export async function getUserById(userId: string): Promise<UserResponse | null> {
  const user = await UserModel.findById(userId);

  if (!user) return null;

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
    createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : String(user.created_at),
  };
}
