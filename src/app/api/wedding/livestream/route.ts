import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { updateLivestreamSchema } from '@/modules/wedding/wedding.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const settings = await WeddingService.getLivestreamSettings(memberContext.weddingId);

    return NextResponse.json({
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = updateLivestreamSchema.parse(body);

    const updated = await WeddingService.updateLivestreamSettings(
      memberContext.weddingId,
      validatedInput
    );

    return NextResponse.json({
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
