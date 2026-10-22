import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { GuestService } from '@/modules/guest/guest.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { guestId: string } | Promise<{ guestId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { guestId } = await Promise.resolve(context.params);

    const url = await GuestService.getGuestInvitationLink(memberContext.weddingId, guestId);

    return NextResponse.json({
      data: {
        url,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
