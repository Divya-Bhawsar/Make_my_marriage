import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { PhotoService } from '@/modules/photo/photo.service';
import { updateGallerySettingsSchema } from '@/modules/photo/photo.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const settings = await PhotoService.getGallerySettings(memberContext.weddingId);

    return NextResponse.json({
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = updateGallerySettingsSchema.parse(body);

    const updated = await PhotoService.updateGallerySettings(
      memberContext.weddingId,
      validatedInput
    );

    return NextResponse.json({
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
