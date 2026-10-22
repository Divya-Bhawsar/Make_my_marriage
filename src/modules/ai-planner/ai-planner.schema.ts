import { z } from 'zod';

export const CATERER_CONTRACT_TYPES = {
  PER_PLATE: 'PER_PLATE',
  RAW_MATERIAL_HALWAI: 'RAW_MATERIAL_HALWAI',
} as const;

export type CatererContractType =
  (typeof CATERER_CONTRACT_TYPES)[keyof typeof CATERER_CONTRACT_TYPES];

export const CULTURAL_PRESET_TYPES = {
  NORTH_INDIAN_PUNJABI: 'NORTH_INDIAN_PUNJABI',
  MARWARI_RAJASTHANI: 'MARWARI_RAJASTHANI',
  GUJARATI: 'GUJARATI',
  SOUTH_INDIAN: 'SOUTH_INDIAN',
  MAHARASHTRIAN: 'MAHARASHTRIAN',
  BENGALI: 'BENGALI',
} as const;

export type CulturalPresetType =
  (typeof CULTURAL_PRESET_TYPES)[keyof typeof CULTURAL_PRESET_TYPES];

export const BUDGET_PRIORITY_FOCUS = {
  BALANCED: 'BALANCED',
  FOOD_FOCUSED: 'FOOD_FOCUSED',
  DECOR_PHOTO: 'DECOR_PHOTO',
  INTIMATE_LUXURY: 'INTIMATE_LUXURY',
} as const;

export type BudgetPriorityFocus =
  (typeof BUDGET_PRIORITY_FOCUS)[keyof typeof BUDGET_PRIORITY_FOCUS];

export const halwaiCalculationSchema = z.object({
  invitedHeadcount: z.number().int().min(10).max(50000),
  ceremonyType: z.enum([
    'SANGEET',
    'WEDDING',
    'RECEPTION',
    'MEHENDI',
    'HALDI',
    'POOJA',
    'CUSTOM',
  ]).default('WEDDING'),
  contractType: z.nativeEnum(CATERER_CONTRACT_TYPES).default(CATERER_CONTRACT_TYPES.PER_PLATE),
  costPerPlate: z.number().min(100).max(100000).default(1200),
  expectedTurnoutPercent: z.number().min(40).max(150).optional(),
});

export type HalwaiCalculationInput = z.infer<typeof halwaiCalculationSchema>;

export const applyCulturalPresetSchema = z.object({
  culture: z.nativeEnum(CULTURAL_PRESET_TYPES),
});

export type ApplyCulturalPresetInput = z.infer<typeof applyCulturalPresetSchema>;

export const budgetOptimizerSchema = z.object({
  totalBudgetRupees: z.number().min(10000).max(1000000000),
  priorityFocus: z.nativeEnum(BUDGET_PRIORITY_FOCUS).default(BUDGET_PRIORITY_FOCUS.BALANCED),
});

export type BudgetOptimizerInput = z.infer<typeof budgetOptimizerSchema>;

export const advisorQuerySchema = z.object({
  question: z.string().min(3).max(1000),
});

export type AdvisorQueryInput = z.infer<typeof advisorQuerySchema>;
