import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { ExpenseLedger } from '@/components/expenses/expense-ledger';

export const metadata: Metadata = {
  title: 'Rupee Expense Ledger | Make My Marriage',
  description:
    'Track halwai advance tokens, venue deposits, decor milestones, and multi-family split budgets in Indian Rupees.',
};

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseLedger />
      </main>
    </div>
  );
}
