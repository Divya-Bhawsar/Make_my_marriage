import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { MemberService } from '@/modules/member/member.service';
import { createMemberInvitationSchema } from '@/modules/member/member.schema';
import { handleApiError } from '@/shared/errors/error-handler';
import { ForbiddenError } from '@/shared/errors/app-error';
import { USER_ROLES, ERROR_CODES } from '@/shared/constants';

export const dynamic = 'force-dynamic';

function resolveRequestBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (host) {
    const proto = request.nextUrl.protocol.replace(':', '') || 'http';
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);

    if (memberContext.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError(
        'Only wedding Admins can view pending invitations.',
        ERROR_CODES.FORBIDDEN
      );
    }

    const baseUrl = resolveRequestBaseUrl(request);
    const invitations = await MemberService.listInvitations(memberContext.weddingId, baseUrl);

    return NextResponse.json({
      data: invitations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);

    if (memberContext.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError(
        'Only wedding Admins can invite collaborators.',
        ERROR_CODES.FORBIDDEN
      );
    }

    const body = await request.json();
    const validatedInput = createMemberInvitationSchema.parse(body);
    const baseUrl = resolveRequestBaseUrl(request);

    const invitation = await MemberService.createInvitation(
      memberContext.weddingId,
      memberContext.user.id,
      validatedInput,
      baseUrl
    );

    return NextResponse.json(
      {
        data: invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
