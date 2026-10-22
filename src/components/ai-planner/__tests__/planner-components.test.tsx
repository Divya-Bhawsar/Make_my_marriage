import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { PlannerMetricStrip } from '../planner-metric-strip';
import { HalwaiCalculator } from '../halwai-calculator';
import { CulturalScheduler } from '../cultural-scheduler';
import { BudgetOptimizer } from '../budget-optimizer';
import { PlannerAdvisor } from '../planner-advisor';
import { AiPlannerService } from '@/modules/ai-planner/ai-planner.service';

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('AI Planner Components', () => {
  const presets = AiPlannerService.getCulturalPresets();

  describe('PlannerMetricStrip', () => {
    it('renders accurate metrics and status badges', () => {
      const html = normalizeHtml(
        renderToString(
          <PlannerMetricStrip
            potentialSavingsRupees={85000}
            budgetHealthScore={92}
            totalCeremonies={6}
          />
        )
      );

      expect(html).toContain('Catering Savings');
      expect(html).toContain('₹85K');
      expect(html).toContain('Budget Health Score');
      expect(html).toContain('92/100');
      expect(html).toContain('Ceremonies Mapped');
      expect(html).toContain('>6<');
      expect(html).toContain('AI Advisor Engine');
    });
  });

  describe('HalwaiCalculator', () => {
    it('renders controls and plate calculations', () => {
      const html = normalizeHtml(
        renderToString(
          <HalwaiCalculator
            initialGuestCount={350}
            onCopyFeedback={vi.fn()}
          />
        )
      );

      expect(html).toContain('Halwai Plate & Food Wastage Optimizer');
      expect(html).toContain('Ceremony Type');
      expect(html).toContain('350 Guests');
      expect(html).toContain('Caterer Rate (₹ / Plate)');
      expect(html).toContain('Expected Attendance:');
    });
  });

  describe('CulturalScheduler', () => {
    it('renders cultural heritage cards and authentic ceremony timeline', () => {
      const html = normalizeHtml(
        renderToString(
          <CulturalScheduler
            presets={presets}
            onApplySuccess={vi.fn()}
          />
        )
      );

      expect(html).toContain('Regional Cultural Rituals & Auspicious Samagri');
      expect(html).toContain('North Indian');
      expect(html).toContain('Marwari');
      expect(html).toContain('Gujarati');
      expect(html).toContain('South Indian');
      expect(html).toContain('Maharashtrian');
      expect(html).toContain('Bengali');

      expect(html).toContain('Import');
      expect(html).toContain('Ceremonies to Schedule');
      expect(html).toContain('Essential Sacred Samagri:');
    });
  });

  describe('BudgetOptimizer', () => {
    it('renders budget inputs, presets, and strategy focus buttons', () => {
      const html = normalizeHtml(renderToString(<BudgetOptimizer />));

      expect(html).toContain('AI Budget Optimizer & Negotiation Guide');
      expect(html).toContain('Total Target Wedding Budget');
      expect(html).toContain('₹15 Lakhs');
      expect(html).toContain('₹25 Lakhs');
      expect(html).toContain('₹40 Lakhs');
      expect(html).toContain('Balanced');
      expect(html).toContain('Food First');
      expect(html).toContain('Decor & Reels');
    });
  });

  describe('PlannerAdvisor', () => {
    it('renders question suggestions and input box', () => {
      const html = normalizeHtml(
        renderToString(
          <PlannerAdvisor onCopyFeedback={vi.fn()} />
        )
      );

      expect(html).toContain('Indian Wedding Wisdom & Strategy Assistant');
      expect(html).toContain('Popular Questions:');
      expect(html).toContain('Halwai raw material grocery list');
      expect(html).toContain('Pheras and Mandap samagri');
      expect(html).toContain('Get Guidance');
    });
  });
});
