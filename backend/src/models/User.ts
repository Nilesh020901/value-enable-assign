import { query } from '../db/index.js';

export interface IUser {
  id: string;
  email: string;
  password_hash: string;
  full_name_encrypted: string;
  full_name_masked: string;
  dob_encrypted: string;
  dob_masked: string;
  mobile_encrypted: string;
  mobile_masked: string;
  mobile_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullNameEncrypted: string;
  fullNameMasked: string;
  dobEncrypted: string;
  dobMasked: string;
  mobileEncrypted: string;
  mobileMasked: string;
  mobileHash: string;
}

export const UserModel = {
  /**
   * Find user by UUID
   */
  async findById(id: string): Promise<IUser | null> {
    const res = await query<IUser>(
      `SELECT id, email, password_hash, full_name_encrypted, full_name_masked,
              dob_encrypted, dob_masked, mobile_encrypted, mobile_masked, mobile_hash,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const res = await query<IUser>(
      `SELECT id, email, password_hash, full_name_encrypted, full_name_masked,
              dob_encrypted, dob_masked, mobile_encrypted, mobile_masked, mobile_hash,
              created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );
    return res.rows[0] || null;
  },

  /**
   * Find existing user matching email or mobile hash for duplicate prevention
   */
  async findByEmailOrMobileHash(
    email: string,
    mobileHash: string
  ): Promise<Pick<IUser, 'id' | 'email' | 'mobile_hash'> | null> {
    const res = await query<Pick<IUser, 'id' | 'email' | 'mobile_hash'>>(
      'SELECT id, email, mobile_hash FROM users WHERE email = $1 OR mobile_hash = $2',
      [email.toLowerCase(), mobileHash]
    );
    return res.rows[0] || null;
  },

  /**
   * Insert new user with encrypted PII and deterministic mobile hash
   */
  async create(input: CreateUserInput): Promise<IUser> {
    const res = await query<IUser>(
      `INSERT INTO users (
        email, password_hash,
        full_name_encrypted, full_name_masked,
        dob_encrypted, dob_masked,
        mobile_encrypted, mobile_masked,
        mobile_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, password_hash, full_name_encrypted, full_name_masked,
                dob_encrypted, dob_masked, mobile_encrypted, mobile_masked, mobile_hash,
                created_at, updated_at`,
      [
        input.email.toLowerCase(),
        input.passwordHash,
        input.fullNameEncrypted,
        input.fullNameMasked,
        input.dobEncrypted,
        input.dobMasked,
        input.mobileEncrypted,
        input.mobileMasked,
        input.mobileHash,
      ]
    );
    return res.rows[0];
  },
};
