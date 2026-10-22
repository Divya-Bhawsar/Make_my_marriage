import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postHalwai } from './halwai/route';
import { GET as getCulturalPresets } from './cultural-presets/route';
import { POST as applyCulturalPreset } from './cultural-presets/apply/route';
import { POST as postBudgetOptimizer } from './budget-optimizer/route';
import { POST as postAdvisor } from './advisor/route';
import { AiPlannerService } from '@/modules/ai-planner/ai-planner.service';
import {
  CATERER_CONTRACT_TYPES,
  CULTURAL_PRESET_TYPES,
  BUDGET_PRIORITY_FOCUS,
} from '@/modules/ai-planner/ai-planner.schema';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('AI Planner API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMemberContext = {
    user: { id: 'u1', name: 'Vivek', email: 'vivek@example.com' },
    session: {} as any,
    membership: {
      _id: 'm1' as any,
      userId: 'u1' as any,
      weddingId: 'w1' as any,
      role: USER_ROLES.ADMIN,
      joinedAt: new Date(),
    } as any,
    wedding: {
      id: 'w1',
      brideName: 'Eisha',
      groomName: 'Vivek',
      weddingDate: '2026-10-20',
      timeZone: 'Asia/Kolkata',
      website: { slug: 'eisha-vivek-20102026' },
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  describe('POST /api/ai-planner/halwai', () => {
    it('returns halwai calculations and savings for authenticated member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(AiPlannerService, 'calculateHalwaiEstimates').mockResolvedValue({
        invitedHeadcount: 350,
        expectedTurnout: 308,
        turnoutPercent: 88,
        safetyBufferPercent: 12,
        recommendedPlates: 345,
        flatCatererQuotePlates: 403,
        platesSaved: 58,
        costPerPlate: 1200,
        estimatedRupeeSavings: 69600,
        totalEstimatedCateringRupees: 414000,
        rationList: [],
        turnoutTip: 'Standard turnout.',
      });

      const req = new NextRequest('http://localhost:3000/api/ai-planner/halwai', {
        method: 'POST',
        body: JSON.stringify({
          invitedHeadcount: 350,
          ceremonyType: 'WEDDING',
          contractType: CATERER_CONTRACT_TYPES.PER_PLATE,
          costPerPlate: 1200,
        }),
      });

      const res = await postHalwai(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.recommendedPlates).toBe(345);
      expect(data.data.estimatedRupeeSavings).toBe(69600);
    });
  });

  describe('GET /api/ai-planner/cultural-presets', () => {
    it('returns public list of cultural traditions without requiring auth', async () => {
      const presets = AiPlannerService.getCulturalPresets();

      const res = await getCulturalPresets();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toHaveLength(presets.length);
      expect(data.data[0].culture).toBe(CULTURAL_PRESET_TYPES.NORTH_INDIAN_PUNJABI);
    });
  });

  describe('POST /api/ai-planner/cultural-presets/apply', () => {
    it('applies cultural ceremonies to workspace', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(AiPlannerService, 'applyCulturalPresetToWedding').mockResolvedValue({
        appliedCeremoniesCount: 4,
        appliedTasksCount: 12,
        culture: CULTURAL_PRESET_TYPES.GUJARATI,
      });

      const req = new NextRequest('http://localhost:3000/api/ai-planner/cultural-presets/apply', {
        method: 'POST',
        body: JSON.stringify({
          culture: CULTURAL_PRESET_TYPES.GUJARATI,
        }),
      });

      const res = await applyCulturalPreset(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.appliedCeremoniesCount).toBe(4);
    });
  });

  describe('POST /api/ai-planner/budget-optimizer', () => {
    it('returns budget optimization and health score', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(AiPlannerService, 'optimizeBudget').mockResolvedValue({
        totalBudgetRupees: 2500000,
        totalSpentRupees: 1200000,
        totalRemainingRupees: 1300000,
        budgetHealthScore: 85,
        priorityFocus: BUDGET_PRIORITY_FOCUS.BALANCED,
        categories: [],
        topRecommendations: ['Negotiate catering raw materials.'],
      });

      const req = new NextRequest('http://localhost:3000/api/ai-planner/budget-optimizer', {
        method: 'POST',
        body: JSON.stringify({
          totalBudgetRupees: 2500000,
          priorityFocus: BUDGET_PRIORITY_FOCUS.BALANCED,
        }),
      });

      const res = await postBudgetOptimizer(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.budgetHealthScore).toBe(85);
      expect(data.data.totalRemainingRupees).toBe(1300000);
    });
  });

  describe('POST /api/ai-planner/advisor', () => {
    it('returns structured advisor answers and action items', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const req = new NextRequest('http://localhost:3000/api/ai-planner/advisor', {
        method: 'POST',
        body: JSON.stringify({
          question: 'What raw materials for halwai?',
        }),
      });

      const res = await postAdvisor(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.topic).toContain('Halwai');
      expect(data.data.actionableInsights.length).toBeGreaterThan(0);
    });
  });
});
