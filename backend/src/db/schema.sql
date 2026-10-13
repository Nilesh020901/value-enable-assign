-- Neon Postgres Schema for Insurance Benefit Illustration App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Stores encrypted PII, masked representations, and HMAC mobile hash)
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

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile_hash ON users(mobile_hash);

-- 2. Bonus Rates Table (Pre-seeded with 20-year rates)
CREATE TABLE IF NOT EXISTS bonus_rates (
  policy_year INT PRIMARY KEY,
  rate NUMERIC(6, 4) NOT NULL
);

-- Seed initial 20-year bonus rates
INSERT INTO bonus_rates (policy_year, rate) VALUES
  (1, 0.0250),
  (2, 0.0300),
  (3, 0.0350),
  (4, 0.0350),
  (5, 0.0350),
  (6, 0.0350),
  (7, 0.0300),
  (8, 0.0300),
  (9, 0.0300),
  (10, 0.0300),
  (11, 0.0300),
  (12, 0.0250),
  (13, 0.0300),
  (14, 0.0300),
  (15, 0.0250),
  (16, 0.0500),
  (17, 0.0400),
  (18, 0.0450),
  (19, 0.0400),
  (20, 0.2500)
ON CONFLICT (policy_year) DO UPDATE SET rate = EXCLUDED.rate;

-- 3. Benefit Illustrations Table (Stores calculated illustrations per user)
-- Note: DOB is omitted; only age is stored to protect PII.
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

CREATE INDEX IF NOT EXISTS idx_illustrations_user_id ON illustrations(user_id);
CREATE INDEX IF NOT EXISTS idx_illustrations_created_at ON illustrations(created_at DESC);
