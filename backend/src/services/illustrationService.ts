import {
  calculateAge,
  calculateIllustration,
  DEFAULT_BONUS_RATES,
  IllustrationResult,
  PolicyCategory,
  PremiumFrequency,
  CalculatedRiderBenefit,
  SelectedRiderInput,
} from './calculation.js';
import { validatePolicyInputs, ValidationErrorItem } from './validation.js';
import { IllustrationModel } from '../models/Illustration.js';
import { BonusRateModel } from '../models/BonusRate.js';

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
    const rates = await BonusRateModel.getAll();
    if (rates.length === 20) {
      return rates;
    }
  } catch (err) {
    console.warn('Could not read bonus rates from database, falling back to default seeds:', err);
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

  // 2. Compute Age from DOB
  const age = calculateAge(dto.dob);

  // 3. Fetch rates from BonusRateModel
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

  // 5. Save in database via IllustrationModel
  const savedRecord = await IllustrationModel.create({
    userId,
    gender: dto.gender,
    age,
    sumAssured: dto.sumAssured,
    modalPremium: dto.modalPremium,
    premiumFrequency: dto.premiumFrequency,
    pt: dto.pt,
    ppt: dto.ppt,
    annualPremium: illustration.annualPremium,
    totalPremium: illustration.totalPremium,
    totalBenefit: illustration.totalBenefit,
    irr: illustration.irr,
    rowsData: payloadToStore,
  });

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
      createdAt: savedRecord.created_at instanceof Date ? savedRecord.created_at.toISOString() : String(savedRecord.created_at),
    },
  };
}

export async function getLatestIllustrationForUser(
  userId: string
): Promise<IllustrationResponseData | null> {
  const row = await IllustrationModel.findLatestByUserId(userId);

  if (!row) return null;

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
    age: parseInt(String(row.age), 10),
    policyType,
    sumAssured: parseFloat(String(row.sum_assured)),
    modalPremium: parseFloat(String(row.modal_premium)),
    premiumFrequency: row.premium_frequency as PremiumFrequency,
    pt: parseInt(String(row.pt), 10),
    ppt: parseInt(String(row.ppt), 10),
    annualPremium: parseFloat(String(row.annual_premium)),
    totalPremium: parseFloat(String(row.total_premium)),
    totalBenefit: parseFloat(String(row.total_benefit)),
    irr: parseFloat(String(row.irr)),
    riders,
    totalAnnualRiderPremium,
    rows: parsedRows,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}
