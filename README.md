## Tech Stack

- **Frontend**: React 19 + TypeScript (Vite), Tailwind CSS, Lucide Icons, React Router DOM
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 
- **Security & PII**: AES-256-GCM encryption for Name, DOB, Mobile; HMAC-SHA256 deterministic mobile indexing; bcrypt password hashing; Helmet headers, CORS, and rate limiting
- **Testing**: Vitest test runner (Golden Excel match, 5 validations, age, crypto & API tests)

---

## Excel Actuarial Logic & 5 Validation Rules

The application mirrors the logic defined in `assignment_reference_sample_1.xlsm`:

1. **Annualized Premium**:
   - $\text{Annual Premium} = \text{Modal Premium} \times \text{Multiplier}$
     - Yearly: $\times 1$ | Half-Yearly: $\times 2$ | Monthly: $\times 12$

2. **5 Input Validations (Executed concurrently, returning all errors together)**:
   - **Rule 1**: PPT in $[5, 10]$, PT in $[10, 20]$, Modal Premium in $[10000, 50000]$.
   - **Rule 2**: Policy Term strictly greater than PPT ($PT > PPT$).
   - **Rule 3**: Premium Frequency must be `Yearly`, `Half-Yearly`, or `Monthly`.
   - **Rule 4**: $\text{Sum Assured} \ge \min(10 \times \text{Annual Premium}, 50,00,000)$.
   - **Rule 5**: Age on last completed birthday between $23$ and $56$ years (inclusive).

3. **20-Year Cashflow & Benefit Schedule (Year $y = 1 \dots 20$)**:
   - **Premium**: $y \le \text{PPT} \implies \text{Annual Premium}$, otherwise $0$.
   - **Sum Assured**: $y = \text{PT} \implies \text{SA}$, otherwise $0$.
   - **Bonus Rate**: Looked up from the 20-year bonus rate table:
     `[2.5%, 3.0%, 3.5%, 3.5%, 3.5%, 3.5%, 3.0%, 3.0%, 3.0%, 3.0%, 3.0%, 2.5%, 3.0%, 3.0%, 2.5%, 5.0%, 4.0%, 4.5%, 4.0%, 25.0%]`
   - **Bonus Amount**: $\text{Bonus Rate}_y \times \text{SA}$.
   - **Total Benefit**: At maturity ($y = \text{PT}$), $\text{Total Benefit} = \text{SA} + \sum_{i=1}^{20} \text{Bonus Amount}_i$ (identical to Excel formula `=C_y + SUM(E$1:E$23)`).
   - **Net Cashflow**: If $y = \text{PT}$, equals $\text{Total Benefit}$. Otherwise, $\text{Sum Assured}_y - \text{Premium}_y$.
   - **IRR**: Annualized Internal Rate of Return calculated using Newton-Raphson method with bisection fallback.

4. **Golden Test Case (from Excel Sheet)**:
   - **Inputs**: SA = ₹12,00,000; Premium = ₹80,000 (Yearly); PT = 18; PPT = 10.
   - **Outputs**: Year-1 Net Cashflow = -₹80,000; Year-18 Total Benefit = ₹22,56,000; IRR = **8.41501%** ($\approx 0.08415$).

---

## Setup & Running Locally

### 1. Backend Setup
```bash
cd backend
npm install

# Run Vitest test suites (All 42 tests)
npm test

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
# Web app runs on http://localhost:5173
```

### Demo Credentials
- **Email**: `agent@example.com`
- **Password**: `Password@123`
*(Or create a new account via the `/register` page).*

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
