import { NextRequest, NextResponse } from 'next/server';
import { GuestService } from '@/modules/guest/guest.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { token: string } | Promise<{ token: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await Promise.resolve(context.params);
    const data = await GuestService.getPublicInvitation(token);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
