import { describe, it, expect } from 'vitest';
import { calculateAge } from '../src/services/calculation.js';

describe('Age Calculation - Completed Birthday & Leap Day Logic', () => {
  const asOf = new Date('2026-10-13'); // Reference date

  it('calculates age correctly when birthday is today', () => {
    // Born 2000-10-13 -> turns 26 today
    expect(calculateAge('2000-10-13', asOf)).toBe(26);
  });

  it('calculates age correctly when birthday is tomorrow', () => {
    // Born 2000-10-14 -> turns 26 tomorrow, still 25 today
    expect(calculateAge('2000-10-14', asOf)).toBe(25);
  });

  it('calculates age correctly when birthday was yesterday', () => {
    // Born 2000-10-12 -> turned 26 yesterday
    expect(calculateAge('2000-10-12', asOf)).toBe(26);
  });

  it('handles leap day (Feb 29) births correctly on non-leap years', () => {
    // 2000 was a leap year, born on Feb 29
    // As of 2026-02-28: has not reached March 1st/completed birthday yet
    const beforeFeb29 = new Date('2026-02-28');
    expect(calculateAge('2000-02-29', beforeFeb29)).toBe(25);

    // As of 2026-03-01: birthday anniversary has passed
    const afterFeb29 = new Date('2026-03-01');
    expect(calculateAge('2000-02-29', afterFeb29)).toBe(26);
  });

  it('handles leap day (Feb 29) on a leap year', () => {
    // As of 2024-02-29 (a leap year)
    const leapDayCurrent = new Date('2024-02-29');
    expect(calculateAge('2000-02-29', leapDayCurrent)).toBe(24);
  });

  it('throws an error for invalid date inputs', () => {
    expect(() => calculateAge('invalid-date')).toThrow('Invalid Date of Birth');
  });
});
