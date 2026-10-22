'use client';

import React, { useState } from 'react';
import { PlannerAdvisorResponse } from '@/modules/ai-planner/ai-planner.service';

interface PlannerAdvisorProps {
  onCopyFeedback: (msg: string) => void;
}

export function PlannerAdvisor({ onCopyFeedback }: PlannerAdvisorProps) {
  const [question, setQuestion] = useState(
    'How should we calculate the Halwai raw material grocery list?'
  );
  const [response, setResponse] = useState<PlannerAdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleQuestions = [
    'How should we calculate the Halwai raw material grocery list?',
    'What are the essential items needed for the Pheras and Mandap samagri?',
    'How should we split wedding expenses between Groom and Bride families?',
    'How many sweet boxes (Mithai Dabbas) should we order for return gifts?',
  ];

  const handleAsk = async (q: string) => {
    setQuestion(q);
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-planner/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAdvice = () => {
    if (!response) return;
    const lines = [
      `Make My Marriage — Wedding AI Advisor Blueprint`,
      `Topic: ${response.topic} | ${response.title}`,
      `Summary: ${response.summary}`,
      ``,
      `Actionable Insights:`,
      ...response.actionableInsights.map((ins) => `• ${ins}`),
      ``,
      `Essential Checklist Items:`,
      ...response.checklistItems.map((chk) => `[ ] ${chk}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    onCopyFeedback('Advisor advice blueprint copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Search & Prompt Picker */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-2">
            <span>🤖</span>
            <span>Indian Wedding Wisdom &amp; Strategy Assistant</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Instant practical guidance on Indian wedding dilemmas, ritual protocols, vendor negotiation, and etiquette.
          </p>
        </div>

        {/* Preset Prompt Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Popular Questions:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {sampleQuestions.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => handleAsk(sq)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all text-left cursor-pointer ${
                  question === sq
                    ? 'border-brand-crimson bg-rose-50 text-brand-crimson font-semibold'
                    : 'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any question about wedding planning, rituals, or budgets..."
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-brand-crimson focus:outline-hidden bg-white"
          />
          <button
            type="button"
            onClick={() => handleAsk(question)}
            disabled={isLoading || !question.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand-crimson hover:bg-brand-burgundy text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Get Guidance</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advisory Result Card */}
      {response && (
        <div className="bg-white rounded-3xl border border-brand-sand/70 shadow-md p-6 sm:p-7 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">
                {response.topic}
              </span>
              <h3 className="font-serif font-bold text-xl text-zinc-900 mt-0.5">
                {response.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyAdvice}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>Copy Blueprint</span>
            </button>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed font-sans">
            {response.summary}
          </p>

          {/* Actionable Insights */}
          <div className="space-y-2.5">
            <h4 className="font-serif font-bold text-sm text-zinc-900 flex items-center gap-2">
              <span>💡</span>
              <span>Actionable Strategic Insights</span>
            </h4>
            <div className="space-y-2">
              {response.actionableInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 text-xs text-zinc-700 flex items-start gap-2.5"
                >
                  <span className="h-5 w-5 rounded-full bg-brand-crimson/10 text-brand-crimson font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5 pt-2">
            <h4 className="font-serif font-bold text-sm text-zinc-900 flex items-center gap-2">
              <span>✅</span>
              <span>Essential Checklist &amp; Action Items</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {response.checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-950 flex items-start gap-2"
                >
                  <span className="text-emerald-600 text-sm leading-none">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
