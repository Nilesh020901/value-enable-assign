export type PremiumFrequency = 'Yearly' | 'Half-Yearly' | 'Monthly';

// 1. Policy Types Data Structures
export type PolicyCategory = 'Endowment' | 'TermLife' | 'MoneyBack' | 'WholeLife';

export interface PolicyTypeInfo {
  id: PolicyCategory;
  name: string;
  code: string;
  description: string;
  minPt: number;
  maxPt: number;
  minPpt: number;
  maxPpt: number;
  bonusEligible: boolean;
  deathBenefitDescription: string;
  maturityBenefitDescription: string;
}

export const SUPPORTED_POLICY_TYPES: PolicyTypeInfo[] = [
  {
    id: 'Endowment',
    name: 'Guaranteed Endowment Savings Plan',
    code: 'ENDOW_SAVINGS_01',
    description: 'Traditional participating savings plan combining life coverage with annual bonus participation and lump-sum maturity.',
    minPt: 10,
    maxPt: 20,
    minPpt: 5,
    maxPpt: 10,
    bonusEligible: true,
    deathBenefitDescription: 'Sum Assured on Death plus accrued reversionary bonuses.',
    maturityBenefitDescription: 'Sum Assured plus cumulative 20-year bonus additions.',
  },
  {
    id: 'TermLife',
    name: 'Pure Protection Term Insurance',
    code: 'PURE_TERM_01',
    description: 'High-cover pure risk life insurance plan with low premium and comprehensive financial protection.',
    minPt: 10,
    maxPt: 40,
    minPpt: 5,
    maxPpt: 20,
    bonusEligible: false,
    deathBenefitDescription: '100% of Sum Assured paid to nominee upon demise during policy term.',
    maturityBenefitDescription: 'Nil (Pure protection plan without survival maturity benefit).',
  },
  {
    id: 'MoneyBack',
    name: 'Periodic Cashflow Money Back Plan',
    code: 'MONEY_BACK_01',
    description: 'Regular survival payouts during the policy term with remaining sum assured plus bonuses on maturity.',
    minPt: 15,
    maxPt: 25,
    minPpt: 10,
    maxPpt: 15,
    bonusEligible: true,
    deathBenefitDescription: 'Full Sum Assured irrespective of previously paid survival benefits.',
    maturityBenefitDescription: 'Remaining Sum Assured balance plus accrued bonuses.',
  },
  {
    id: 'WholeLife',
    name: 'Whole Life Participating Protection Plan',
    code: 'WHOLE_LIFE_01',
    description: 'Lifetime insurance protection coverage up to age 99 with perpetual guaranteed additions.',
    minPt: 20,
    maxPt: 35,
    minPpt: 10,
    maxPpt: 20,
    bonusEligible: true,
    deathBenefitDescription: 'Sum Assured + cumulative bonuses upon death at any age during lifetime.',
    maturityBenefitDescription: 'Living benefit payable upon attainment of age 100.',
  },
];

// 2. Riders Data Structures
export type RiderCode = 'ADB' | 'CI' | 'WOP' | 'TERM_BOOSTER';

export interface RiderDefinition {
  code: RiderCode;
  name: string;
  category: 'Accident' | 'Health' | 'BenefitWaiver' | 'LifeBooster';
  description: string;
  ratePerThousand: number; // Annual premium in ₹ per ₹1,000 Rider SA
  minSumAssured: number;
  maxSumAssuredLimit: number;
  sumAssuredMultiplier: number;
}

