import { NextRequest, NextResponse } from 'next/server';
import { MemberService } from '@/modules/member/member.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { token: string } | Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await Promise.resolve(context.params);
    const invitation = await MemberService.getPublicInvitationByToken(token);

    return NextResponse.json({
      data: invitation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
