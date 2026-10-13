import React from 'react';
import { IndianRupee, TrendingUp, Award, Clock } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';

interface SummaryCardsProps {
  totalPremium: number;
  totalBenefit: number;
  irr: number;
  pt: number;
  ppt: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalPremium,
  totalBenefit,
  irr,
  pt,
  ppt,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* 1. Total Premium Paid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Premium Paid
          </span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatINR(totalPremium)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Across {ppt} years payment term</span>
        </div>
      </div>

      {/* 2. Total Maturity Benefit */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Maturity Benefit
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-700 tracking-tight">
          {formatINR(totalBenefit)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span>Payable at Policy Term (Year {pt})</span>
        </div>
      </div>

      {/* 3. IRR (Internal Rate of Return) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Projected IRR
          </span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-indigo-600 tracking-tight">
          {formatPercent(irr, 3)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span>Annualized Net Internal Return</span>
        </div>
      </div>

      {/* 4. Net Value Addition */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Net Surplus Benefit
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatINR(totalBenefit - totalPremium)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span>Benefit minus total premiums paid</span>
        </div>
      </div>
    </div>
  );
};