export const AVAILABLE_RIDERS: RiderDefinition[] = [
  {
    code: 'ADB',
    name: 'Accidental Death & Disability Benefit Rider',
    category: 'Accident',
    description: 'Provides an additional 100% Sum Assured payout in case of accidental demise or permanent total disability.',
    ratePerThousand: 1.25,
    minSumAssured: 100000,
    maxSumAssuredLimit: 5000000,
    sumAssuredMultiplier: 1.0,
  },
  {
    code: 'CI',
    name: 'Comprehensive Critical Illness Benefit Rider',
    category: 'Health',
    description: 'Lump-sum monetary benefit upon initial diagnosis of specified critical illnesses.',
    ratePerThousand: 3.50,
    minSumAssured: 100000,
    maxSumAssuredLimit: 2500000,
    sumAssuredMultiplier: 0.5,
  },
  {
    code: 'WOP',
    name: 'Waiver of Premium (WOP) Rider',
    category: 'BenefitWaiver',
    description: 'All future payable premiums are fully waived upon critical illness or total disability.',
    ratePerThousand: 0.75,
    minSumAssured: 100000,
    maxSumAssuredLimit: 5000000,
    sumAssuredMultiplier: 1.0,
  },
  {
    code: 'TERM_BOOSTER',
    name: 'Additional Term Life Booster Rider',
    category: 'LifeBooster',
    description: 'Amplifies basic life cover during active earning years at nominal incremental cost.',
    ratePerThousand: 2.10,
    minSumAssured: 250000,
    maxSumAssuredLimit: 10000000,
    sumAssuredMultiplier: 1.0,
  },
];

// 3. Premium Options Data Structures
export interface PremiumOptionInfo {
  frequency: PremiumFrequency;
  label: string;
  multiplier: number;
  description: string;
  billingCyclesPerYear: number;
}

export const PREMIUM_OPTIONS: PremiumOptionInfo[] = [
  {
    frequency: 'Yearly',
    label: 'Annual (1 payment/year)',
    multiplier: 1,
    description: 'Single annualized premium debit once per policy year.',
    billingCyclesPerYear: 1,
  },
  {
    frequency: 'Half-Yearly',
    label: 'Half-Yearly (2 payments/year)',
    multiplier: 2,
    description: 'Bi-annual installments every 6 months (Modal Factor × 2).',
    billingCyclesPerYear: 2,
  },
  {
    frequency: 'Monthly',
    label: 'Monthly ECS / NACH (12 payments/year)',
    multiplier: 12,
    description: 'Monthly automated direct debit (Modal Factor × 12).',
    billingCyclesPerYear: 12,
  },
];

export interface SelectedRiderInput {
  code: RiderCode;
  sumAssured?: number;
}

export interface CalculatedRiderBenefit {
  code: RiderCode;
  name: string;
  category: string;
  sumAssured: number;
  annualPremium: number;
}

export interface PolicyInputs {
  dob: string | Date;
  gender: 'M' | 'F' | 'Other';
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: PremiumFrequency;
  pt: number; // Policy Term (10 - 20)
  ppt: number; // Premium Payment Term (5 - 10)
  policyType?: PolicyCategory;
  riders?: SelectedRiderInput[];
}

export interface IllustrationRow {
  policyYear: number;
  premium: number;
  sumAssured: number;
  bonusRate: number;
  bonusAmount: number;
  totalBenefit: number;
  netCashflow: number;
}

export interface IllustrationResult {
  policyType: PolicyCategory;
  annualPremium: number;
  totalPremium: number;
  totalBenefit: number;
  irr: number;
  riders: CalculatedRiderBenefit[];
  totalAnnualRiderPremium: number;
  rows: IllustrationRow[];
}

export const MIN_SA_MULTIPLIER = 10;
export const MIN_SA_CAP = 5000000; // 50 Lakhs (50,00,000)

// 20-year bonus rates from sample Excel sheet (Seeds)
export const DEFAULT_BONUS_RATES: number[] = [
  0.025, // Year 1: 2.5%
  0.03,  // Year 2: 3.0%
  0.035, // Year 3: 3.5%
  0.035, // Year 4: 3.5%
  0.035, // Year 5: 3.5%
  0.035, // Year 6: 3.5%
  0.03,  // Year 7: 3.0%
  0.03,  // Year 8: 3.0%
  0.03,  // Year 9: 3.0%
  0.03,  // Year 10: 3.0%
  0.03,  // Year 11: 3.0%
  0.025, // Year 12: 2.5%
  0.03,  // Year 13: 3.0%
  0.03,  // Year 14: 3.0%
  0.025, // Year 15: 2.5%
  0.05,  // Year 16: 5.0%
  0.04,  // Year 17: 4.0%
  0.045, // Year 18: 4.5%
  0.04,  // Year 19: 4.0%
  0.25,  // Year 20: 25.0%
];

