import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { TaskService } from '@/modules/task/task.service';
import { createTaskSchema, queryTasksSchema } from '@/modules/task/task.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const searchParams = request.nextUrl.searchParams;

    const queryInput = queryTasksSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      committee: searchParams.get('committee') || undefined,
      eventId: searchParams.get('eventId') || undefined,
      assignedMembershipId: searchParams.get('assignedMembershipId') || undefined,
      myTasks: searchParams.get('myTasks') || undefined,
    });

    const result = await TaskService.listTasks(
      memberContext.weddingId,
      memberContext.membership._id.toString(),
      queryInput
    );

    return NextResponse.json({
      data: result.tasks,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const body = await request.json();
    const validatedInput = createTaskSchema.parse(body);

    const task = await TaskService.createTask(
      memberContext.weddingId,
      memberContext.membership._id.toString(),
      validatedInput
    );

    return NextResponse.json(
      {
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
