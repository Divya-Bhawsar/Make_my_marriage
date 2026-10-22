import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { VendorService } from '@/modules/vendor/vendor.service';
import { createVendorSchema, queryVendorsSchema } from '@/modules/vendor/vendor.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const searchParams = request.nextUrl.searchParams;

    const queryInput = queryVendorsSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      includeArchived: searchParams.get('includeArchived') || undefined,
    });

    const result = await VendorService.listVendors(
      memberContext.weddingId,
      queryInput
    );

    return NextResponse.json({
      data: result.vendors,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = createVendorSchema.parse(body);

    const vendor = await VendorService.createVendor(
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
