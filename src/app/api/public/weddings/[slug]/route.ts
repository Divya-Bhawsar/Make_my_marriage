import { NextRequest, NextResponse } from 'next/server';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await Promise.resolve(context.params);
    const weddingData = await WeddingService.getPublicWeddingBySlug(slug);

    return NextResponse.json({
      data: weddingData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
