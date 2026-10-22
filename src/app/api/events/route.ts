import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { EventService } from '@/modules/event/event.service';
import { createEventSchema, queryEventsSchema } from '@/modules/event/event.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const searchParams = request.nextUrl.searchParams;

    const queryInput = queryEventsSchema.parse({
      includeArchived: searchParams.get('includeArchived') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });

    const events = await EventService.listEvents(memberContext.weddingId, queryInput);

    return NextResponse.json({
      data: events,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = createEventSchema.parse(body);

    const event = await EventService.createEvent(memberContext.weddingId, validatedInput);

    return NextResponse.json(
      {
        data: event,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
