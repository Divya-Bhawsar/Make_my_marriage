import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { GuestService } from '@/modules/guest/guest.service';
import { createGuestSchema, queryGuestsSchema } from '@/modules/guest/guest.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const searchParams = request.nextUrl.searchParams;

    const queryInput = queryGuestsSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      rsvpStatus: searchParams.get('rsvpStatus') || undefined,
      side: searchParams.get('side') || undefined,
      eventId: searchParams.get('eventId') || undefined,
    });

    const result = await GuestService.listGuests(memberContext.weddingId, queryInput);

    return NextResponse.json({
      data: result.guests,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = createGuestSchema.parse(body);

    const guest = await GuestService.createGuest(memberContext.weddingId, validatedInput);

    return NextResponse.json(
      {
        data: guest,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
