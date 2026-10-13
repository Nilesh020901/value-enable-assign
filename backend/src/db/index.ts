import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { DEFAULT_BONUS_RATES } from '../services/calculation.js';

const { Pool } = pg;

export interface QueryResultRow {
  [column: string]: any;
}

export interface QueryResult<R extends QueryResultRow = any> {
  rows: R[];
  rowCount: number;
}

// In-Memory Database store for offline/standalone execution when Neon URL is not configured
class InMemoryDb {
  public users: Map<string, any> = new Map();
  public bonusRates: Map<number, number> = new Map();
  public illustrations: Map<string, any> = new Map();

  constructor() {
    // Seed bonus rates
    DEFAULT_BONUS_RATES.forEach((rate, idx) => {
      this.bonusRates.set(idx + 1, rate);
    });

    // Seed default demo agent user
    const demoId = 'a1b2c3d4-0000-0000-0000-000000000001';
    const demoPasswordHash = bcrypt.hashSync('Password@123', 10);
    this.users.set(demoId, {
      id: demoId,
      email: 'agent@example.com',
      password_hash: demoPasswordHash,
      full_name_encrypted: 'mock_enc_name',
      full_name_masked: 'R****h S****a',
      dob_encrypted: 'mock_enc_dob',
      dob_masked: '****-**-15',
      mobile_encrypted: 'mock_enc_mobile',
      mobile_masked: '******3210',
      mobile_hash: 'mock_hash_agent',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  public async query<R extends QueryResultRow = any>(
    text: string,
    params: any[] = []
  ): Promise<QueryResult<R>> {
    const trimmed = text.trim();

    // 1. SELECT * FROM bonus_rates
    if (/FROM\s+bonus_rates/i.test(trimmed)) {
      const rows: any[] = [];
      for (const [policy_year, rate] of this.bonusRates.entries()) {
        rows.push({ policy_year, rate });
      }
      rows.sort((a, b) => a.policy_year - b.policy_year);
      return { rows: rows as R[], rowCount: rows.length };
    }

    // 2. INSERT INTO users
    if (/^INSERT\s+INTO\s+users/i.test(trimmed)) {
      const id = crypto.randomUUID();
      const now = new Date();
      const user = {
        id,
        email: params[0],
        password_hash: params[1],
        full_name_encrypted: params[2],
        full_name_masked: params[3],
        dob_encrypted: params[4],
        dob_masked: params[5],
        mobile_encrypted: params[6],
        mobile_masked: params[7],
        mobile_hash: params[8],
        created_at: now,
        updated_at: now,
      };
      this.users.set(id, user);
      return { rows: [user as unknown as R], rowCount: 1 };
    }

    // 3. SELECT FROM users WHERE email = $1 OR mobile_hash = $2
    if (/FROM\s+users\s+WHERE\s+email\s*=\s*\$1\s+OR\s+mobile_hash\s*=\s*\$2/i.test(trimmed)) {
      const email = params[0]?.toLowerCase();
      const mobileHash = params[1];
      const match = Array.from(this.users.values()).find(
        (u) => u.email.toLowerCase() === email || u.mobile_hash === mobileHash
      );
      return { rows: match ? [match as unknown as R] : [], rowCount: match ? 1 : 0 };
    }

    // 4. SELECT FROM users WHERE email = $1
    if (/FROM\s+users\s+WHERE\s+email\s*=\s*\$1/i.test(trimmed)) {
      const email = params[0]?.toLowerCase();
      const match = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email);
      return { rows: match ? [match as unknown as R] : [], rowCount: match ? 1 : 0 };
    }

    // 5. SELECT FROM users WHERE id = $1
    if (/FROM\s+users\s+WHERE\s+id\s*=\s*\$1/i.test(trimmed)) {
      const id = params[0];
      const match = this.users.get(id);
      return { rows: match ? [match as unknown as R] : [], rowCount: match ? 1 : 0 };
    }

    // 6. INSERT INTO illustrations
    if (/^INSERT\s+INTO\s+illustrations/i.test(trimmed)) {
      const id = crypto.randomUUID();
      const now = new Date();
      const item = {
        id,
        user_id: params[0],
        gender: params[1],
        age: params[2],
        sum_assured: params[3],
        modal_premium: params[4],
        premium_frequency: params[5],
        pt: params[6],
        ppt: params[7],
        annual_premium: params[8],
        total_premium: params[9],
        total_benefit: params[10],
        irr: params[11],
        rows_data: typeof params[12] === 'string' ? JSON.parse(params[12]) : params[12],
        created_at: now,
      };
      this.illustrations.set(id, item);
      return { rows: [item as unknown as R], rowCount: 1 };
    }

    // 7. SELECT FROM illustrations WHERE user_id = $1
    if (/FROM\s+illustrations\s+WHERE\s+user_id\s*=\s*\$1/i.test(trimmed)) {
      const userId = params[0];
      const userIllustrations = Array.from(this.illustrations.values())
        .filter((item) => item.user_id === userId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      const limitMatch = trimmed.match(/LIMIT\s+(\d+)/i);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : userIllustrations.length;
      const sliced = userIllustrations.slice(0, limit);
      return { rows: sliced as R[], rowCount: sliced.length };
    }

    return { rows: [], rowCount: 0 };
  }
}

let pool: pg.Pool | null = null;
let inMemoryFallback: InMemoryDb | null = null;
let useFallback = false;

// Initialize Postgres connection
if (env.DATABASE_URL && env.DATABASE_URL.startsWith('postgres')) {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  } catch (err) {
    console.warn('Postgres pool creation failed, will use in-memory store:', err);
    useFallback = true;
    inMemoryFallback = new InMemoryDb();
  }
} else {
  useFallback = true;
  inMemoryFallback = new InMemoryDb();
}

/**
 * Executes a parameterized SQL query. Uses Neon Postgres when connected,
 * or the in-memory SQL runner as a seamless fallback.
 */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<R>> {
  if (useFallback || !pool) {
    if (!inMemoryFallback) inMemoryFallback = new InMemoryDb();
    return inMemoryFallback.query<R>(text, params);
  }

  try {
    const res = await pool.query<R>(text, params);
    return { rows: res.rows, rowCount: res.rowCount ?? 0 };
  } catch (err: any) {
    // If remote Neon database is unreachable (e.g. invalid credentials or network block)
    console.warn('Remote database query error, activating in-memory fallback:', err?.message || err);
    useFallback = true;
    if (!inMemoryFallback) inMemoryFallback = new InMemoryDb();
    return inMemoryFallback.query<R>(text, params);
  }
}

/**
 * Initializes database tables and seed data.
 */
export async function initDb(): Promise<void> {
  if (!useFallback && pool) {
    try {
      // Test connection
      await pool.query('SELECT 1');
      console.log('Connected successfully to Neon Postgres database.');

      // Initialize tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name_encrypted TEXT NOT NULL,
          full_name_masked VARCHAR(255) NOT NULL,
          dob_encrypted TEXT NOT NULL,
          dob_masked VARCHAR(50) NOT NULL,
          mobile_encrypted TEXT NOT NULL,
          mobile_masked VARCHAR(50) NOT NULL,
          mobile_hash VARCHAR(64) UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS bonus_rates (
          policy_year INT PRIMARY KEY,
          rate NUMERIC(6, 4) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS illustrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          gender VARCHAR(10) NOT NULL,
          age INT NOT NULL,
          sum_assured NUMERIC(15, 2) NOT NULL,
          modal_premium NUMERIC(15, 2) NOT NULL,
          premium_frequency VARCHAR(20) NOT NULL,
          pt INT NOT NULL,
          ppt INT NOT NULL,
          annual_premium NUMERIC(15, 2) NOT NULL,
          total_premium NUMERIC(15, 2) NOT NULL,
          total_benefit NUMERIC(15, 2) NOT NULL,
          irr NUMERIC(10, 6) NOT NULL,
          rows_data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Seed 20 bonus rates if not already present
      for (let y = 1; y <= 20; y++) {
        const rate = DEFAULT_BONUS_RATES[y - 1];
        await pool.query(
          `INSERT INTO bonus_rates (policy_year, rate) VALUES ($1, $2)
           ON CONFLICT (policy_year) DO UPDATE SET rate = EXCLUDED.rate`,
          [y, rate]
        );
      }
      console.log('Database tables & 20-year bonus rates verified.');
    } catch (err: any) {
      console.warn('Could not connect to external DB, using in-memory DB fallback:', err?.message || err);
      useFallback = true;
      inMemoryFallback = new InMemoryDb();
    }
  } else {
    console.log('Running with zero-config in-memory database store.');
  }
}
