'use client';

import React, { useState, useEffect } from 'react';
import { HalwaiEstimateResult } from '@/modules/ai-planner/ai-planner.service';

interface HalwaiCalculatorProps {
  initialGuestCount?: number;
  onCopyFeedback: (msg: string) => void;
}

export function HalwaiCalculator({
  initialGuestCount = 350,
  onCopyFeedback,
}: HalwaiCalculatorProps) {
  const [headcount, setHeadcount] = useState(initialGuestCount);
  const [ceremonyType, setCeremonyType] = useState('WEDDING');
  const [costPerPlate, setCostPerPlate] = useState(1200);
  const [turnoutPercent, setTurnoutPercent] = useState<number | undefined>(undefined);
  const [estimates, setEstimates] = useState<HalwaiEstimateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function calculate() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai-planner/halwai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitedHeadcount: headcount,
            ceremonyType,
            costPerPlate,
            expectedTurnoutPercent: turnoutPercent,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setEstimates(data.data);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    calculate();
  }, [headcount, ceremonyType, costPerPlate, turnoutPercent]);

  const handleCopyRationList = () => {
    if (!estimates) return;
    const lines = [
      `Make My Marriage — Halwai Raw Material Specification (Ration Fard)`,
      `Ceremony: ${ceremonyType} | Recommended Plate Order: ${estimates.recommendedPlates} Plates`,
      `Estimated Savings: ₹${estimates.estimatedRupeeSavings.toLocaleString('en-IN')}`,
      `----------------------------------------------------`,
      ...estimates.rationList.map(
        (item) => `• ${item.ingredient}: ${item.quantity} ${item.unit} (${item.notes})`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    onCopyFeedback('Halwai ration list copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Configuration Controls */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h2 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-2">
            <span>🍲</span>
            <span>Halwai Plate &amp; Food Wastage Optimizer</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Calculate accurate plate orders based on Indian wedding attendance behavior and eliminate costly caterer over-billing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ceremony Type */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
              Ceremony Type
            </label>
            <select
              aria-label="Select ceremony type"
              value={ceremonyType}
              onChange={(e) => {
                setCeremonyType(e.target.value);
                setTurnoutPercent(undefined); // Reset to ceremony baseline
              }}
              className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
            >
              <option value="SANGEET">💃 Sangeet &amp; DJ Night (High Turnout)</option>
              <option value="WEDDING">🪔 Vedic Pheras &amp; Wedding</option>
              <option value="RECEPTION">👑 Grand Reception Gala (Max Turnout)</option>
              <option value="MEHENDI">🌿 Mehendi &amp; Chaat High Tea</option>
              <option value="HALDI">🟡 Haldi &amp; Morning Breakfast</option>
              <option value="POOJA">🕉️ Grah Shanti &amp; Puja</option>
            </select>
          </div>

          {/* Invited Headcount */}
          <div>
            <label htmlFor="invited-headcount" className="text-xs font-semibold text-zinc-700 block mb-1.5">
              Invited Headcount: <strong className="text-brand-crimson">{headcount} Guests</strong>
            </label>
            <input
              id="invited-headcount"
              type="number"
              min={10}
              max={10000}
              value={headcount}
              onChange={(e) => setHeadcount(Math.max(10, parseInt(e.target.value, 10) || 10))}
              className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
            />
          </div>

          {/* Cost per plate */}
          <div>
            <label htmlFor="cost-per-plate" className="text-xs font-semibold text-zinc-700 block mb-1.5">
              Caterer Rate (₹ / Plate)
            </label>
            <input
              id="cost-per-plate"
              type="number"
              min={100}
              max={25000}
              step={50}
              value={costPerPlate}
              onChange={(e) => setCostPerPlate(Math.max(100, parseInt(e.target.value, 10) || 100))}
              className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
            />
          </div>

          {/* Turnout override */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
              Expected Attendance:{' '}
              <strong className="text-emerald-700">
                {turnoutPercent ?? estimates?.turnoutPercent ?? 88}%
              </strong>
            </label>
            <input
              aria-label="Expected attendance percentage"
              type="range"
              min={50}
              max={110}
              value={turnoutPercent ?? estimates?.turnoutPercent ?? 88}
              onChange={(e) => setTurnoutPercent(parseInt(e.target.value, 10))}
              className="w-full accent-brand-crimson cursor-pointer mt-2"
            />
            <span className="text-[10px] text-zinc-400 block mt-1">
              Adjust based on local vs outstation guest ratio
            </span>
          </div>
        </div>
      </div>

      {/* Results & Savings Banner */}
      {estimates && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
          {/* Main Calculation Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                  Optimal Plate Recommendation
                </span>
                <p className="font-serif font-extrabold text-3xl sm:text-4xl text-white mt-1">
                  {estimates.recommendedPlates} Plates
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-700/60">
                  +{estimates.safetyBufferPercent}% Safety Buffer
                </span>
                <p className="text-[11px] text-emerald-300 mt-1">
                  Expected Turnout: {estimates.expectedTurnout}
                </p>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="rounded-2xl bg-emerald-800/40 border border-emerald-700/50 p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-200 font-semibold block">
                  Avoidable Caterer Surplus:
                </span>
                <p className="text-xl font-bold font-serif text-amber-300 mt-0.5">
                  ₹{estimates.estimatedRupeeSavings.toLocaleString('en-IN')} Saved
                </p>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  Compared to traditional flat ordering of {estimates.flatCatererQuotePlates} plates ({estimates.platesSaved} plates saved).
                </p>
              </div>
              <span className="text-3xl">🎉</span>
            </div>

            {/* Turnout Insight */}
            <div className="text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2 pt-1">
              <span>💡</span>
              <span>{estimates.turnoutTip}</span>
            </div>
          </div>

          {/* Quick Cost Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-serif font-bold text-base text-zinc-900">
                Catering Financial Overview
              </h3>
              <div className="space-y-3 mt-4 text-xs divide-y divide-zinc-100">
                <div className="flex justify-between pt-2">
                  <span className="text-zinc-500">Rate per Plate</span>
                  <span className="font-semibold text-zinc-800">
                    ₹{estimates.costPerPlate.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-zinc-500">Total Confirmed Cost</span>
                  <span className="font-bold text-zinc-900 text-sm">
                    ₹{estimates.totalEstimatedCateringRupees.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-zinc-500">Unannounced Walk-in Buffer</span>
                  <span className="font-semibold text-emerald-700">
                    {Math.ceil(estimates.expectedTurnout * (estimates.safetyBufferPercent / 100))} Extra Plates
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyRationList}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>📋</span>
              <span>Copy Halwai Ration Fard</span>
            </button>
          </div>
        </div>
      )}

      {/* Raw Material Ration Table (Halwai Fard) */}
      {estimates && (
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-zinc-900 text-sm">
                Halwai Raw Material Ration List (Wholesale Mandi Estimates)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Procure directly from wholesale grain and ghee traders to save on retail markups.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyRationList}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              Copy Fard
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {estimates.rationList.map((item) => (
              <div
                key={item.ingredient}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-zinc-900 block truncate">{item.ingredient}</span>
                  <span className="text-[11px] text-zinc-500 truncate block mt-0.5">{item.notes}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-serif font-extrabold text-sm text-brand-crimson">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
