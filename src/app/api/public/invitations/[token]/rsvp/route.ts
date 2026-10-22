import { NextRequest, NextResponse } from 'next/server';
import { GuestService } from '@/modules/guest/guest.service';
import { submitRsvpSchema } from '@/modules/guest/guest.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { token: string } | Promise<{ token: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = submitRsvpSchema.parse(body);

    const result = await GuestService.submitPublicRsvp(token, validatedInput);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
