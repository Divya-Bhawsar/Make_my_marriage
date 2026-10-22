import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { VendorService } from '@/modules/vendor/vendor.service';
import { updateVendorSchema } from '@/modules/vendor/vendor.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { vendorId: string } | Promise<{ vendorId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { vendorId } = await Promise.resolve(context.params);

    const vendor = await VendorService.getVendorById(memberContext.weddingId, vendorId);

    return NextResponse.json({
      data: vendor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { vendorId } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = updateVendorSchema.parse(body);

    const vendor = await VendorService.updateVendor(
      memberContext.weddingId,
      vendorId,
      validatedInput
    );

    return NextResponse.json({
      data: vendor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { vendorId } = await Promise.resolve(context.params);
    const searchParams = request.nextUrl.searchParams;
    const isPermanent = searchParams.get('permanent') === 'true';

    if (isPermanent) {
      await VendorService.deleteVendor(memberContext.weddingId, vendorId);
      return NextResponse.json({
        success: true,
        permanent: true,
      });
    }

    // Default: Soft archive as specified in Section 54 of DATABASE_DESIGN.md
    const archivedVendor = await VendorService.archiveVendor(
      memberContext.weddingId,
      vendorId
    );

    return NextResponse.json({
      success: true,
      data: archivedVendor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