/**
 * Returns multiplier to calculate Annual Premium from Modal Premium
 * Yearly = 1, Half-Yearly = 2, Monthly = 12
 */
export function getFrequencyMultiplier(frequency: PremiumFrequency): number {
  switch (frequency) {
    case 'Yearly':
      return 1;
    case 'Half-Yearly':
      return 2;
    case 'Monthly':
      return 12;
    default:
      return 1;
  }
}

/**
 * Calculate Annual Premium from Modal Premium and Frequency
 */
export function calculateAnnualPremium(modalPremium: number, frequency: PremiumFrequency): number {
  return modalPremium * getFrequencyMultiplier(frequency);
}

/**
 * Calculates completed age as of a given date (last birthday logic).
 * Correctly accounts for birth dates, leap days (Feb 29), and same-day birthdays.
 */
export function calculateAge(dobInput: string | Date, asOfDate: Date = new Date()): number {
  const dob = typeof dobInput === 'string' ? new Date(dobInput) : dobInput;
  if (isNaN(dob.getTime())) {
    throw new Error('Invalid Date of Birth');
  }

  const birthYear = dob.getFullYear();
  const birthMonth = dob.getMonth();
  const birthDay = dob.getDate();

  const currentYear = asOfDate.getFullYear();
  const currentMonth = asOfDate.getMonth();
  const currentDay = asOfDate.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age;
}

/**
 * Net Present Value for a series of periodic cash flows starting at index 0.
 * NPV(r) = sum(cf_t / (1 + r)^t) for t = 0..N-1
 */
function npv(rate: number, cashflows: number[]): number {
  let total = 0;
  for (let t = 0; t < cashflows.length; t++) {
    total += cashflows[t] / Math.pow(1 + rate, t);
  }
  return total;
}

/**
 * Derivative of NPV with respect to rate.
 * d(NPV)/dr = sum(-t * cf_t / (1 + r)^(t + 1))
 */
function dNpv(rate: number, cashflows: number[]): number {
  let total = 0;
  for (let t = 0; t < cashflows.length; t++) {
    total += (-t * cashflows[t]) / Math.pow(1 + rate, t + 1);
  }
  return total;
}

/**
 * Calculates Internal Rate of Return (IRR) matching Excel's IRR function.
 * Uses Newton-Raphson algorithm with bisection fallback.
 */
