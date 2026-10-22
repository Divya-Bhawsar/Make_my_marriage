import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { TaskService } from '@/modules/task/task.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);

    const summary = await TaskService.getTaskSummary(
      memberContext.weddingId,
      memberContext.membership._id.toString()
    );

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
