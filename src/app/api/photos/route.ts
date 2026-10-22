import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { PhotoService } from '@/modules/photo/photo.service';
import { queryPhotosSchema } from '@/modules/photo/photo.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { searchParams } = new URL(request.url);

    const queryInput = queryPhotosSchema.parse({
      eventId: searchParams.get('eventId') || null,
      limit: searchParams.get('limit') || 30,
      cursor: searchParams.get('cursor') || null,
    });

    const response = await PhotoService.listPhotos(memberContext.weddingId, queryInput);

    return NextResponse.json({
      data: response,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
