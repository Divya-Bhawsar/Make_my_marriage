import { NextRequest, NextResponse } from 'next/server';
import { requireWeddingMember } from '@/server/auth/session';
import { ExpenseService } from '@/modules/expense/expense.service';
import { createExpenseSchema, queryExpensesSchema } from '@/modules/expense/expense.schema';
import { handleApiError } from '@/shared/errors/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const memberContext = await requireWeddingMember(request);
    const searchParams = request.nextUrl.searchParams;

    const queryInput = queryExpensesSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      payerSide: searchParams.get('payerSide') || undefined,
      eventId: searchParams.get('eventId') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });

    const result = await ExpenseService.listExpenses(memberContext.weddingId, queryInput);

    return NextResponse.json({
      data: result.expenses,
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
    const validatedInput = createExpenseSchema.parse(body);

    const expense = await ExpenseService.createExpense(
      memberContext.weddingId,
      memberContext.membership._id.toString(),
      validatedInput
    );

    return NextResponse.json(
      {
        data: expense,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
