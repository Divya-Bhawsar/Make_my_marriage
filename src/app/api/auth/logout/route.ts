import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';
import { clearSessionCookie } from '@/server/auth/session';
import { SESSION_COOKIE_NAME } from '@/shared/constants';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (rawToken) {
      await AuthService.logout(rawToken);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
