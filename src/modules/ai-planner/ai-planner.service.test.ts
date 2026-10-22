import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AiPlannerService } from './ai-planner.service';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { ExpenseModel } from '@/modules/expense/expense.model';
import { TaskModel } from '@/modules/task/task.model';
import { WeddingMembershipModel } from '@/modules/wedding/membership.model';
import { NotFoundError } from '@/shared/errors/app-error';
import {
  CATERER_CONTRACT_TYPES,
  CULTURAL_PRESET_TYPES,
  BUDGET_PRIORITY_FOCUS,
} from './ai-planner.schema';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('AiPlannerService', () => {
  const weddingId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();

  const mockWeddingDoc = {
    _id: new mongoose.Types.ObjectId(weddingId),
    brideName: 'Eisha',
    groomName: 'Vivek',
    title: 'Vivek & Eisha',
    weddingDate: '2026-10-20',
    location: { city: 'Indore' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateHalwaiEstimates', () => {
    it('throws NotFoundError if wedding is not found', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      await expect(
        AiPlannerService.calculateHalwaiEstimates(weddingId, {
          invitedHeadcount: 300,
          ceremonyType: 'WEDDING',
          contractType: CATERER_CONTRACT_TYPES.PER_PLATE,
          costPerPlate: 1200,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('calculates optimal plate counts, savings, and raw material rations for Sangeet', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const result = await AiPlannerService.calculateHalwaiEstimates(weddingId, {
        invitedHeadcount: 400,
        ceremonyType: 'SANGEET',
        contractType: CATERER_CONTRACT_TYPES.PER_PLATE,
        costPerPlate: 1500,
      });

      // 400 invited, Sangeet turnout 95% = 380 expected turnout
      // +10% safety buffer on 380 = 380 * 1.10 = 418 plates
      // Flat caterer quote: 400 * 1.15 = 460 plates
      // Plates saved: 460 - 418 = 42 plates
      // Savings: 42 * 1500 = ₹63,000
      expect(result.invitedHeadcount).toBe(400);
      expect(result.expectedTurnout).toBe(380);
      expect(result.recommendedPlates).toBe(418);
      expect(result.flatCatererQuotePlates).toBe(460);
      expect(result.platesSaved).toBe(42);
      expect(result.estimatedRupeeSavings).toBe(63000);
      expect(result.rationList.length).toBeGreaterThanOrEqual(7);

      // Verify key ration ingredients exist
      const ghee = result.rationList.find((r) => r.ingredient.includes('Ghee'))!;
      const paneer = result.rationList.find((r) => r.ingredient.includes('Paneer'))!;
      expect(ghee.quantity).toBeGreaterThan(0);
      expect(paneer.quantity).toBeGreaterThan(0);
    });

    it('calculates optimal plate counts for Mehendi with customized turnout override', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const result = await AiPlannerService.calculateHalwaiEstimates(weddingId, {
        invitedHeadcount: 200,
        ceremonyType: 'MEHENDI',
        contractType: CATERER_CONTRACT_TYPES.PER_PLATE,
        costPerPlate: 800,
        expectedTurnoutPercent: 80, // overridden turnout
      });

      // 200 invited * 80% = 160 expected turnout
      // +8% buffer = 160 * 1.08 = 173 plates
      // Flat caterer quote: 200 * 1.15 = 230 plates
      // Plates saved: 230 - 173 = 57 plates
      // Savings: 57 * 800 = ₹45,600
      expect(result.expectedTurnout).toBe(160);
      expect(result.recommendedPlates).toBe(173);
      expect(result.platesSaved).toBe(57);
      expect(result.estimatedRupeeSavings).toBe(45600);
    });
  });

  describe('getCulturalPresets', () => {
    it('returns all 6 regional cultural wedding traditions with ceremonies', () => {
      const presets = AiPlannerService.getCulturalPresets();

      expect(presets).toHaveLength(6);
      const cultures = presets.map((p) => p.culture);
      expect(cultures).toContain(CULTURAL_PRESET_TYPES.NORTH_INDIAN_PUNJABI);
      expect(cultures).toContain(CULTURAL_PRESET_TYPES.MARWARI_RAJASTHANI);
      expect(cultures).toContain(CULTURAL_PRESET_TYPES.GUJARATI);
      expect(cultures).toContain(CULTURAL_PRESET_TYPES.SOUTH_INDIAN);
      expect(cultures).toContain(CULTURAL_PRESET_TYPES.MAHARASHTRIAN);
      expect(cultures).toContain(CULTURAL_PRESET_TYPES.BENGALI);

      // Verify first preset has rich ceremony data
      const punjabi = presets[0];
      expect(punjabi.ceremonies.length).toBeGreaterThanOrEqual(4);
      expect(punjabi.ceremonies[0].samagriList.length).toBeGreaterThan(0);
      expect(punjabi.ceremonies[0].tasks.length).toBeGreaterThan(0);
    });
  });

  describe('applyCulturalPresetToWedding', () => {
    it('creates missing ceremonies in WeddingEventModel and tasks in TaskModel', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      } as any);
      vi.spyOn(WeddingEventModel, 'find').mockResolvedValue([]); // No events exist yet
      vi.spyOn(WeddingEventModel, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      } as any);
      vi.spyOn(TaskModel, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
      } as any);

      const result = await AiPlannerService.applyCulturalPresetToWedding(
        weddingId,
        CULTURAL_PRESET_TYPES.GUJARATI,
        userId
      );

      expect(result.culture).toBe(CULTURAL_PRESET_TYPES.GUJARATI);
      expect(result.appliedCeremoniesCount).toBe(4);
      expect(result.appliedTasksCount).toBeGreaterThan(0);
      expect(WeddingEventModel.create).toHaveBeenCalled();
      expect(TaskModel.create).toHaveBeenCalled();
    });
  });

  describe('optimizeBudget', () => {
    it('computes category allocations, variance, and health score', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      // Mock expenses: ₹8,00,000 in Catering, ₹3,00,000 in Venue
      const mockExpenses = [
        { category: 'CATERING', amountPaise: 80000000 }, // ₹8,00,000
        { category: 'VENUE', amountPaise: 30000000 },    // ₹3,00,000
      ];
      vi.spyOn(ExpenseModel, 'find').mockResolvedValue(mockExpenses as any);

      const result = await AiPlannerService.optimizeBudget(weddingId, {
        totalBudgetRupees: 2500000, // ₹25,00,000
        priorityFocus: BUDGET_PRIORITY_FOCUS.BALANCED,
      });

      expect(result.totalBudgetRupees).toBe(2500000);
      expect(result.totalSpentRupees).toBe(1100000);
      expect(result.totalRemainingRupees).toBe(1400000);
      expect(result.budgetHealthScore).toBeGreaterThan(50);
      expect(result.categories.length).toBeGreaterThan(0);

      const cateringCat = result.categories.find((c) => c.categoryKey === 'CATERING')!;
      expect(cateringCat.actualSpentRupees).toBe(800000);
      expect(cateringCat.tips.length).toBeGreaterThan(0);
    });
  });

  describe('askPlannerAdvisor', () => {
    it('provides halwai and ration guidance when asked about catering', () => {
      const advice = AiPlannerService.askPlannerAdvisor(weddingId, 'How much ration and ghee for halwai?');
      expect(advice.topic).toContain('Halwai & Catering');
      expect(advice.actionableInsights.length).toBeGreaterThan(0);
      expect(advice.checklistItems.length).toBeGreaterThan(0);
    });

    it('provides sacred samagri checklist when asked about pheras', () => {
      const advice = AiPlannerService.askPlannerAdvisor(weddingId, 'What samagri is needed for the mandap pheras?');
      expect(advice.topic).toContain('Mandap & Pheras');
      expect(advice.checklistItems.some((c) => c.includes('Ghee'))).toBe(true);
    });

    it('provides multi-family expense splitting advice when asked about budget sharing', () => {
      const advice = AiPlannerService.askPlannerAdvisor(weddingId, 'How should groom and bride split expenses?');
      expect(advice.topic).toContain('Expense Splitting');
      expect(advice.actionableInsights.some((a) => a.includes('Rupee Ledger'))).toBe(true);
    });
  });
});
