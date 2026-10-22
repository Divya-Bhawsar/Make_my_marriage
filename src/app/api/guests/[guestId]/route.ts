import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { GuestService } from '@/modules/guest/guest.service';
import { updateGuestSchema } from '@/modules/guest/guest.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { guestId: string } | Promise<{ guestId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { guestId } = await Promise.resolve(context.params);

    const guest = await GuestService.getGuestById(memberContext.weddingId, guestId);

    return NextResponse.json({
      data: guest,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { guestId } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = updateGuestSchema.parse(body);

    const guest = await GuestService.updateGuest(memberContext.weddingId, guestId, validatedInput);

    return NextResponse.json({
      data: guest,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { guestId } = await Promise.resolve(context.params);

    await GuestService.deleteGuest(memberContext.weddingId, guestId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
