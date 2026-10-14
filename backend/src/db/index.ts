import pg from 'pg';
import { env } from '../config/env.js';
import { DEFAULT_BONUS_RATES } from '../services/calculation.js';
import { SCHEMA_SQL } from '../models/schema.js';

const { Pool } = pg;

export interface QueryResultRow {
  [column: string]: any;
}

export interface QueryResult<R extends QueryResultRow = any> {
  rows: R[];
  rowCount: number;
}

if (!env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('neon.tech') || env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * Executes a parameterized SQL query directly on the PostgreSQL database.
 * If the database is unreachable or query fails, it throws the error directly.
 */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<R>> {
  const res = await pool.query<R>(text, params);
  return {
    rows: res.rows,
    rowCount: res.rowCount ?? 0,
  };
}

/**
 * Initializes database connection, applies table schemas, and seeds bonus rates.
 * Throws an explicit error if the database is unreachable.
 */
export async function initDb(): Promise<void> {
  try {
    // 1. Verify connection
    const healthCheck = await pool.query('SELECT NOW() AS current_time');
    console.log(`Connected to PostgreSQL database at ${healthCheck.rows[0].current_time}`);

    // 2. Apply table schemas directly from models/schema
    await pool.query(SCHEMA_SQL);

    // 3. Seed or verify the 20-year bonus rates from the reference sample sheet
    for (let y = 1; y <= 20; y++) {
      const rate = DEFAULT_BONUS_RATES[y - 1];
      await pool.query(
        `INSERT INTO bonus_rates (policy_year, rate) VALUES ($1, $2)
         ON CONFLICT (policy_year) DO UPDATE SET rate = EXCLUDED.rate`,
        [y, rate]
      );
    }

    // 4. Seed demo agent user if not exists
    const demoEmail = 'agent@example.com';
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [demoEmail]);
    if (existingUser.rowCount === 0) {
      const bcrypt = (await import('bcrypt')).default;
      const { encryptData, hashMobile } = await import('../services/crypto.js');
      const passwordHash = await bcrypt.hash('Password@123', 10);
      const nameEncrypted = encryptData('Rajesh Sharma', env.ENCRYPTION_KEY);
      const dobEncrypted = encryptData('1990-05-15', env.ENCRYPTION_KEY);
      const mobileEncrypted = encryptData('9876543210', env.ENCRYPTION_KEY);
      const mobileHash = hashMobile('9876543210', env.HMAC_SECRET);

      await pool.query(
        `INSERT INTO users (
          email, password_hash,
          full_name_encrypted, full_name_masked,
          dob_encrypted, dob_masked,
          mobile_encrypted, mobile_masked,
          mobile_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          demoEmail,
          passwordHash,
          nameEncrypted,
          'R****h S****a',
          dobEncrypted,
          '****-**-15',
          mobileEncrypted,
          '******3210',
          mobileHash,
        ]
      );
      console.log('Seeded demo agent user: agent@example.com / Password@123');
    }

    console.log('PostgreSQL database schemas, bonus rates, and demo user verified.');
  } catch (err: any) {
    console.error('CRITICAL: Database initialization failed:', err.message || err);
    throw new Error(`Database connection/initialization failed: ${err.message || err}`);
  }
}
