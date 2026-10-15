import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/modules/auth/auth.schema';
import { AuthService } from '@/modules/auth/auth.service';
import { setSessionCookie } from '@/server/auth/session';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = loginSchema.parse(body);

    const result = await AuthService.login(validatedInput);

    const response = NextResponse.json({
      data: {
        user: result.user,
        hasWedding: result.hasWedding,
      },
    });

    setSessionCookie(response, result.rawToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
