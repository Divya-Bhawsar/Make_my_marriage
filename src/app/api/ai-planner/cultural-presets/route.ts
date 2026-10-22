import { NextResponse } from 'next/server';
import { AiPlannerService } from '@/modules/ai-planner/ai-planner.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const presets = AiPlannerService.getCulturalPresets();

    return NextResponse.json({
      data: presets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
