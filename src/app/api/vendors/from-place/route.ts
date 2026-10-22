import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { VendorService } from '@/modules/vendor/vendor.service';
import { createFromPlaceSchema } from '@/modules/vendor/vendor.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = createFromPlaceSchema.parse(body);

    const vendor = await VendorService.createVendorFromPlace(
      memberContext.weddingId,
      validatedInput
    );

    return NextResponse.json(
      {
        data: vendor,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
