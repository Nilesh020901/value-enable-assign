import { query } from '../db/index.js';

export interface IIllustration {
  id: string;
  user_id: string;
  gender: string;
  age: number;
  sum_assured: number;
  modal_premium: number;
  premium_frequency: string;
  pt: number;
  ppt: number;
  annual_premium: number;
  total_premium: number;
  total_benefit: number;
  irr: number;
  rows_data: any;
  created_at: Date;
}

export interface CreateIllustrationInput {
  userId: string;
  gender: string;
  age: number;
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: string;
  pt: number;
  ppt: number;
  annualPremium: number;
  totalPremium: number;
  totalBenefit: number;
  irr: number;
  rowsData: any;
}

export const IllustrationModel = {
  /**
   * Insert calculated benefit illustration record
   */
  async create(input: CreateIllustrationInput): Promise<{ id: string; created_at: Date }> {
    const res = await query<{ id: string; created_at: Date }>(
      `INSERT INTO illustrations (
        user_id, gender, age, sum_assured, modal_premium,
        premium_frequency, pt, ppt, annual_premium,
        total_premium, total_benefit, irr, rows_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, created_at`,
      [
        input.userId,
        input.gender,
        input.age,
        input.sumAssured,
        input.modalPremium,
        input.premiumFrequency,
        input.pt,
        input.ppt,
        input.annualPremium,
        input.totalPremium,
        input.totalBenefit,
        input.irr,
        JSON.stringify(input.rowsData),
      ]
    );
    return res.rows[0];
  },

  /**
   * Retrieve the most recent illustration calculation for a specific user
   */
  async findLatestByUserId(userId: string): Promise<IIllustration | null> {
    const res = await query<IIllustration>(
      `SELECT id, user_id, gender, age, sum_assured, modal_premium,
              premium_frequency, pt, ppt, annual_premium, total_premium,
              total_benefit, irr, rows_data, created_at
       FROM illustrations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  },

  /**
   * Retrieve all saved illustrations for a user (history)
   */
  async findAllByUserId(userId: string, limit: number = 10): Promise<IIllustration[]> {
    const res = await query<IIllustration>(
      `SELECT id, user_id, gender, age, sum_assured, modal_premium,
              premium_frequency, pt, ppt, annual_premium, total_premium,
              total_benefit, irr, rows_data, created_at
       FROM illustrations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  },
};
