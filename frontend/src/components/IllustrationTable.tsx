import React from 'react';
import { IllustrationRow } from '../services/api';
import { formatINR, formatPercent } from '../utils/formatters';
import { Sparkles, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface IllustrationTableProps {
  rows: IllustrationRow[];
  pt: number;
  ppt: number;
}

export const IllustrationTable: React.FC<IllustrationTableProps> = ({ rows, pt, ppt }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            20-Year Benefit Illustration Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Year-wise projected cashflows, annual simple reversionary bonuses, and maturity payout
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            Outflow (Premium)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Inflow (Benefit)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            Year {pt} Maturity
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-4 text-center w-20">Policy Year</th>
              <th className="py-3.5 px-4 text-right">Premium</th>
              <th className="py-3.5 px-4 text-right">Sum Assured</th>
              <th className="py-3.5 px-4 text-right">Bonus Rate</th>
              <th className="py-3.5 px-4 text-right">Bonus Amount</th>
              <th className="py-3.5 px-4 text-right">Total Benefit</th>
              <th className="py-3.5 px-4 text-right">Net Cashflows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isMaturity = row.policyYear === pt;
              const isPptActive = row.policyYear <= ppt;

              // Cashflow formatting style
              let cashflowClass = 'text-slate-400 font-medium';
              let icon = <Minus className="w-3.5 h-3.5 inline mr-1 text-slate-300" />;

              if (row.netCashflow < 0) {
                cashflowClass = 'text-rose-600 font-semibold';
                icon = <ArrowDownRight className="w-3.5 h-3.5 inline mr-1 text-rose-500" />;
              } else if (row.netCashflow > 0) {
                cashflowClass = 'text-emerald-700 font-bold';
                icon = <ArrowUpRight className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />;
              }

              return (
                <tr
                  key={row.policyYear}
                  className={`transition-colors text-xs sm:text-sm ${
                    isMaturity
                      ? 'bg-amber-50/60 font-semibold border-y-2 border-amber-300/80 hover:bg-amber-50'
                      : isPptActive
                      ? 'hover:bg-slate-50/70'
                      : 'hover:bg-slate-50/50 text-slate-600'
                  }`}
                >
                  {/* Policy Year */}
                  <td className="py-3.5 px-4 text-center font-medium">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                          isMaturity
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.policyYear}
                      </span>
                      {isMaturity && (
                        <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-tight text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-1">
                          Maturity
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Premium */}
                  <td className="py-3.5 px-4 text-right font-medium">
                    {row.premium > 0 ? (
                      <span className="text-slate-900">{formatINR(row.premium)}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Sum Assured */}
                  <td className="py-3.5 px-4 text-right font-medium">
                    {row.sumAssured > 0 ? (
                      <span className="text-slate-900">{formatINR(row.sumAssured)}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Bonus Rate */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatPercent(row.bonusRate, 2)}
                  </td>

                  {/* Bonus Amount */}
                  <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                    {formatINR(row.bonusAmount)}
                  </td>

                  {/* Total Benefit */}
                  <td className="py-3.5 px-4 text-right font-medium">
                    {row.totalBenefit > 0 ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/70">
                        {formatINR(row.totalBenefit)}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Net Cashflows */}
                  <td className={`py-3.5 px-4 text-right ${cashflowClass}`}>
                    {icon}
                    {row.netCashflow !== 0 ? formatINR(row.netCashflow) : '0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>
          * Total Benefit at Year {pt} incorporates Guaranteed Sum Assured + 20-year Accrued Bonuses
          (identical to Excel <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[11px]">SUM(E$1:E$23)</code>).
        </p>
        <p className="font-medium text-slate-600">Calculated strictly per actuarial standards</p>
      </div>
    </div>
  );
};
