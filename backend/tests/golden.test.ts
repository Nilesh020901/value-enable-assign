import { describe, it, expect } from 'vitest';
import { calculateIllustration } from '../src/services/calculation.js';

describe('Golden Case from Excel Sheet', () => {
  it('accurately reproduces year-1 cashflow, year-18 benefit and IRR of ~0.08415', () => {
    // Inputs from Excel sample sheet:
    // SA: 1,200,000, Modal Premium: 80,000 (Yearly), PT: 18, PPT: 10
    const result = calculateIllustration({
      sumAssured: 1200000,
      modalPremium: 80000,
      premiumFrequency: 'Yearly',
      pt: 18,
      ppt: 10,
    });

    expect(result.rows).toHaveLength(20);

    // Premium is paid for years 1 to 10
    for (let y = 1; y <= 10; y++) {
      expect(result.rows[y - 1].premium).toBe(80000);
      expect(result.rows[y - 1].netCashflow).toBe(-80000);
    }

    // Year 1 net cashflow must be -80,000
    expect(result.rows[0].netCashflow).toBe(-80000);

    // Years 11 to 17 have 0 premium and 0 benefit
    for (let y = 11; y <= 17; y++) {
      expect(result.rows[y - 1].premium).toBe(0);
      expect(result.rows[y - 1].totalBenefit).toBe(0);
      expect(result.rows[y - 1].netCashflow).toBe(0);
    }

    // Year 18 is PT (Maturity)
    // Maturity Benefit = SA (1,200,000) + SUM(Bonus of all 20 years) = 2,256,000
    const year18Row = result.rows[17];
    expect(year18Row.policyYear).toBe(18);
    expect(year18Row.sumAssured).toBe(1200000);
    expect(year18Row.totalBenefit).toBe(2256000);
    expect(year18Row.netCashflow).toBe(2256000);
    expect(result.totalBenefit).toBe(2256000);

    // Total premium paid across PPT (10 years) = 800,000
    expect(result.totalPremium).toBe(800000);

    // IRR from Excel cell G2 is 8.4150148...% (~0.08415)
    expect(result.irr).toBeCloseTo(0.08415, 4);
    expect(Math.abs(result.irr - 0.084150148)).toBeLessThan(1e-5);
  });
});
