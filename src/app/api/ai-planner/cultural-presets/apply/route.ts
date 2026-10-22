import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { AiPlannerService } from '@/modules/ai-planner/ai-planner.service';
import { applyCulturalPresetSchema } from '@/modules/ai-planner/ai-planner.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = applyCulturalPresetSchema.parse(body);

    const result = await AiPlannerService.applyCulturalPresetToWedding(
      memberContext.weddingId,
      validatedInput.culture,
      memberContext.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
