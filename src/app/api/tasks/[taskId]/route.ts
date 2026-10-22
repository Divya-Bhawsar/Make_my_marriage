import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { TaskService } from '@/modules/task/task.service';
import { updateTaskSchema } from '@/modules/task/task.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { taskId: string } | Promise<{ taskId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { taskId } = await Promise.resolve(context.params);

    const task = await TaskService.getTaskById(memberContext.weddingId, taskId);

    return NextResponse.json({
      data: task,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { taskId } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = updateTaskSchema.parse(body);

    const task = await TaskService.updateTask(
      memberContext.weddingId,
      taskId,
      validatedInput
    );

    return NextResponse.json({
      data: task,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { taskId } = await Promise.resolve(context.params);

    await TaskService.deleteTask(memberContext.weddingId, taskId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
