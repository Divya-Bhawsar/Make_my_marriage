import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { BroadcastService } from '@/modules/broadcast/broadcast.service';
import { queryRecipientsSchema } from '@/modules/broadcast/broadcast.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = queryRecipientsSchema.parse(body);
    const baseUrl = request.nextUrl.origin;

    const result = await BroadcastService.getBroadcastRecipients(
      memberContext.weddingId,
      validatedInput,
      baseUrl
    );

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
