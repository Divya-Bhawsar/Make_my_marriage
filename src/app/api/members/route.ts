import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { MemberService } from '@/modules/member/member.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const members = await MemberService.listMembers(memberContext.weddingId);

    return NextResponse.json({
      data: members,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
