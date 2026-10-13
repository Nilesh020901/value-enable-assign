import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Shield,
  Layers,
  HeartPulse,
} from 'lucide-react';
import {
  api,
  IllustrationData,
  ValidationErrorItem,
  PolicyTypeInfo,
  RiderDefinition,
  User,
} from '../services/api';
import { calculateAgeLive, formatINR } from '../utils/formatters';

interface PolicyCalculationProps {
  user?: User | null;
  onIllustrationGenerated: (illustration: IllustrationData) => void;
}

export const PolicyCalculation: React.FC<PolicyCalculationProps> = ({
  user,
  onIllustrationGenerated,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    dob: user?.rawDob || '1995-05-15',
    gender: 'M' as 'M' | 'F' | 'Other',
    sumAssured: '1200000',
    modalPremium: '40000',
    premiumFrequency: 'Yearly' as 'Yearly' | 'Half-Yearly' | 'Monthly',
    pt: '18',
    ppt: '10',
  });

  const [policyType, setPolicyType] = useState<string>('Endowment');
  const [selectedRiders, setSelectedRiders] = useState<Record<string, boolean>>({
    ADB: false,
    CI: false,
    WOP: false,
  });

  const [policyTypesList, setPolicyTypesList] = useState<PolicyTypeInfo[]>([]);
  const [availableRidersList, setAvailableRidersList] = useState<RiderDefinition[]>([]);
  const [liveAge, setLiveAge] = useState<number | null>(() =>
    calculateAgeLive(user?.rawDob || '1995-05-15')
  );
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Auto-fill logged-in user's actual registered DOB
  useEffect(() => {
    if (user?.rawDob) {
      setFormData((prev) => ({ ...prev, dob: user.rawDob! }));
    } else {
      api.getMe()
        .then((res) => {
          if (res.user?.rawDob) {
            setFormData((prev) => ({ ...prev, dob: res.user.rawDob! }));
          }
        })
        .catch(() => {});
    }
  }, [user?.rawDob]);

  // Fetch config from backend
  useEffect(() => {
    api.getPolicyConfig()
      .then((cfg) => {
        if (cfg.policyTypes) setPolicyTypesList(cfg.policyTypes);
        if (cfg.riders) setAvailableRidersList(cfg.riders);
      })
      .catch((err) => console.warn('Could not load policy catalog:', err));
  }, []);

  // Calculate live age whenever DOB changes
  useEffect(() => {
    const age = calculateAgeLive(formData.dob);
    setLiveAge(age);
  }, [formData.dob]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for field upon edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleToggleRider = (code: string) => {
    setSelectedRiders((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // Helper calculations for hints
  const modalPremNum = parseFloat(formData.modalPremium) || 0;
  const multiplier =
    formData.premiumFrequency === 'Monthly' ? 12 : formData.premiumFrequency === 'Half-Yearly' ? 2 : 1;
  const annualPremCalc = modalPremNum * multiplier;
  const minRequiredSA = Math.min(10 * annualPremCalc, 5000000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setLoading(true);

    try {
      const activeRiders = Object.entries(selectedRiders)
        .filter(([_, active]) => active)
        .map(([code]) => ({ code }));

      const payload = {
        dob: formData.dob,
        gender: formData.gender,
        sumAssured: Number(formData.sumAssured),
        modalPremium: Number(formData.modalPremium),
        premiumFrequency: formData.premiumFrequency,
        pt: Number(formData.pt),
        ppt: Number(formData.ppt),
        policyType,
        riders: activeRiders,
      };

      const res = await api.calculateIllustration(payload);
      onIllustrationGenerated(res.illustration);
      navigate('/illustration');
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        const mappedErrors: Record<string, string> = {};
        err.errors.forEach((item: ValidationErrorItem) => {
          mappedErrors[item.field] = item.message;
        });
        setFieldErrors(mappedErrors);
        setGeneralError('Please resolve the validation errors highlighted below.');
      } else {
        setGeneralError(err.message || 'Calculation failed. Please verify inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            Policy Parameters & Validation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Input customer policy details to compute 20-year cashflows, bonus additions, and IRR
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3.5 py-2 text-xs text-indigo-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>Compliant with standard actuarial rules (PPT: 5–10, PT: 10–20, Age: 23–56)</span>
        </div>
      </div>

      {generalError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">{generalError}</p>
            {Object.keys(fieldErrors).length > 0 && (
              <p className="text-xs text-rose-700 mt-1">
                Total {Object.keys(fieldErrors).length} validation constraint(s) failed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 0. Policy Product Type Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Policy Product Type
              </label>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Participating Life Insurance
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(policyTypesList.length > 0
                ? policyTypesList
                : [
                    {
                      id: 'Endowment',
                      name: 'Endowment Savings Plan',
                      description: 'Life cover + annual participating bonus additions with maturity benefit.',
                    },
                    {
                      id: 'TermLife',
                      name: 'Term Insurance',
                      description: 'High protection life cover without survival maturity benefit.',
                    },
                    {
                      id: 'MoneyBack',
                      name: 'Money Back Plan',
                      description: 'Periodic survival cashflow payouts with accrued bonuses.',
                    },
                    {
                      id: 'WholeLife',
                      name: 'Whole Life Plan',
                      description: 'Perpetual lifetime insurance protection coverage up to age 100.',
                    },
                  ]
              ).map((pt) => (
                <div
                  key={pt.id}
                  onClick={() => setPolicyType(pt.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    policyType === pt.id
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs text-slate-900">{pt.name}</p>
                    {policyType === pt.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {pt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Date of Birth (with Live Age display) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Date of Birth (DOB)
                </label>
                {liveAge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                      liveAge >= 23 && liveAge <= 56
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                    }`}
                  >
                    {liveAge >= 23 && liveAge <= 56 ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                    )}
                    Live Age: <strong>{liveAge} yrs</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  name="dob"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.dob
                      ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                  }`}
                />
              </div>

              {fieldErrors.dob ? (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.dob}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Age on last completed birthday must be between 23 and 56 years.
                </p>
              )}
            </div>

            {/* 2. Gender */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="Other">Other</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Standard actuarial mortality demographic.
              </p>
            </div>

            {/* 3. Modal Premium */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Modal Premium (₹)
                </label>
                <span className="text-xs text-slate-400 font-mono">Range: ₹10,000 – ₹50,000</span>
              </div>
              <input
                type="number"
                name="modalPremium"
                required
                min={10000}
                max={50000}
                step={500}
                value={formData.modalPremium}
                onChange={handleChange}
                placeholder="40000"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.modalPremium
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />

              {fieldErrors.modalPremium ? (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.modalPremium}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Modal installment paid according to selected frequency.
                </p>
              )}
            </div>

            {/* 4. Premium Frequency */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Premium Frequency
              </label>
              <select
                name="premiumFrequency"
                value={formData.premiumFrequency}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.premiumFrequency
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              >
                <option value="Yearly">Yearly (1x)</option>
                <option value="Half-Yearly">Half-Yearly (2x)</option>
                <option value="Monthly">Monthly (12x)</option>
              </select>

              {fieldErrors.premiumFrequency ? (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.premiumFrequency}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Annualized premium = {formatINR(annualPremCalc)} / year
                </p>
              )}
            </div>

            {/* 5. Sum Assured (SA) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Sum Assured (SA) (₹)
                </label>
                <span className="text-xs text-indigo-600 font-medium">
                  Min required: {formatINR(minRequiredSA)}
                </span>
              </div>
              <input
                type="number"
                name="sumAssured"
                required
                min={minRequiredSA}
                step={10000}
                value={formData.sumAssured}
                onChange={handleChange}
                placeholder="1200000"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.sumAssured
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />

              {fieldErrors.sumAssured ? (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.sumAssured}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  Rule: SA ≥ min(10 × Annual Premium [₹{formatINR(10 * annualPremCalc)}], ₹50,00,000)
                </p>
              )}
            </div>

            {/* 6. PPT (Premium Payment Term) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Premium Payment Term (PPT)
                </label>
                <span className="text-xs text-slate-400 font-mono">5 – 10 Years</span>
              </div>
              <input
                type="number"
                name="ppt"
                required
                min={5}
                max={10}
                value={formData.ppt}
                onChange={handleChange}
                placeholder="10"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.ppt
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />

              {fieldErrors.ppt ? (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.ppt}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Number of years premiums are to be deposited.
                </p>
              )}
            </div>

            {/* 7. PT (Policy Term) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Policy Term (PT)
                </label>
                <span className="text-xs text-slate-400 font-mono">10 – 20 Years (PT &gt; PPT)</span>
              </div>
              <input
                type="number"
                name="pt"
                required
                min={10}
                max={20}
                value={formData.pt}
                onChange={handleChange}
                placeholder="18"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.pt
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
              />

              {fieldErrors.pt ? (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.pt}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Duration until policy maturity and benefit disbursement.
                </p>
              )}
            </div>
          </div>

          {/* Optional Add-On Riders */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Optional Add-On Riders
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Base SA: ₹{formatINR(parseFloat(formData.sumAssured) || 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(availableRidersList.length > 0
                ? availableRidersList
                : [
                    {
                      code: 'ADB',
                      name: 'Accidental Death & Disability Rider',
                      description: 'Additional 100% SA on accidental demise or permanent disability',
                      ratePerThousand: 1.25,
                      sumAssuredMultiplier: 1.0,
                    },
                    {
                      code: 'CI',
                      name: 'Comprehensive Critical Illness Rider',
                      description: 'Lump-sum payout upon diagnosis of 36 critical illnesses',
                      ratePerThousand: 3.5,
                      sumAssuredMultiplier: 0.5,
                    },
                    {
                      code: 'WOP',
                      name: 'Waiver of Premium (WOP) Rider',
                      description: 'All future premiums waived upon disability or critical illness',
                      ratePerThousand: 0.75,
                      sumAssuredMultiplier: 1.0,
                    },
                    {
                      code: 'TERM_BOOSTER',
                      name: 'Additional Term Life Booster',
                      description: 'Amplifies basic life cover during earning years',
                      ratePerThousand: 2.1,
                      sumAssuredMultiplier: 1.0,
                    },
                  ]
              ).map((rider) => {
                const isChecked = !!selectedRiders[rider.code];
                const baseSA = parseFloat(formData.sumAssured) || 0;
                const riderSA = Math.round(baseSA * (rider.sumAssuredMultiplier || 1.0));
                const estPrem = Math.round((riderSA / 1000) * rider.ratePerThousand);

                return (
                  <div
                    key={rider.code}
                    onClick={() => handleToggleRider(rider.code)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{rider.name}</p>
                        <span className="text-[11px] font-mono text-indigo-700 font-medium whitespace-nowrap">
                          +₹{formatINR(estPrem)}/yr
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{rider.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Cover: ₹{formatINR(riderSA)} (@ ₹{rider.ratePerThousand}/₹1,000 SA)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Calculator className="w-4 h-4" />
              {loading ? 'Validating & Computing...' : 'Calculate Benefit Illustration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
