# Insurance Benefit Illustration Application

A full-stack Life Insurance Benefit Illustration application built to replicate standard actuarial illustration models (referencing Excel actuarial sheets). It features AES-256-GCM encryption for sensitive personal data, pure actuarial calculation & validation engines, seamless Neon PostgreSQL persistence, Vitest test suites, and a responsive React interface.

---

## Architecture & Technology Stack

- **Frontend**: React 19 + TypeScript (Vite), Tailwind CSS, Lucide Icons, React Router DOM
- **Backend**: Node.js + Express + TypeScript (Strict mode, zero `any`)
- **Database**: PostgreSQL (Neon Serverless PostgreSQL via `pg` connection pool with in-memory zero-config fallback)
- **Security & PII**: AES-256-GCM authenticated encryption for Name, DOB, Mobile; HMAC-SHA256 for deterministic mobile indexing; bcrypt password hashing; Helmet headers, CORS restrictions, Rate Limiting, and parameterized SQL queries
- **Testing**: Vitest test runner

---

## Excel Actuarial Logic & Understanding

The application mirrors the logic defined in `assignment_reference_sample_1.xlsm`:

1. **Policy Information & Data Structures**:
   - **Policy Types**: Supported models include `Endowment` (Guaranteed Savings Plan), `TermLife` (Pure Protection), `MoneyBack` (Periodic Cashflows), and `WholeLife` (Lifetime Protection).
   - **Riders Data Structure**: Optional coverage add-ons including Accidental Death & Disability Benefit (`ADB`), Comprehensive Critical Illness (`CI`), Waiver of Premium (`WOP`), and Term Booster (`TERM_BOOSTER`), with configurable premium rates per ₹1,000 SA and cover caps.
   - **Premium Options**: Configurable frequency options (`Yearly`, `Half-Yearly`, `Monthly`) with modal factor multipliers (1x, 2x, 12x).
   - **Base Policy Inputs**:
     - `DOB` (Date of Birth)
     - `Gender` (`M`, `F`, `Other`)
     - `Sum Assured` (`SA`)
     - `Modal Premium`
     - `Premium Frequency` (`Yearly`, `Half-Yearly`, `Monthly`)
     - `Policy Term` (`PT`: 10–20 years)
     - `Premium Payment Term` (`PPT`: 5–10 years)

2. **Annualized Premium**:
   - $\text{Annual Premium} = \text{Modal Premium} \times \text{Multiplier}$
     - Yearly: $\times 1$
     - Half-Yearly: $\times 2$
     - Monthly: $\times 12$

3. **5 Validation Rules (Executed concurrently, returning all errors together)**:
   - **Rule 1**: PPT in $[5, 10]$, PT in $[10, 20]$, Modal Premium in $[10000, 50000]$.
   - **Rule 2**: PT strictly greater than PPT ($PT > PPT$).
   - **Rule 3**: Premium Frequency must be one of `Yearly`, `Half-Yearly`, or `Monthly`.
   - **Rule 4**: $\text{Sum Assured} \ge \min(10 \times \text{Annual Premium}, 50,00,000)$ using constants `MIN_SA_MULTIPLIER = 10` and `MIN_SA_CAP = 5000000`.
   - **Rule 5**: Age on last completed birthday between $23$ and $56$ years (inclusive).

4. **20-Year Cashflow & Benefit Schedule (for Policy Year $y = 1 \dots 20$)**:
   - **Premium**: $y \le \text{PPT} \implies \text{Annual Premium}$, otherwise $0$.
   - **Sum Assured**: $y = \text{PT} \implies \text{SA}$, otherwise $0$.
   - **Bonus Rate**: Looked up from the 20-year bonus rate table:
     `[2.5%, 3.0%, 3.5%, 3.5%, 3.5%, 3.5%, 3.0%, 3.0%, 3.0%, 3.0%, 3.0%, 2.5%, 3.0%, 3.0%, 2.5%, 5.0%, 4.0%, 4.5%, 4.0%, 25.0%]`
   - **Bonus Amount**: $\text{Bonus Rate}_y \times \text{SA}$.
   - **Total Benefit**: At maturity ($y = \text{PT}$), $\text{Total Benefit} = \text{SA} + \sum_{i=1}^{20} \text{Bonus Amount}_i$ (identical to Excel formula `=C_y + SUM(E$1:E$23)`). For all other years, $0$.
   - **Net Cashflow**: If $y = \text{PT}$, equals $\text{Total Benefit}$. Otherwise, $\text{Sum Assured}_y - \text{Premium}_y$.
   - **IRR**: Annualized Internal Rate of Return calculated using Newton-Raphson method with bisection fallback on net cashflow series ($y = 1 \dots 20$).

