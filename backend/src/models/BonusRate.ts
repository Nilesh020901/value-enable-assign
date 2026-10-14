import { query } from '../db/index.js';

export interface IBonusRate {
  policy_year: number;
  rate: number;
}

export const BonusRateModel = {
  /**
   * Fetch all 20-year bonus rates sorted by policy year
   */
  async getAll(): Promise<number[]> {
    const res = await query<IBonusRate>(
      'SELECT policy_year, rate FROM bonus_rates ORDER BY policy_year ASC'
    );
    return res.rows.map((r) => parseFloat(r.rate as unknown as string));
  },

  /**
   * Upsert a bonus rate for a given policy year
   */
  async upsert(policyYear: number, rate: number): Promise<void> {
    await query(
      `INSERT INTO bonus_rates (policy_year, rate) VALUES ($1, $2)
       ON CONFLICT (policy_year) DO UPDATE SET rate = EXCLUDED.rate`,
      [policyYear, rate]
    );
  },

  /**
   * Seed default 20-year rates from sample Excel sheet
   */
  async seedDefaults(defaultRates: number[]): Promise<void> {
    for (let y = 1; y <= defaultRates.length; y++) {
      await this.upsert(y, defaultRates[y - 1]);
    }
  },
};
