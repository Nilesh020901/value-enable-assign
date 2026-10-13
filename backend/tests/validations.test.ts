import { describe, it, expect } from 'vitest';
import { validatePolicyInputs } from '../src/services/validation.js';

describe('Policy Validations - 5 Rules and Boundary Testing', () => {
  const asOfDate = new Date('2026-10-13'); // Fixed reference date

  const validBaseInput = {
    dob: '1996-05-10', // Age 30 (between 23 and 56)
    gender: 'M',
    sumAssured: 500000,
    modalPremium: 30000, // (between 10k and 50k)
    premiumFrequency: 'Yearly',
    pt: 15, // (between 10 and 20, > PPT)
    ppt: 8, // (between 5 and 10)
  };

  it('passes when all 5 inputs satisfy valid ranges and conditions', () => {
    const result = validatePolicyInputs(validBaseInput, asOfDate);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe('Validation 1: PPT 5-10, PT 10-20, Modal Premium 10,000-50,000', () => {
    // PPT boundaries
    it('accepts PPT boundary values 5 and 10', () => {
      expect(validatePolicyInputs({ ...validBaseInput, ppt: 5, pt: 12 }, asOfDate).isValid).toBe(true);
      expect(validatePolicyInputs({ ...validBaseInput, ppt: 10, pt: 15 }, asOfDate).isValid).toBe(true);
    });

    it('rejects PPT < 5 or > 10', () => {
      const under = validatePolicyInputs({ ...validBaseInput, ppt: 4 }, asOfDate);
      expect(under.isValid).toBe(false);
      expect(under.errors.some((e) => e.field === 'ppt')).toBe(true);

      const over = validatePolicyInputs({ ...validBaseInput, ppt: 11 }, asOfDate);
      expect(over.isValid).toBe(false);
      expect(over.errors.some((e) => e.field === 'ppt')).toBe(true);
    });

    // PT boundaries
    it('accepts PT boundary values 10 and 20 (with PT > PPT)', () => {
      expect(validatePolicyInputs({ ...validBaseInput, ppt: 5, pt: 10 }, asOfDate).isValid).toBe(true);
      expect(validatePolicyInputs({ ...validBaseInput, ppt: 10, pt: 20 }, asOfDate).isValid).toBe(true);
    });

    it('rejects PT < 10 or > 20', () => {
      const under = validatePolicyInputs({ ...validBaseInput, ppt: 5, pt: 9 }, asOfDate);
      expect(under.isValid).toBe(false);
      expect(under.errors.some((e) => e.field === 'pt')).toBe(true);

      const over = validatePolicyInputs({ ...validBaseInput, pt: 21 }, asOfDate);
      expect(over.isValid).toBe(false);
      expect(over.errors.some((e) => e.field === 'pt')).toBe(true);
    });

    // Modal Premium boundaries
    it('accepts Modal Premium boundaries 10,000 and 50,000', () => {
      expect(
        validatePolicyInputs({ ...validBaseInput, modalPremium: 10000, sumAssured: 100000 }, asOfDate)
          .isValid
      ).toBe(true);
      expect(
        validatePolicyInputs({ ...validBaseInput, modalPremium: 50000, sumAssured: 500000 }, asOfDate)
          .isValid
      ).toBe(true);
    });

    it('rejects Modal Premium < 10,000 or > 50,000', () => {
      const under = validatePolicyInputs({ ...validBaseInput, modalPremium: 9999 }, asOfDate);
      expect(under.isValid).toBe(false);
      expect(under.errors.some((e) => e.field === 'modalPremium')).toBe(true);

      const over = validatePolicyInputs({ ...validBaseInput, modalPremium: 50001 }, asOfDate);
      expect(over.isValid).toBe(false);
      expect(over.errors.some((e) => e.field === 'modalPremium')).toBe(true);
    });
  });

  describe('Validation 2: PT > PPT', () => {
    it('rejects when PT == PPT', () => {
      const result = validatePolicyInputs({ ...validBaseInput, pt: 10, ppt: 10 }, asOfDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'pt')).toBe(true);
    });

    it('rejects when PT < PPT', () => {
      const result = validatePolicyInputs({ ...validBaseInput, pt: 10, ppt: 10 }, asOfDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'pt')).toBe(true);
    });

    it('passes when PT is strictly greater than PPT', () => {
      const result = validatePolicyInputs({ ...validBaseInput, pt: 11, ppt: 10 }, asOfDate);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Validation 3: Frequency in Yearly / Half-Yearly / Monthly', () => {
    it('accepts all three valid frequencies', () => {
      expect(validatePolicyInputs({ ...validBaseInput, premiumFrequency: 'Yearly' }, asOfDate).isValid).toBe(true);
      expect(
        validatePolicyInputs({ ...validBaseInput, premiumFrequency: 'Half-Yearly', sumAssured: 600000 }, asOfDate)
          .isValid
      ).toBe(true);
      expect(
        validatePolicyInputs({ ...validBaseInput, premiumFrequency: 'Monthly', sumAssured: 3600000 }, asOfDate)
          .isValid
      ).toBe(true);
    });

    it('rejects invalid frequencies like Quarterly or Weekly', () => {
      const quarterly = validatePolicyInputs({ ...validBaseInput, premiumFrequency: 'Quarterly' }, asOfDate);
      expect(quarterly.isValid).toBe(false);
      expect(quarterly.errors.some((e) => e.field === 'premiumFrequency')).toBe(true);
    });
  });

  describe('Validation 4: Sum Assured >= min(10 * annual premium, 50,00,000)', () => {
    it('passes when SA exactly equals 10 * annual premium', () => {
      // Modal = 20,000, Yearly -> Annual = 20,000 -> 10 * 20,000 = 200,000
      const result = validatePolicyInputs(
        { ...validBaseInput, modalPremium: 20000, premiumFrequency: 'Yearly', sumAssured: 200000 },
        asOfDate
      );
      expect(result.isValid).toBe(true);
    });

    it('fails when SA is below 10 * annual premium', () => {
      const result = validatePolicyInputs(
        { ...validBaseInput, modalPremium: 20000, premiumFrequency: 'Yearly', sumAssured: 199999 },
        asOfDate
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'sumAssured')).toBe(true);
    });

    it('respects the 50,00,000 cap when 10 * annual premium exceeds 50 Lakhs', () => {
      // Monthly 50,000 -> Annual = 600,000 -> 10 * Annual = 6,000,000 (60 Lakhs)
      // Min SA is min(60 Lakhs, 50 Lakhs) = 50 Lakhs (5,000,000)
      const passAtCap = validatePolicyInputs(
        { ...validBaseInput, modalPremium: 50000, premiumFrequency: 'Monthly', sumAssured: 5000000 },
        asOfDate
      );
      expect(passAtCap.isValid).toBe(true);

      const failBelowCap = validatePolicyInputs(
        { ...validBaseInput, modalPremium: 50000, premiumFrequency: 'Monthly', sumAssured: 4999999 },
        asOfDate
      );
      expect(failBelowCap.isValid).toBe(false);
      expect(failBelowCap.errors.some((e) => e.field === 'sumAssured')).toBe(true);
    });
  });

  describe('Validation 5: Age (last birthday) between 23 and 56', () => {
    it('accepts boundary age 23 and boundary age 56', () => {
      // asOfDate: 2026-10-13
      // Born 2003-10-13 -> Exactly age 23
      const age23 = validatePolicyInputs({ ...validBaseInput, dob: '2003-10-13' }, asOfDate);
      expect(age23.isValid).toBe(true);

      // Born 1970-10-13 -> Exactly age 56
      const age56 = validatePolicyInputs({ ...validBaseInput, dob: '1970-10-13' }, asOfDate);
      expect(age56.isValid).toBe(true);
    });

    it('rejects age under 23 (e.g. 22)', () => {
      // Born 2003-10-14 -> Turn 23 tomorrow, so today still 22
      const age22 = validatePolicyInputs({ ...validBaseInput, dob: '2003-10-14' }, asOfDate);
      expect(age22.isValid).toBe(false);
      expect(age22.errors.some((e) => e.field === 'dob')).toBe(true);
    });

    it('rejects age over 56 (e.g. 57)', () => {
      // Born 1969-10-12 -> 57 years old
      const age57 = validatePolicyInputs({ ...validBaseInput, dob: '1969-10-12' }, asOfDate);
      expect(age57.isValid).toBe(false);
      expect(age57.errors.some((e) => e.field === 'dob')).toBe(true);
    });
  });

  describe('Return all validation errors together', () => {
    it('accumulates and returns multiple errors simultaneously', () => {
      const invalidInput = {
        dob: '2015-01-01', // Age 11 (fails age rule)
        gender: 'F',
        sumAssured: 1000, // Fails min SA rule
        modalPremium: 5000, // Fails modal premium range rule (< 10000)
        premiumFrequency: 'InvalidFreq', // Fails frequency rule
        pt: 8, // Fails PT range rule (< 10) AND fails PT > PPT
        ppt: 12, // Fails PPT range rule (> 10)
      };

      const result = validatePolicyInputs(invalidInput, asOfDate);
      expect(result.isValid).toBe(false);
      // Must contain errors for ppt, pt, modalPremium, premiumFrequency, sumAssured, and dob
      const fields = result.errors.map((e) => e.field);
      expect(fields).toContain('ppt');
      expect(fields).toContain('pt');
      expect(fields).toContain('modalPremium');
      expect(fields).toContain('premiumFrequency');
      expect(fields).toContain('sumAssured');
      expect(fields).toContain('dob');
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
    });
  });
});
