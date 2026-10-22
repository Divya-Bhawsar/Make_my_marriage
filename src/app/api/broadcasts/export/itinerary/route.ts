import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { BroadcastService } from '@/modules/broadcast/broadcast.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const csvContent = await BroadcastService.generateItineraryCSV(memberContext.weddingId);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="wedding-ceremonies-itinerary.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
