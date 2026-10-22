import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { ExpenseService } from '@/modules/expense/expense.service';
import { updateExpenseSchema } from '@/modules/expense/expense.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { expenseId: string } | Promise<{ expenseId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { expenseId } = await Promise.resolve(context.params);

    const expense = await ExpenseService.getExpenseById(memberContext.weddingId, expenseId);

    return NextResponse.json({
      data: expense,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { expenseId } = await Promise.resolve(context.params);
    const body = await request.json();
    const validatedInput = updateExpenseSchema.parse(body);

    const expense = await ExpenseService.updateExpense(
      memberContext.weddingId,
      expenseId,
      validatedInput
    );

    return NextResponse.json({
      data: expense,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const memberContext = await requireWeddingMember(request);
    const { expenseId } = await Promise.resolve(context.params);

    await ExpenseService.deleteExpense(memberContext.weddingId, expenseId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
