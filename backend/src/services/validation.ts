import {
  calculateAge,
  calculateAnnualPremium,
  MIN_SA_MULTIPLIER,
  MIN_SA_CAP,
  PremiumFrequency,
} from './calculation.js';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface PolicyValidationInput {
  dob: string | Date;
  gender: string;
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: string;
  pt: number;
  ppt: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorItem[];
}

export const VALID_FREQUENCIES: PremiumFrequency[] = ['Yearly', 'Half-Yearly', 'Monthly'];
export const MIN_PPT = 5;
export const MAX_PPT = 10;
export const MIN_PT = 10;
export const MAX_PT = 20;
export const MIN_MODAL_PREMIUM = 10000;
export const MAX_MODAL_PREMIUM = 50000;
export const MIN_AGE = 23;
export const MAX_AGE = 56;

/**
 * Validates all 5 insurance policy rules simultaneously and returns all errors together.
 */
export function validatePolicyInputs(
  input: PolicyValidationInput,
  asOfDate: Date = new Date()
): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  // Validation 1: Range checks for PPT (5-10), PT (10-20), Modal Premium (10,000-50,000)
  if (typeof input.ppt !== 'number' || isNaN(input.ppt) || input.ppt < MIN_PPT || input.ppt > MAX_PPT) {
    errors.push({
      field: 'ppt',
      message: `Premium Payment Term (PPT) must be between ${MIN_PPT} and ${MAX_PPT} years.`,
    });
  }

  if (typeof input.pt !== 'number' || isNaN(input.pt) || input.pt < MIN_PT || input.pt > MAX_PT) {
    errors.push({
      field: 'pt',
      message: `Policy Term (PT) must be between ${MIN_PT} and ${MAX_PT} years.`,
    });
  }

  if (
    typeof input.modalPremium !== 'number' ||
    isNaN(input.modalPremium) ||
    input.modalPremium < MIN_MODAL_PREMIUM ||
    input.modalPremium > MAX_MODAL_PREMIUM
  ) {
    errors.push({
      field: 'modalPremium',
      message: `Modal Premium must be between ${MIN_MODAL_PREMIUM.toLocaleString('en-IN')} and ${MAX_MODAL_PREMIUM.toLocaleString('en-IN')}.`,
    });
  }

  // Validation 2: PT > PPT
  if (
    typeof input.pt === 'number' &&
    typeof input.ppt === 'number' &&
    !isNaN(input.pt) &&
    !isNaN(input.ppt) &&
    input.pt <= input.ppt
  ) {
    errors.push({
      field: 'pt',
      message: 'Policy Term (PT) must be strictly greater than Premium Payment Term (PPT).',
    });
  }

  // Validation 3: Frequency in Yearly / Half-Yearly / Monthly
  const isValidFreq = VALID_FREQUENCIES.includes(input.premiumFrequency as PremiumFrequency);
  if (!isValidFreq) {
    errors.push({
      field: 'premiumFrequency',
      message: `Premium Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}.`,
    });
  }

  // Validation 4: Sum Assured >= min(10 * annual premium, 50,00,000)
  const multiplier = isValidFreq
    ? calculateAnnualPremium(1, input.premiumFrequency as PremiumFrequency)
    : 1;
  const effectiveModal =
    typeof input.modalPremium === 'number' && !isNaN(input.modalPremium) && input.modalPremium > 0
      ? input.modalPremium
      : MIN_MODAL_PREMIUM;
  const annualPremium = effectiveModal * multiplier;
  const minRequiredSA = Math.min(MIN_SA_MULTIPLIER * annualPremium, MIN_SA_CAP);

  if (
    typeof input.sumAssured !== 'number' ||
    isNaN(input.sumAssured) ||
    input.sumAssured < minRequiredSA
  ) {
    errors.push({
      field: 'sumAssured',
      message: `Sum Assured must be at least ₹${minRequiredSA.toLocaleString('en-IN')} (min of 10 × Annual Premium [₹${(MIN_SA_MULTIPLIER * annualPremium).toLocaleString('en-IN')}] and ₹${MIN_SA_CAP.toLocaleString('en-IN')}).`,
    });
  }

  // Validation 5: Age (last birthday) between 23 and 56
  try {
    const age = calculateAge(input.dob, asOfDate);
    if (age < MIN_AGE || age > MAX_AGE) {
      errors.push({
        field: 'dob',
        message: `Age based on last completed birthday must be between ${MIN_AGE} and ${MAX_AGE} (current calculated age: ${age}).`,
      });
    }
  } catch {
    errors.push({
      field: 'dob',
      message: 'Invalid Date of Birth format. Please provide a valid date.',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
