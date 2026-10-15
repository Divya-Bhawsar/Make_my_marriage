import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/session';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);

    return NextResponse.json({
      data: {
        user: authContext.user,
        membership: authContext.membership
          ? {
              id: authContext.membership._id.toString(),
              role: authContext.membership.role,
              joinedAt: authContext.membership.joinedAt.toISOString(),
            }
          : null,
        wedding: authContext.wedding
          ? {
              id: authContext.wedding.id,
              brideName: authContext.wedding.brideName,
              groomName: authContext.wedding.groomName,
              weddingDate: authContext.wedding.weddingDate,
              timeZone: authContext.wedding.timeZone,
              website: {
                slug: authContext.wedding.website.slug,
              },
            }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
