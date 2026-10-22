import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { VendorService } from '@/modules/vendor/vendor.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const summary = await VendorService.getVendorSummary(memberContext.weddingId);

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
