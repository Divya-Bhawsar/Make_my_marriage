import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { ExpenseMetricStrip } from '@/components/expenses/expense-metric-strip';
import { ExpenseModal } from '@/components/expenses/expense-modal';
import { ExpenseLedger } from '@/components/expenses/expense-ledger';
import ExpensesPage from '@/app/(dashboard)/app/expenses/page';
import { ExpenseSummaryDTO, ExpenseDTO } from '@/modules/expense/expense.service';
import { PAYMENT_STATUS, PAYER_SIDE } from '@/shared/constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/expenses',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Expense UI Components', () => {
  const mockSummary: ExpenseSummaryDTO = {
    totalAgreedPaise: 25000000, // ₹2,50,000
    totalPaidPaise: 15000000, // ₹1,50,000
    totalPendingPaise: 10000000, // ₹1,00,000
    totalCount: 4,
    byCategory: [
      { category: 'VENUE', totalPaise: 12000000, paidPaise: 8000000, pendingPaise: 4000000, count: 1 },
      { category: 'CATERING', totalPaise: 8000000, paidPaise: 5000000, pendingPaise: 3000000, count: 2 },
      { category: 'DECORATION', totalPaise: 5000000, paidPaise: 2000000, pendingPaise: 3000000, count: 1 },
    ],
    byPayer: [
      { payerSide: 'GROOM', totalPaise: 10000000, paidPaise: 5000000, pendingPaise: 5000000, count: 2 },
      { payerSide: 'BRIDE', totalPaise: 5000000, paidPaise: 5000000, pendingPaise: 0, count: 1 },
      { payerSide: 'SHARED', totalPaise: 10000000, paidPaise: 5000000, pendingPaise: 5000000, count: 1 },
    ],
    byStatus: {
      pendingCount: 0,
      partialCount: 3,
      paidCount: 1,
    },
  };

  const mockExpense: ExpenseDTO = {
    id: 'exp1',
    weddingId: 'w1',
    title: 'Halwai Token Advance',
    amountPaise: 15000000,
    paidAmountPaise: 5000000,
    pendingAmountPaise: 10000000,
    paymentStatus: PAYMENT_STATUS.PARTIAL,
    payerSide: PAYER_SIDE.SHARED,
    currency: 'INR',
    expenseDate: '2026-10-18T10:00:00.000Z',
    category: 'CATERING',
    eventId: null,
    vendorName: 'Sharma Halwai',
    notes: 'Token given in cash',
    createdByMembershipId: 'm1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders ExpenseMetricStrip with total agreed, advance paid, and pending balance', () => {
    const html = normalizeHtml(
      renderToString(<ExpenseMetricStrip summary={mockSummary} isLoading={false} />)
    );

    expect(html).toContain('Wedding Financial Overview');
    expect(html).toContain('Total Budgeted / Agreed');
    expect(html).toContain('Advance Paid (Tokens)');
    expect(html).toContain('Pending Due Balance');
    expect(html).toContain('Payer Attribution Split');
    expect(html).toContain('Venue & Lawn');
    expect(html).toContain('Catering & Halwai');
  });

  it('renders ExpenseMetricStrip skeleton state when loading', () => {
    const html = normalizeHtml(
      renderToString(<ExpenseMetricStrip summary={null} isLoading={true} />)
    );

    expect(html).toContain('animate-pulse');
  });

  it('renders ExpenseModal in create mode', () => {
    const html = normalizeHtml(
      renderToString(
        <ExpenseModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          ceremonies={[{ id: 'c1', name: 'Haldi', type: 'HALDI' }]}
        />
      )
    );

    expect(html).toContain('Record Wedding Expense');
    expect(html).toContain('Expense Title *');
    expect(html).toContain('Expense Category *');
    expect(html).toContain('Total Agreed Cost (₹) *');
    expect(html).toContain('Payer Attribution');
    expect(html).toContain('Joint / Shared');
    expect(html).toContain("Groom's Side");
    expect(html).toContain("Bride's Side");
    expect(html).toContain('Record Expense ✨');
  });

  it('renders ExpenseModal in edit mode pre-populated with existing expense data', () => {
    const html = normalizeHtml(
      renderToString(
        <ExpenseModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          expenseToEdit={mockExpense}
          ceremonies={[]}
        />
      )
    );

    expect(html).toContain('Edit Wedding Expense');
    expect(html).toContain('Halwai Token Advance');
    expect(html).toContain('Sharma Halwai');
    expect(html).toContain('Save Changes');
  });

  it('does not render ExpenseModal when isOpen is false', () => {
    const html = renderToString(
      <ExpenseModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ceremonies={[]}
      />
    );

    expect(html).toBe('');
  });

  it('renders ExpenseLedger header, search input, and filter controls', () => {
    const html = normalizeHtml(renderToString(<ExpenseLedger />));

    expect(html).toContain('Rupee Expense Ledger');
    expect(html).toContain('Record Expense');
    expect(html).toContain('Search vendor, title, or notes...');
    expect(html).toContain('All Categories');
    expect(html).toContain('All Payment Statuses');
    expect(html).toContain('All Payers (Joint & Family)');
  });

  it('renders ExpensesPage container', () => {
    const html = normalizeHtml(renderToString(<ExpensesPage />));

    expect(html).toContain('Make My Marriage');
    expect(html).toContain('Rupee Expense Ledger');
  });
});
