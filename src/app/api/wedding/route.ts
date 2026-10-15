import { NextRequest, NextResponse } from 'next/server';
import { createWeddingSchema, updateWeddingSchema } from '@/modules/wedding/wedding.schema';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { requireAuth, requireWeddingMember } from '@/server/auth/session';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    const body = await request.json();
    const validatedInput = createWeddingSchema.parse(body);

    const result = await WeddingService.createWedding(authContext.user.id, validatedInput);

    return NextResponse.json(
      {
        data: result.wedding,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const wedding = await WeddingService.getWeddingById(memberContext.weddingId);

    return NextResponse.json({
      data: wedding,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = updateWeddingSchema.parse(body);

    const updatedWedding = await WeddingService.updateWedding(
      memberContext.weddingId,
      validatedInput
    );

    return NextResponse.json({
      data: updatedWedding,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