5. **Golden Test Case (from Excel Sheet)**:
   - Parameters: SA = ₹12,00,000; Premium = ₹80,000 (Yearly); PT = 18; PPT = 10.
   - Outputs: Year-1 Net Cashflow = -₹80,000; Year-18 Total Benefit = ₹22,56,000; IRR = 8.41501% ($\approx 0.08415$).

---

## Directory Layout

```
value-enable-assignment/
├── backend/
│   ├── src/
│   │   ├── config/env.ts             # Zod environment variable validation
│   │   ├── db/
│   │   │   ├── index.ts              # pg Pool & zero-config fallback
│   │   │   └── schema.sql            # PostgreSQL DDL & seed data
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts     # JWT verification from httpOnly cookie
│   │   │   ├── errorHandler.ts       # Global error handler (zero PII logging)
│   │   │   └── rateLimiter.ts        # Rate limiter for auth endpoints
│   │   ├── routes/
│   │   │   ├── auth.ts               # Register, Login, Logout, Me
│   │   │   ├── illustrations.ts      # Calculate & Latest illustration endpoints
│   │   │   └── policy.ts             # Policy configuration & bonus rates
│   │   ├── services/
│   │   │   ├── calculation.ts        # Pure calculation engine (IRR, age, schedule)
│   │   │   ├── validation.ts         # Pure 5-rule validation engine
│   │   │   ├── crypto.ts             # AES-256-GCM, HMAC-SHA256, PII masking
│   │   │   ├── authService.ts        # User registration and login logic
│   │   │   └── illustrationService.ts# Illustration calculation and DB storage
│   │   └── server.ts                 # Express app configuration & startup
│   ├── tests/
│   │   ├── golden.test.ts            # Golden case verification against Excel
│   │   ├── validations.test.ts       # 5 validation rules & boundary testing
│   │   ├── age.test.ts               # Completed birthday & leap day testing
│   │   ├── crypto.test.ts            # AES-256-GCM round trip, HMAC, masking
│   │   └── api.test.ts               # Full end-to-end API integration tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Sidebar navigation & agent profile
│   │   │   ├── SummaryCards.tsx      # Total Premium, Benefit, IRR KPI cards
│   │   │   └── IllustrationTable.tsx # 20-year schedule table with highlights
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Agent sign-in screen
│   │   │   ├── Register.tsx          # Agent registration screen
│   │   │   ├── PolicyCalculation.tsx # Input form with live age and validations
│   │   │   └── IllustrationPage.tsx  # KPI cards and 20-year cashflow schedule
│   │   ├── services/api.ts           # Frontend API client
│   │   ├── utils/formatters.ts       # Indian currency (₹), %, and live age logic
│   │   ├── App.tsx                   # Routing and session management
│   │   └── main.tsx                  # Application bootstrap
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Setup & Running Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 1. Backend Setup
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Run Vitest test suites (All 42 tests)
npm test

# Build TypeScript
npm run build

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd ../frontend
npm install

# Build frontend bundle
npm run build

# Start Vite dev server
npm run dev
# Web app runs on http://localhost:5173
```

---

## Environment Variables & Secrets Management

| Variable | Description | Example / Required Format |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection URI | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for signing JWT tokens | 32+ character random string |
| `ENCRYPTION_KEY` | AES-256 key for field-level encryption | 64-character Hex string (32 raw bytes) |
| `HMAC_SECRET` | Secret key for deterministic mobile hashing | 32+ character random string |
| `CLIENT_ORIGIN` | Allowed CORS frontend origin | `http://localhost:5173` |
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment identifier | `development` / `production` / `test` |

### Secrets Management Best Practices for Production

1. **Cloud Secret Managers**:
   - Store sensitive keys (`JWT_SECRET`, `ENCRYPTION_KEY`, `HMAC_SECRET`, `DATABASE_URL`) in dedicated secret management services such as **AWS Secrets Manager**, **GCP Secret Manager**, or **HashiCorp Vault**.
   - Inject secrets at container initialization or via Kubernetes Secrets / IAM roles without writing secrets to persistent disks or Git repositories.

2. **Environment Separation**:
   - Maintain completely isolated keys per environment (e.g., Development, Staging, Production). Never reuse cryptographic keys across environments.

3. **Cryptographic Key Rotation Strategy**:
   - Support a **Key Version Identifier (KID)** prepended to encrypted payloads (e.g. `v1:iv:tag:ciphertext`).
   - Maintain an active encryption key alongside retired historical decryption keys to decrypt records without downtime.
   - Run asynchronous background maintenance workers to re-encrypt existing records under the latest key version.

---

## API Endpoints Reference

