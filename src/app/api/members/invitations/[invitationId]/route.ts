import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { MemberService } from '@/modules/member/member.service';
import { handleApiError } from '@/shared/errors/error-handler';
import { ForbiddenError } from '@/shared/errors/app-error';
import { USER_ROLES, ERROR_CODES } from '@/shared/constants';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { invitationId: string } | Promise<{ invitationId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);

    if (memberContext.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError(
        'Only wedding Admins can revoke invitations.',
        ERROR_CODES.FORBIDDEN
      );
    }

    const { invitationId } = await Promise.resolve(context.params);
    const result = await MemberService.revokeInvitation(memberContext.weddingId, invitationId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
