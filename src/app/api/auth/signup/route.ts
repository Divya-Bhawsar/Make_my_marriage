import { NextRequest, NextResponse } from 'next/server';
import { signupSchema } from '@/modules/auth/auth.schema';
import { AuthService } from '@/modules/auth/auth.service';
import { setSessionCookie } from '@/server/auth/session';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = signupSchema.parse(body);

    const result = await AuthService.signup(validatedInput);

    const response = NextResponse.json(
      {
        data: {
          user: result.user,
          hasWedding: result.hasWedding,
        },
      },
      { status: 201 }
    );

    setSessionCookie(response, result.rawToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
