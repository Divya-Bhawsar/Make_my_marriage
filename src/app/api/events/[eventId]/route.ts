import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { EventService } from '@/modules/event/event.service';
import { updateEventSchema } from '@/modules/event/event.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { eventId: string } | Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { eventId } = await Promise.resolve(context.params);

    const event = await EventService.getEventById(memberContext.weddingId, eventId);

    return NextResponse.json({
      data: event,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { eventId } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = updateEventSchema.parse(body);

    const event = await EventService.updateEvent(memberContext.weddingId, eventId, validatedInput);

    return NextResponse.json({
      data: event,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { eventId } = await Promise.resolve(context.params);

    await EventService.archiveEvent(memberContext.weddingId, eventId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