export function calculateIRR(
  cashflows: number[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 1e-7
): number {
  // Check if cashflows contain both positive and negative values
  const hasPositive = cashflows.some((cf) => cf > 0);
  const hasNegative = cashflows.some((cf) => cf < 0);
  if (!hasPositive || !hasNegative) {
    return 0;
  }

  let rate = guess;

  // Attempt Newton-Raphson iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    const val = npv(rate, cashflows);
    const deriv = dNpv(rate, cashflows);

    if (Math.abs(deriv) < 1e-12) {
      break; // Derivative too small, switch to bisection
    }

    const nextRate = rate - val / deriv;

    if (Math.abs(nextRate - rate) < tolerance) {
      return nextRate;
    }

    // Guard against runaway diverging rates
    if (nextRate < -0.999 || nextRate > 10.0 || isNaN(nextRate)) {
      break;
    }

    rate = nextRate;
  }

  // Fallback: Bisection search between -0.99 and 5.0
  let low = -0.99;
  let high = 5.0;
  let fLow = npv(low, cashflows);
  let fHigh = npv(high, cashflows);

  if (fLow * fHigh > 0) {
    // Both endpoints have the same sign; expand search
    high = 10.0;
    fHigh = npv(high, cashflows);
  }

  if (fLow * fHigh <= 0) {
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const fMid = npv(mid, cashflows);

      if (Math.abs(fMid) < tolerance || Math.abs(high - low) < tolerance) {
        return mid;
      }

      if (fLow * fMid < 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
    return (low + high) / 2;
  }

  return rate;
}

export interface CalculationOptions {
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: PremiumFrequency;
  pt: number;
  ppt: number;
  customRates?: number[];
  policyType?: PolicyCategory;
  riders?: SelectedRiderInput[];
}

/**
 * Pure calculation function generating 20-year Benefit Illustration.
 * Faithfully replicates Excel sheet logic:
 * - premium = y <= PPT ? annualPremium : 0
 * - sumAssured = y == PT ? SA : 0
 * - bonusRate = table[y]
 * - bonusAmount = bonusRate * SA
 * - totalBenefit = y == PT ? sumAssured + sum(bonusAmount of all 20 rows) : 0 (same as Excel SUM(E$1:E$23))
 * - netCashflow = y == PT ? totalBenefit : sumAssured - premium
 * - IRR = IRR(netCashflow of rows 1..20)
 */
export function calculateIllustration(options: CalculationOptions): IllustrationResult {
  const { sumAssured, modalPremium, premiumFrequency, pt, ppt, customRates } = options;
  const policyType = options.policyType || 'Endowment';
  const selectedRiders = options.riders || [];
  const rates = customRates && customRates.length === 20 ? customRates : DEFAULT_BONUS_RATES;
  const annualPremium = calculateAnnualPremium(modalPremium, premiumFrequency);

  // Calculate Rider Benefits and Premiums
  const calculatedRiders: CalculatedRiderBenefit[] = [];
  let totalAnnualRiderPremium = 0;

  for (const riderInput of selectedRiders) {
    const riderDef = AVAILABLE_RIDERS.find((r) => r.code === riderInput.code);
    if (riderDef) {
      const riderSA = Math.min(
        riderInput.sumAssured ?? Math.round(sumAssured * riderDef.sumAssuredMultiplier),
        riderDef.maxSumAssuredLimit
      );
      const riderPrem = Math.round((riderSA / 1000) * riderDef.ratePerThousand);
      totalAnnualRiderPremium += riderPrem;
      calculatedRiders.push({
        code: riderDef.code,
        name: riderDef.name,
        category: riderDef.category,
        sumAssured: riderSA,
        annualPremium: riderPrem,
      });
    }
  }

  // Compute bonus amounts for all 20 years first to get cumulative bonus
  // Excel formula: SUM(E$1:E$23) sums all 20 rows of bonusAmount!
  let totalBonusAll20Rows = 0;
  for (let y = 1; y <= 20; y++) {
    const rate = rates[y - 1] ?? 0;
    totalBonusAll20Rows += rate * sumAssured;
  }

  const rows: IllustrationRow[] = [];
  let totalPremium = 0;
  let maturityBenefit = 0;

  for (let y = 1; y <= 20; y++) {
    const premium = y <= ppt ? annualPremium : 0;
    totalPremium += premium;

    const rowSumAssured = y === pt ? sumAssured : 0;
    const bonusRate = rates[y - 1] ?? 0;
    const bonusAmount = bonusRate * sumAssured;

    // Excel formula: =IF(Inputs!$C$8=A_y, C_y+SUM(E$1:E$23), 0)
    const totalBenefit = y === pt ? rowSumAssured + totalBonusAll20Rows : 0;
    if (y === pt) {
      maturityBenefit = totalBenefit;
    }

    // Excel formula: =IF(Inputs!$C$8=A_y, F_y, C_y-B_y)
    const netCashflow = y === pt ? totalBenefit : rowSumAssured - premium;

    rows.push({
      policyYear: y,
      premium,
      sumAssured: rowSumAssured,
      bonusRate,
      bonusAmount,
      totalBenefit,
      netCashflow,
    });
  }

  const cashflows = rows.map((r) => r.netCashflow);
  const irr = calculateIRR(cashflows);

  return {
    policyType,
    annualPremium,
    totalPremium,
    totalBenefit: maturityBenefit,
    irr,
    riders: calculatedRiders,
    totalAnnualRiderPremium,
    rows,
  };
}
