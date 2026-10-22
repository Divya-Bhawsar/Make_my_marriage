import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { TaskService } from '@/modules/task/task.service';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);

    const members = await TaskService.listMembersForAssignment(memberContext.weddingId);

    return NextResponse.json({
      data: members,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
