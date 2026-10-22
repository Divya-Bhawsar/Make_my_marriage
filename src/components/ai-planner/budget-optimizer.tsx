'use client';

import React, { useState, useEffect } from 'react';
import {
  BudgetPriorityFocus,
  BUDGET_PRIORITY_FOCUS,
} from '@/modules/ai-planner/ai-planner.schema';
import { BudgetOptimizerResult } from '@/modules/ai-planner/ai-planner.service';

export function BudgetOptimizer() {
  const [totalBudget, setTotalBudget] = useState(2500000);
  const [priorityFocus, setPriorityFocus] = useState<BudgetPriorityFocus>(
    BUDGET_PRIORITY_FOCUS.BALANCED
  );
  const [result, setResult] = useState<BudgetOptimizerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAnalysis() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai-planner/budget-optimizer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalBudgetRupees: totalBudget,
            priorityFocus,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data.data);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalysis();
  }, [totalBudget, priorityFocus]);

  const presets = [
    { label: '₹15 Lakhs', val: 1500000 },
    { label: '₹25 Lakhs', val: 2500000 },
    { label: '₹40 Lakhs', val: 4000000 },
    { label: '₹75 Lakhs', val: 7500000 },
    { label: '₹1 Crore', val: 10000000 },
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h2 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-2">
            <span>💰</span>
            <span>AI Budget Optimizer &amp; Negotiation Guide</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Compare your live Rupee Ledger spending against Indian wedding industry benchmark percentages to prevent cost overruns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Total Budget Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="total-wedding-budget" className="text-xs font-semibold text-zinc-700">
                Total Target Wedding Budget
              </label>
              <span className="font-serif font-extrabold text-brand-crimson text-sm">
                ₹{totalBudget.toLocaleString('en-IN')}
              </span>
            </div>

            <input
              id="total-wedding-budget"
              type="number"
              min={100000}
              step={50000}
              value={totalBudget}
              onChange={(e) => setTotalBudget(Math.max(100000, parseInt(e.target.value, 10) || 100000))}
              className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
            />

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase mr-1">Presets:</span>
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setTotalBudget(p.val)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    totalBudget === p.val
                      ? 'bg-brand-crimson text-white border-brand-crimson'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Focus */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 block">
              Couple’s Expenditure Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: BUDGET_PRIORITY_FOCUS.BALANCED, label: '⚖️ Balanced', desc: 'Standard 48% Food/Venue' },
                { type: BUDGET_PRIORITY_FOCUS.FOOD_FOCUSED, label: '🍲 Food First', desc: '55% Lavish catering' },
                { type: BUDGET_PRIORITY_FOCUS.DECOR_PHOTO, label: '📸 Decor & Reels', desc: 'Aesthetic visuals' },
                { type: BUDGET_PRIORITY_FOCUS.INTIMATE_LUXURY, label: '💎 Intimate Luxury', desc: 'Curated boutique stay' },
              ].map((strat) => (
                <button
                  key={strat.type}
                  type="button"
                  onClick={() => setPriorityFocus(strat.type)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    priorityFocus === strat.type
                      ? 'border-brand-crimson bg-rose-50/50 ring-1 ring-brand-crimson/20'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <span className="font-serif font-bold text-xs text-zinc-900 block truncate">
                    {strat.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate mt-0.5">{strat.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Health Gauge Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs">
              <span className="text-xs text-zinc-500 font-semibold block">Total Allocated</span>
              <p className="font-serif font-extrabold text-2xl text-zinc-900 mt-1">
                ₹{result.totalBudgetRupees.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-zinc-400 mt-1 block">Master budget cap</span>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs">
              <span className="text-xs text-zinc-500 font-semibold block">Actual Spent (Ledger)</span>
              <p className="font-serif font-extrabold text-2xl text-brand-crimson mt-1">
                ₹{result.totalSpentRupees.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                {result.totalBudgetRupees > 0
                  ? `${Math.round((result.totalSpentRupees / result.totalBudgetRupees) * 100)}% of budget utilized`
                  : '0%'}
              </span>
            </div>

            <div
              className={`rounded-3xl border p-5 shadow-xs ${
                result.totalRemainingRupees >= 0
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/60 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold block">
                  {result.totalRemainingRupees >= 0 ? 'Remaining Reserve' : 'Budget Overrun'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border">
                  Health: {result.budgetHealthScore}/100
                </span>
              </div>
              <p className="font-serif font-extrabold text-2xl mt-1">
                ₹{Math.abs(result.totalRemainingRupees).toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] mt-1 block opacity-80">
                {result.totalRemainingRupees >= 0 ? 'Buffer safe' : 'Needs category trim'}
              </span>
            </div>
          </div>

          {/* Top Recommendations Alert Box */}
          <div className="rounded-3xl bg-amber-50/80 border border-amber-200/90 p-5 space-y-2">
            <h3 className="font-serif font-bold text-sm text-amber-900 flex items-center gap-2">
              <span>💡</span>
              <span>AI Strategic Budget Recommendations</span>
            </h3>
            <ul className="text-xs text-amber-800 space-y-1.5 list-disc pl-5">
              {result.topRecommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Category Progress Cards */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-zinc-900">
              Category Allocation vs. Actual Spending
            </h3>

            <div className="space-y-4">
              {result.categories.map((cat) => {
                const percentSpent =
                  cat.allocatedRupees > 0
                    ? Math.min(100, Math.round((cat.actualSpentRupees / cat.allocatedRupees) * 100))
                    : 0;

                return (
                  <div
                    key={cat.categoryKey}
                    className="rounded-2xl border border-zinc-100 p-4 bg-zinc-50/40 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-zinc-900">
                            {cat.categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                            {cat.recommendedPercent}% Target
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cat.status === 'HEALTHY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cat.status === 'NEARING_LIMIT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {cat.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-600 sm:text-right">
                        <span>Spent: </span>
                        <strong className="text-zinc-900">
                          ₹{cat.actualSpentRupees.toLocaleString('en-IN')}
                        </strong>{' '}
                        <span className="text-zinc-400">
                          / ₹{cat.allocatedRupees.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.status === 'OVER_BUDGET'
                            ? 'bg-rose-600'
                            : cat.status === 'NEARING_LIMIT'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentSpent}%` }}
                      />
                    </div>

                    {/* Cost saving tips */}
                    <div className="text-[11px] text-zinc-500 space-y-1 pt-1">
                      {cat.tips.map((tip, idx) => (
                        <p key={idx} className="flex items-start gap-1.5">
                          <span className="text-brand-crimson font-bold">&bull;</span>
                          <span>{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
