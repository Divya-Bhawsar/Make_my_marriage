import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/session';
import { MemberService } from '@/modules/member/member.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { token: string } | Promise<{ token: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authContext = await requireAuth(request);
    const { token } = await Promise.resolve(context.params);

    const result = await MemberService.acceptInvitation(token, authContext.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
