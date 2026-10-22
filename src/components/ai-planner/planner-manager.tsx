'use client';

import React, { useState } from 'react';
import { CulturalPresetDefinition } from '@/modules/ai-planner/ai-planner.service';
import { PlannerMetricStrip } from './planner-metric-strip';
import { HalwaiCalculator } from './halwai-calculator';
import { CulturalScheduler } from './cultural-scheduler';
import { BudgetOptimizer } from './budget-optimizer';
import { PlannerAdvisor } from './planner-advisor';

interface PlannerManagerProps {
  culturalPresets: CulturalPresetDefinition[];
  guestCount?: number;
  totalCeremonies?: number;
}

export function PlannerManager({
  culturalPresets,
  guestCount = 350,
  totalCeremonies = 5,
}: PlannerManagerProps) {
  const [activeTab, setActiveTab] = useState<'halwai' | 'cultural' | 'budget' | 'advisor'>('halwai');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const tabs = [
    { id: 'halwai', label: '🍲 Halwai & Plate Calculator', icon: '🍲' },
    { id: 'cultural', label: '🪔 Cultural Rituals & Samagri', icon: '🪔' },
    { id: 'budget', label: '💰 AI Budget Optimizer', icon: '💰' },
    { id: 'advisor', label: '🤖 Smart Wedding Advisor', icon: '🤖' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Title & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
              AI Wedding Planner &amp; Smart Assistant
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Intelligent Halwai ration calculations, regional cultural rituals, budget optimization, and strategic wedding advice.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/90 border border-zinc-200 overflow-x-auto self-start sm:self-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="rounded-2xl bg-zinc-900 text-white p-3 text-xs font-semibold shadow-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Strip */}
      <PlannerMetricStrip totalCeremonies={totalCeremonies} />

      {/* Tab Views */}
      {activeTab === 'halwai' && (
        <HalwaiCalculator
          initialGuestCount={guestCount}
          onCopyFeedback={showToast}
        />
      )}

      {activeTab === 'cultural' && (
        <CulturalScheduler
          presets={culturalPresets}
          onApplySuccess={showToast}
        />
      )}

      {activeTab === 'budget' && <BudgetOptimizer />}

      {activeTab === 'advisor' && <PlannerAdvisor onCopyFeedback={showToast} />}
    </div>
  );
}
