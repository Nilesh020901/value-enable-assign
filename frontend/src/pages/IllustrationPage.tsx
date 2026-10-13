import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calculator,
  RefreshCw,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  Shield,
} from 'lucide-react';
import { api, IllustrationData } from '../services/api';
import { SummaryCards } from '../components/SummaryCards';
import { IllustrationTable } from '../components/IllustrationTable';
import { formatINR } from '../utils/formatters';

interface IllustrationPageProps {
  illustration: IllustrationData | null;
  onSetIllustration: (ill: IllustrationData) => void;
}

export const IllustrationPage: React.FC<IllustrationPageProps> = ({
  illustration,
  onSetIllustration,
}) => {
  const [loading, setLoading] = useState(!illustration);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!illustration) {
      loadLatestIllustration();
    }
  }, [illustration]);

  const loadLatestIllustration = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLatestIllustration();
      onSetIllustration(res.illustration);
    } catch (err: any) {
      setError(
        err.status === 404
          ? 'No illustrations computed yet. Please calculate a policy first.'
          : err.message || 'Failed to load illustration data'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium">Fetching illustration records...</p>
      </div>
    );
  }

  if (error || !illustration) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm my-8">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Illustration</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Please enter policy parameters to generate your benefit illustration.'}</p>
        <Link
          to="/policy"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-100 transition-colors"
        >
          <Calculator className="w-4 h-4" />
          Go to Policy Calculation
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Insurance Benefit Illustration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Actuarial cashflow schedule calculated for Sum Assured {formatINR(illustration.sumAssured)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/policy"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
            Adjust Policy Inputs
          </Link>
        </div>
      </div>

      {/* Policy Details Pill Summary */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>
            Product: <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{illustration.policyType || 'Endowment'} Plan</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>
            Gender: <strong>{illustration.gender === 'M' ? 'Male' : illustration.gender === 'F' ? 'Female' : 'Other'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>
            Age at Entry: <strong>{illustration.age} Years</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>
            Frequency: <strong>{illustration.premiumFrequency}</strong> ({formatINR(illustration.modalPremium)} modal)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>
            Policy Term (PT): <strong>{illustration.pt} Yrs</strong> | PPT: <strong>{illustration.ppt} Yrs</strong>
          </span>
        </div>

        <div className="ml-auto font-medium text-slate-500 text-[11px]">
          Annualized Premium: <strong className="text-slate-800">{formatINR(illustration.annualPremium)}</strong>
        </div>
      </div>

      {/* Attached Riders Banner (if any) */}
      {illustration.riders && illustration.riders.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Attached Add-On Riders ({illustration.riders.length})
            </h4>
            <span className="text-xs font-semibold text-indigo-700">
              Total Rider Premium: +{formatINR(illustration.totalAnnualRiderPremium || 0)}/yr
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {illustration.riders.map((r) => (
              <div key={r.code} className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/70 text-xs flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">{r.name}</p>
                  <p className="text-[11px] text-slate-500">Rider Cover: {formatINR(r.sumAssured)}</p>
                </div>
                <span className="font-mono text-indigo-700 font-medium">+{formatINR(r.annualPremium)}/yr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <SummaryCards
        totalPremium={illustration.totalPremium}
        totalBenefit={illustration.totalBenefit}
        irr={illustration.irr}
        pt={illustration.pt}
        ppt={illustration.ppt}
      />

      {/* Full 20-Year Table */}
      <IllustrationTable
        rows={illustration.rows}
        pt={illustration.pt}
        ppt={illustration.ppt}
      />
    </div>
  );
};
