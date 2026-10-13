const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
  name: string;
  mobile: string;
  dob: string;
  rawDob?: string;
  createdAt?: string;
}

export interface PolicyTypeInfo {
  id: string;
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

export interface RiderDefinition {
  code: string;
  name: string;
  category: string;
  description: string;
  ratePerThousand: number;
  minSumAssured: number;
  maxSumAssuredLimit: number;
  sumAssuredMultiplier: number;
}

export interface PremiumOptionInfo {
  frequency: 'Yearly' | 'Half-Yearly' | 'Monthly';
  label: string;
  multiplier: number;
  description: string;
  billingCyclesPerYear: number;
}

export interface PolicyConfig {
  pptRange: { min: number; max: number };
  ptRange: { min: number; max: number };
  modalPremiumRange: { min: number; max: number };
  ageRange: { min: number; max: number };
  frequencies: ('Yearly' | 'Half-Yearly' | 'Monthly')[];
  minSaMultiplier: number;
  minSaCap: number;
  bonusRates: number[];
  policyTypes?: PolicyTypeInfo[];
  riders?: RiderDefinition[];
  premiumOptions?: PremiumOptionInfo[];
}

export interface CalculatedRider {
  code: string;
  name: string;
  category: string;
  sumAssured: number;
  annualPremium: number;
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

export interface IllustrationData {
  id?: string;
  userId: string;
  gender: string;
  age: number;
  policyType?: string;
  sumAssured: number;
  modalPremium: number;
  premiumFrequency: 'Yearly' | 'Half-Yearly' | 'Monthly';
  pt: number;
  ppt: number;
  annualPremium: number;
  totalPremium: number;
  totalBenefit: number;
  irr: number;
  riders?: CalculatedRider[];
  totalAnnualRiderPremium?: number;
  rows: IllustrationRow[];
  createdAt?: string;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ApiResponse {
  message?: string;
  user?: User;
  illustration?: IllustrationData;
  errors?: ValidationErrorItem[];
  [key: string]: any;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) {
    const error: any = new Error(data.message || 'Request failed');
    error.errors = data.errors;
    error.status = res.status;
    throw error;
  }
  return data as T;
}

export const api = {
  async register(payload: {
    name: string;
    email: string;
    mobile: string;
    dob: string;
    password: string;
  }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(payload: { email: string; password: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getPolicyConfig(): Promise<PolicyConfig> {
    const res = await fetch(`${API_BASE}/policy/config`);
    return handleResponse(res);
  },

  async calculateIllustration(payload: {
    dob: string;
    gender: 'M' | 'F' | 'Other';
    sumAssured: number;
    modalPremium: number;
    premiumFrequency: 'Yearly' | 'Half-Yearly' | 'Monthly';
    pt: number;
    ppt: number;
    policyType?: string;
    riders?: { code: string; sumAssured?: number }[];
  }): Promise<{ illustration: IllustrationData }> {
    const res = await fetch(`${API_BASE}/illustrations/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getLatestIllustration(): Promise<{ illustration: IllustrationData }> {
    const res = await fetch(`${API_BASE}/illustrations/latest`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },
};
