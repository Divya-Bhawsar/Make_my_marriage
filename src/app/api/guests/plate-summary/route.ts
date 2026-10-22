import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { GuestService } from '@/modules/guest/guest.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const summary = await GuestService.getCatererPlateSummary(memberContext.weddingId);

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
