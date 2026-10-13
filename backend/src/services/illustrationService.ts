import { query } from '../db/index.js';
import {
  calculateAge,
  calculateIllustration,
  DEFAULT_BONUS_RATES,
  IllustrationResult,
  PolicyCategory,
  PolicyInputs,
  PremiumFrequency,
  CalculatedRiderBenefit,
  SelectedRiderInput,
} from './calculation.js';
import { validatePolicyInputs, ValidationErrorItem } from './validation.js';

export interface IllustrationSaveDTO {
  dob: string;
  gender: 'M' | 'F' | 'Other';
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: PremiumFrequency;
  pt: number;
  ppt: number;
  policyType?: PolicyCategory;
  riders?: SelectedRiderInput[];
}

export interface IllustrationResponseData {
  id?: string;
  userId: string;
  gender: string;
  age: number;
  policyType: PolicyCategory;
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: PremiumFrequency;
  pt: number;
  ppt: number;
  annualPremium: number;
  totalPremium: number;
  totalBenefit: number;
  irr: number;
  riders: CalculatedRiderBenefit[];
  totalAnnualRiderPremium: number;
  rows: IllustrationResult['rows'];
  createdAt?: string;
}

export async function fetchBonusRates(): Promise<number[]> {
  try {
    const res = await query('SELECT policy_year, rate FROM bonus_rates ORDER BY policy_year ASC');
    if (res.rowCount === 20) {
      return res.rows.map((r) => parseFloat(r.rate));
    }
  } catch (err) {
    console.warn('Error fetching bonus rates from DB, falling back to defaults:', err);
  }
  return DEFAULT_BONUS_RATES;
}

export async function calculateAndSaveIllustration(
  userId: string,
  dto: IllustrationSaveDTO
): Promise<{ success: true; data: IllustrationResponseData } | { success: false; errors: ValidationErrorItem[] }> {
  // 1. Validate all 5 rules simultaneously
  const validation = validatePolicyInputs({
    dob: dto.dob,
    gender: dto.gender,
    sumAssured: dto.sumAssured,
    modalPremium: dto.modalPremium,
    premiumFrequency: dto.premiumFrequency,
    pt: dto.pt,
    ppt: dto.ppt,
  });

  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  // 2. Compute Age from DOB (Note: DOB itself is NOT stored in illustrations)
  const age = calculateAge(dto.dob);

  // 3. Fetch rates
  const rates = await fetchBonusRates();

  // 4. Calculate 20-year Illustration with Policy Type and Riders
  const illustration = calculateIllustration({
    sumAssured: dto.sumAssured,
    modalPremium: dto.modalPremium,
    premiumFrequency: dto.premiumFrequency,
    pt: dto.pt,
    ppt: dto.ppt,
    customRates: rates,
    policyType: dto.policyType,
    riders: dto.riders,
  });

  const payloadToStore = {
    policyType: illustration.policyType,
    riders: illustration.riders,
    totalAnnualRiderPremium: illustration.totalAnnualRiderPremium,
    rows: illustration.rows,
  };

  // 5. Save in database
  const insertRes = await query(
    `INSERT INTO illustrations (
      user_id, gender, age, sum_assured, modal_premium,
      premium_frequency, pt, ppt, annual_premium,
      total_premium, total_benefit, irr, rows_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, created_at`,
    [
      userId,
      dto.gender,
      age,
      dto.sumAssured,
      dto.modalPremium,
      dto.premiumFrequency,
      dto.pt,
      dto.ppt,
      illustration.annualPremium,
      illustration.totalPremium,
      illustration.totalBenefit,
      illustration.irr,
      JSON.stringify(payloadToStore),
    ]
  );

  const savedRecord = insertRes.rows[0];

  return {
    success: true,
    data: {
      id: savedRecord.id,
      userId,
      gender: dto.gender,
      age,
      policyType: illustration.policyType,
      sumAssured: dto.sumAssured,
      modalPremium: dto.modalPremium,
      premiumFrequency: dto.premiumFrequency,
      pt: dto.pt,
      ppt: dto.ppt,
      annualPremium: illustration.annualPremium,
      totalPremium: illustration.totalPremium,
      totalBenefit: illustration.totalBenefit,
      irr: illustration.irr,
      riders: illustration.riders,
      totalAnnualRiderPremium: illustration.totalAnnualRiderPremium,
      rows: illustration.rows,
      createdAt: savedRecord.created_at,
    },
  };
}

export async function getLatestIllustrationForUser(
  userId: string
): Promise<IllustrationResponseData | null> {
  const res = await query(
    `SELECT id, user_id, gender, age, sum_assured, modal_premium,
            premium_frequency, pt, ppt, annual_premium, total_premium,
            total_benefit, irr, rows_data, created_at
     FROM illustrations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (res.rowCount === 0) return null;

  const row = res.rows[0];
  let parsedRows = [];
  let riders: CalculatedRiderBenefit[] = [];
  let policyType: PolicyCategory = 'Endowment';
  let totalAnnualRiderPremium = 0;

  const rawData = typeof row.rows_data === 'string' ? JSON.parse(row.rows_data) : row.rows_data;
  if (Array.isArray(rawData)) {
    parsedRows = rawData;
  } else if (rawData && typeof rawData === 'object') {
    parsedRows = rawData.rows || [];
    riders = rawData.riders || [];
    policyType = rawData.policyType || 'Endowment';
    totalAnnualRiderPremium = rawData.totalAnnualRiderPremium || 0;
  }

  return {
    id: row.id,
    userId: row.user_id,
    gender: row.gender,
    age: parseInt(row.age, 10),
    policyType,
    sumAssured: parseFloat(row.sum_assured),
    modalPremium: parseFloat(row.modal_premium),
    premiumFrequency: row.premium_frequency as PremiumFrequency,
    pt: parseInt(row.pt, 10),
    ppt: parseInt(row.ppt, 10),
    annualPremium: parseFloat(row.annual_premium),
    totalPremium: parseFloat(row.total_premium),
    totalBenefit: parseFloat(row.total_benefit),
    irr: parseFloat(row.irr),
    riders,
    totalAnnualRiderPremium,
    rows: parsedRows,
    createdAt: row.created_at,
  };
}
