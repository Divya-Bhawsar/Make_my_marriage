import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { VendorService } from '@/modules/vendor/vendor.service';
import { discoverySearchSchema } from '@/modules/vendor/vendor.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const searchParams = request.nextUrl.searchParams;

    const queryInput = discoverySearchSchema.parse({
      category: searchParams.get('category') || undefined,
      query: searchParams.get('query') || undefined,
      latitude: searchParams.get('latitude') || undefined,
      longitude: searchParams.get('longitude') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const { results, city } = await VendorService.searchNearbyVendors(
      memberContext.weddingId,
      queryInput
    );

    return NextResponse.json({
      data: results,
      city,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
