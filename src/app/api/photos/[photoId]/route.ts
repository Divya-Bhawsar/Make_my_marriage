import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { PhotoService } from '@/modules/photo/photo.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    photoId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const memberContext = await requireWeddingMember(request);
    const result = await PhotoService.deletePhoto(
      memberContext.weddingId,
      params.photoId
    );

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
