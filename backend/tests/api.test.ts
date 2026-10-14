import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../src/server.js';
import { initDb, pool } from '../src/db/index.js';
import http from 'http';

let server: http.Server;
let baseUrl: string;
let authCookie: string = '';

beforeAll(async () => {
  await initDb();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}, 30000);

afterAll(async () => {
  if (server) {
    server.close();
  }
  await pool.end();
});

describe('Full Backend API Integration Tests', () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testUser = {
    name: 'Rajesh Sharma',
    email: `rajesh_${Date.now()}_${randomSuffix}@example.com`,
    mobile: `987654${randomSuffix}`,
    dob: '1995-06-15',
    password: 'Password@123',
  };

  it('POST /api/auth/register registers user and returns masked PII + sets cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email.toLowerCase());
    expect(data.user.mobile).toBe(`******${randomSuffix}`);
    expect(data.user.dob).toBe('****-**-15');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('jwt=');
    authCookie = setCookie ? setCookie.split(';')[0] : '';
  });

  it('GET /api/auth/me returns authenticated user details', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: authCookie },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe(testUser.email.toLowerCase());
    expect(data.user.mobile).toBe(`******${randomSuffix}`);
  });

  it('GET /api/policy/config returns valid policy constraints, 20 bonus rates, policy types, riders, and premium options', async () => {
    const res = await fetch(`${baseUrl}/api/policy/config`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.pptRange).toEqual({ min: 5, max: 10 });
    expect(data.ptRange).toEqual({ min: 10, max: 20 });
    expect(data.bonusRates).toHaveLength(20);
    expect(data.policyTypes).toBeDefined();
    expect(data.policyTypes.length).toBeGreaterThanOrEqual(4);
    expect(data.riders).toBeDefined();
    expect(data.riders.length).toBeGreaterThanOrEqual(4);
    expect(data.premiumOptions).toBeDefined();
    expect(data.premiumOptions).toHaveLength(3);
  });

  it('POST /api/illustrations/calculate rejects invalid inputs and returns all errors together', async () => {
    const invalidPayload = {
      dob: '2020-01-01', // Age too young (< 23)
      gender: 'M',
      sumAssured: 10000, // SA below minimum requirement
      modalPremium: 5000, // Premium below 10,000
      premiumFrequency: 'Quarterly', // Invalid frequency
      pt: 8, // PT < 10
      ppt: 12, // PPT > 10
    };

    const res = await fetch(`${baseUrl}/api/illustrations/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify(invalidPayload),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors).toBeDefined();
    expect(data.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('POST /api/illustrations/calculate succeeds with valid inputs, policy type, and riders', async () => {
    const validPayload = {
      dob: '1995-06-15', // Age ~31
      gender: 'M',
      policyType: 'Endowment',
      sumAssured: 1000000,
      modalPremium: 40000,
      premiumFrequency: 'Yearly',
      pt: 16,
      ppt: 10,
      riders: [
        { code: 'ADB', sumAssured: 1000000 },
        { code: 'CI', sumAssured: 500000 },
      ],
    };

    const res = await fetch(`${baseUrl}/api/illustrations/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify(validPayload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.illustration).toBeDefined();
    expect(data.illustration.policyType).toBe('Endowment');
    expect(data.illustration.rows).toHaveLength(20);
    expect(data.illustration.totalPremium).toBe(400000);
    expect(data.illustration.pt).toBe(16);
    expect(data.illustration.age).toBeGreaterThanOrEqual(23);
    expect(data.illustration.riders).toHaveLength(2);
    expect(data.illustration.totalAnnualRiderPremium).toBeGreaterThan(0);
  });

  it('GET /api/illustrations/latest retrieves the saved illustration with rider details', async () => {
    const res = await fetch(`${baseUrl}/api/illustrations/latest`, {
      headers: { Cookie: authCookie },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.illustration).toBeDefined();
    expect(data.illustration.rows).toHaveLength(20);
    expect(data.illustration.sumAssured).toBe(1000000);
    expect(data.illustration.policyType).toBe('Endowment');
    expect(data.illustration.riders).toHaveLength(2);
  });

  it('POST /api/auth/logout clears auth cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: authCookie },
    });

    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('jwt=;');
  });
});
