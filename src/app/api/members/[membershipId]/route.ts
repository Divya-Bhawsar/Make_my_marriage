import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { MemberService } from '@/modules/member/member.service';
import { updateMemberRoleSchema } from '@/modules/member/member.schema';
import { handleApiError } from '@/shared/errors/error-handler';
import { ForbiddenError } from '@/shared/errors/app-error';
import { USER_ROLES, ERROR_CODES } from '@/shared/constants';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { membershipId: string } | Promise<{ membershipId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);

    if (memberContext.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError(
        'Only wedding Admins can update collaborator roles.',
        ERROR_CODES.FORBIDDEN
      );
    }

    const { membershipId } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = updateMemberRoleSchema.parse(body);

    const updated = await MemberService.updateMemberRole(
      memberContext.weddingId,
      membershipId,
      validatedInput.role
    );

    return NextResponse.json({
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);

    if (memberContext.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError(
        'Only wedding Admins can remove collaborators.',
        ERROR_CODES.FORBIDDEN
      );
    }

    const { membershipId } = await Promise.resolve(context.params);
    const result = await MemberService.removeMember(memberContext.weddingId, membershipId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
