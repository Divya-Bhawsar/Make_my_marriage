import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { PhotoService } from '@/modules/photo/photo.service';
import { ValidationError } from '@/shared/errors/app-error';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const formData = await request.formData();

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      throw new ValidationError('A valid image file must be provided.');
    }

    const eventId = formData.get('eventId') ? String(formData.get('eventId')) : null;
    const caption = formData.get('caption') ? String(formData.get('caption')) : null;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const uploaded = await PhotoService.uploadPhoto({
      weddingId: memberContext.weddingId,
      userId: memberContext.user.id,
      uploaderType: 'MEMBER',
      uploaderName: null,
      fileBuffer,
      filename: file.name,
      mimeType: file.type || 'image/jpeg',
      eventId,
      caption,
    });

    return NextResponse.json(
      {
        data: uploaded,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
