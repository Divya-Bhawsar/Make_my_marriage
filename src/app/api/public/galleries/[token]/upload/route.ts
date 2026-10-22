import { NextRequest, NextResponse } from 'next/server';
import { PhotoService } from '@/modules/photo/photo.service';
import { ValidationError } from '@/shared/errors/app-error';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const formData = await request.formData();

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      throw new ValidationError('A valid image file must be provided.');
    }

    const eventId = formData.get('eventId') ? String(formData.get('eventId')) : null;
    const caption = formData.get('caption') ? String(formData.get('caption')) : null;
    const uploaderName = formData.get('uploaderName')
      ? String(formData.get('uploaderName'))
      : null;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const uploaded = await PhotoService.uploadGuestPhoto(params.token, {
      fileBuffer,
      filename: file.name,
      mimeType: file.type || 'image/jpeg',
      eventId,
      caption,
      uploaderName,
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
