/**
 * PostgreSQL Schema DDL Definitions
 */
export const SCHEMA_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_illustrations_user_id_created ON illustrations(user_id, created_at DESC);
`;