All endpoints return structured JSON. When an error occurs, responses adhere to `{ message: string, errors?: { field: string, message: string }[] }`.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user. Hashes password, encrypts name/DOB/mobile, stores masked values | No |
| `POST` | `/api/auth/login` | Authenticate agent. Issues `httpOnly` secure JWT cookie | No |
| `POST` | `/api/auth/logout` | Clears `httpOnly` JWT session cookie | No |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile with masked PII | Yes |
| `GET` | `/api/policy/config` | Retrieve policy constraints, valid ranges, 20-year bonus rates, supported policy types, riders catalog, and premium options | No |
| `POST` | `/api/illustrations/calculate` | Validates all 5 rules, computes 20-year cashflows + IRR, persists to DB, and returns result | Yes |
| `GET` | `/api/illustrations/latest` | Retrieve the most recent benefit illustration computed by the user | Yes |

---

## Testing Strategy & Vitest Suite

All actuarial calculations, age calculations, validations, cryptographic functions, and API flows are thoroughly tested using Vitest:

- **Golden Case Test** (`tests/golden.test.ts`):
  Calls the calculation engine directly on the exact inputs from the sample Excel sheet (`SA = 12,00,000`, `Modal Premium = 80,000 Yearly`, `PT = 18`, `PPT = 10`), verifying:
  - Year-1 net cashflow = -₹80,000
  - Year-18 total benefit = ₹22,56,000
  - IRR $\approx 0.08415$ (within $10^{-5}$)
- **Validations Test Suite** (`tests/validations.test.ts`):
  Tests all 5 rules for boundary values, valid cases, edge failures, and confirms that multiple simultaneous errors are returned together.
- **Age Calculation Test Suite** (`tests/age.test.ts`):
  Tests last completed birthday logic, same-day birthdays, birthdays occurring tomorrow, and leap-day births (February 29).
- **Crypto & Masking Test Suite** (`tests/crypto.test.ts`):
  Verifies AES-256-GCM round-trip encryption/decryption, ciphertext tampering detection, HMAC-SHA256 deterministic mobile hashing, and masking masks for name, mobile, and DOB.
- **API Integration Test Suite** (`tests/api.test.ts`):
  Verifies complete end-to-end user registration, cookie authentication, policy validation failure reporting, illustration calculation, and latest illustration retrieval.

To run all tests:
```bash
cd backend
npm test
```

---

## Scalability Architecture for Millions of Records

When scaling the Benefit Illustration module to process **millions of records** in bulk batch uploads, the following asynchronous event-driven architecture is recommended:

```
[Client / Bulk Upload]
         │ (1. Direct Multipart S3 Upload)
         ▼
    [Amazon S3]
         │ (2. ObjectCreated Event)
         ▼
 [SQS / BullMQ Queue]
         │ (3. Dispatches Batch Tasks)
         ▼
 [Worker Pool (Fargate / K8s)] ──▶ [Pure Stateless Calc Engine]
         │
         │ (4. Chunks of 1,000 rows via PostgreSQL COPY)
         ▼
 [Neon Postgres Partitioned Table]
         │
         │ (5. Exports Processed Results to S3)
         ▼
   [Download S3 URL] ◀── Polling / Webhook Notifications
```

1. **Stateless Pure Calculation Engine**:
   - The core calculation logic (`calculateIllustration`, `calculateIRR`, and `validatePolicyInputs`) consists entirely of pure, side-effect-free functions without database or network I/O.
   - This enables worker nodes to auto-scale horizontally with zero shared state and evaluate thousands of policy illustrations per second per CPU core.

2. **Decoupled Upload via Presigned S3 URLs**:
   - Rather than passing multi-gigabyte CSV files through the web API server, users request a pre-signed S3 URL and upload files directly to cloud object storage.

3. **Message Queue & Streaming Chunked Processing**:
   - S3 triggers an event to **AWS SQS** or **BullMQ** (Redis).
   - Worker processes read input streams with backpressure control using Node.js streams or Go/Rust microservices, avoiding loading massive CSV files into RAM.

4. **Batch Insertion via PostgreSQL `COPY` Protocol**:
   - Instead of running individual `INSERT` statements, workers stream processed records in batches of 1,000 to 5,000 rows using PostgreSQL `pg-copy-streams` (`COPY illustrations FROM STDIN`).
   - This delivers up to a 50x throughput improvement over standard parameterized inserts.

5. **Table Partitioning & Index Management**:
   - The `illustrations` table is partitioned using **PostgreSQL Declarative Partitioning** (e.g. Range Partitioning by `batch_id` or `created_at` monthly).
   - High-volume bulk writes write directly to specific child partition tables, isolating lock contention and allowing partition pruning during analytical queries.

6. **Idempotency & Fault Tolerance**:
   - Each batch job carries a deterministic `batch_id` and row sequence number.
   - Workers utilize PostgreSQL `ON CONFLICT (batch_id, row_number) DO NOTHING` to guarantee safe retries in the event of worker preemptions or network drops.

7. **Asynchronous Notification & Status Polling**:
   - The system exposes a lightweight status endpoint (`GET /api/jobs/:jobId`) reporting progress percentage, completed rows, failed rows, and a downloadable presigned S3 link once processing completes.
