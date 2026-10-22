import { NextRequest, NextResponse } from 'next/server';
import { PhotoService } from '@/modules/photo/photo.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const publicGallery = await PhotoService.getPublicGalleryByToken(params.token);

    return NextResponse.json({
      data: publicGallery,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
