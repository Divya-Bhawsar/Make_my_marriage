'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExpenseDTO, ExpenseSummaryDTO } from '@/modules/expense/expense.service';
import { ExpenseMetricStrip, CATEGORY_META } from './expense-metric-strip';
import { ExpenseModal } from './expense-modal';
import { formatRupees, paiseToRupees } from '@/shared/utils/currency';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_STATUS,
  PAYER_SIDE,
  ExpenseCategory,
  PaymentStatus,
  PayerSide,
} from '@/shared/constants';

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

export function ExpenseLedger() {
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryDTO | null>(null);
  const [ceremonies, setCeremonies] = useState<CeremonyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [payerFilter, setPayerFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseDTO | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch summary and ceremonies once
  const loadSummaryAndCeremonies = useCallback(async () => {
    try {
      const [sumRes, cerRes] = await Promise.all([
        fetch('/api/expenses/summary'),
        fetch('/api/events'),
      ]);

      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        setSummary(sumJson.data);
      }

      if (cerRes.ok) {
        const cerJson = await cerRes.json();
        setCeremonies(
          (cerJson.data || []).map((e: { id: string; name: string; type: string }) => ({
            id: e.id,
            name: e.name,
            type: e.type,
          }))
        );
      }
    } catch {
      // Non-critical background load error
    }
  }, []);

  // Fetch expenses list
  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '100');

      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter !== 'ALL') params.set('paymentStatus', statusFilter);
      if (payerFilter !== 'ALL') params.set('payerSide', payerFilter);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load expenses');
      }

      const json = await res.json();
      setExpenses(json.data || []);
      setError('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading expenses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, statusFilter, payerFilter]);

  useEffect(() => {
    loadSummaryAndCeremonies();
  }, [loadSummaryAndCeremonies]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadExpenses]);

  const handleCreateNew = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (expense: ExpenseDTO) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteExpenseId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteExpenseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete expense');

      setDeleteExpenseId(null);
      loadExpenses();
      loadSummaryAndCeremonies();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = async (expense: ExpenseDTO, newStatus: PaymentStatus) => {
    try {
      const payload: Record<string, unknown> = { paymentStatus: newStatus };
      if (newStatus === PAYMENT_STATUS.PAID) {
        payload.paidAmount = paiseToRupees(expense.amountPaise);
      } else if (newStatus === PAYMENT_STATUS.PENDING) {
        payload.paidAmount = 0;
      }

      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        loadExpenses();
        loadSummaryAndCeremonies();
      }
    } catch {
      // Ignored
    }
  };

  const ceremonyMap = new Map<string, CeremonyOption>();
  ceremonies.forEach((c) => ceremonyMap.set(c.id, c));

  return (
    <div className="space-y-8">
      {/* Top Banner Metric Strip */}
      <ExpenseMetricStrip summary={summary} isLoading={isLoading && !summary} />

      {/* Main Ledger Section */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
        {/* Ledger Header & Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h1 className="text-2xl font-serif font-bold text-zinc-900">
                Rupee Expense Ledger
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Record halwai tokens, venue advances, decor milestones, and vendor contracts in Indian Rupees.
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-crimson to-amber-800 px-5 py-3 text-xs font-serif font-bold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Record Expense</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-zinc-400">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor, title, or notes..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 font-medium focus:border-brand-crimson focus:bg-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Categories ({EXPENSE_CATEGORIES.length})</option>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <option key={cat} value={cat}>
                      {meta.icon} {meta.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 font-medium focus:border-brand-crimson focus:bg-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value={PAYMENT_STATUS.PARTIAL}>🟡 Advance Token Paid (Partial)</option>
                <option value={PAYMENT_STATUS.PAID}>🟢 Fully Cleared (Paid)</option>
                <option value={PAYMENT_STATUS.PENDING}>⚪ Estimated / Unpaid (Pending)</option>
              </select>
            </div>

            {/* Payer Side Filter */}
            <div>
              <select
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 font-medium focus:border-brand-crimson focus:bg-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Payers (Joint & Family)</option>
                <option value={PAYER_SIDE.SHARED}>🤝 Joint / Shared</option>
                <option value={PAYER_SIDE.GROOM}>🎩 Groom&apos;s Side</option>
                <option value={PAYER_SIDE.BRIDE}>👰 Bride&apos;s Side</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Expense Details & Vendor</th>
                <th className="py-3.5 px-4">Ceremony</th>
                <th className="py-3.5 px-4">Payer</th>
                <th className="py-3.5 px-4 text-right">Total Agreed</th>
                <th className="py-3.5 px-4 text-center">Status & Paid Token</th>
                <th className="py-3.5 px-4 text-right">Pending Balance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-crimson border-t-transparent" />
                      <span>Loading wedding expense ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 px-4">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-4xl">💰</div>
                      <h3 className="font-serif font-bold text-base text-zinc-900">
                        No Expense Entries Found
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {search || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || payerFilter !== 'ALL'
                          ? 'No expenses match the selected filters. Try resetting search or filter criteria.'
                          : 'Start tracking your wedding budget! Record halwai advance tokens, venue deposits, bridal wear, and decor payments.'}
                      </p>
                      <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-xs font-semibold text-brand-crimson transition-colors cursor-pointer"
                      >
                        <span>+</span>
                        <span>Record First Expense</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const meta = CATEGORY_META[exp.category] || CATEGORY_META.OTHER;
                  const ceremony = exp.eventId ? ceremonyMap.get(exp.eventId) : null;
                  const formattedDate = new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={exp.id} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Title, Category & Vendor */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900 text-sm">
                          {exp.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] border ${meta.bg} ${meta.text} ${meta.border}`}
                          >
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </span>

                          {exp.vendorName && (
                            <span className="text-[11px] text-zinc-600 font-medium">
                              🏢 {exp.vendorName}
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-400">
                            📅 {formattedDate}
                          </span>
                        </div>
                        {exp.notes && (
                          <div className="text-[11px] text-zinc-500 italic mt-1 line-clamp-1">
                            📝 {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Associated Ceremony */}
                      <td className="py-3.5 px-4">
                        {ceremony ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 font-semibold text-[11px]">
                            <span>🪔</span>
                            <span>{ceremony.name}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs">— General</span>
                        )}
                      </td>

                      {/* Payer Side */}
                      <td className="py-3.5 px-4">
                        {exp.payerSide === PAYER_SIDE.GROOM && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                            <span>🎩</span>
                            <span>Groom&apos;s Side</span>
                          </span>
                        )}
                        {exp.payerSide === PAYER_SIDE.BRIDE && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-[11px]">
                            <span>👰</span>
                            <span>Bride&apos;s Side</span>
                          </span>
                        )}
                        {exp.payerSide === PAYER_SIDE.SHARED && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-[11px]">
                            <span>🤝</span>
                            <span>Joint / Shared</span>
                          </span>
                        )}
                      </td>

                      {/* Total Agreed Cost */}
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-zinc-900 text-sm">
                        {formatRupees(exp.amountPaise)}
                      </td>

                      {/* Payment Status Dropdown & Paid Advance */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={exp.paymentStatus}
                          onChange={(e) =>
                            handleQuickStatusChange(exp, e.target.value as PaymentStatus)
                          }
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold border cursor-pointer ${
                            exp.paymentStatus === PAYMENT_STATUS.PAID
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : exp.paymentStatus === PAYMENT_STATUS.PARTIAL
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}
                        >
                          <option value={PAYMENT_STATUS.PARTIAL}>🟡 Advance Token Paid</option>
                          <option value={PAYMENT_STATUS.PAID}>🟢 Fully Paid</option>
                          <option value={PAYMENT_STATUS.PENDING}>⚪ Pending / Unpaid</option>
                        </select>
                        <div className="text-[11px] text-zinc-500 font-medium mt-1">
                          Paid: {formatRupees(exp.paidAmountPaise)}
                        </div>
                      </td>

                      {/* Pending Due Balance */}
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-sm">
                        {exp.pendingAmountPaise > 0 ? (
                          <span className="text-rose-700">
                            {formatRupees(exp.pendingAmountPaise)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-semibold">
                            ✓ Cleared
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteExpenseId(exp.id)}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 text-zinc-400 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadExpenses();
          loadSummaryAndCeremonies();
        }}
        expenseToEdit={expenseToEdit}
        ceremonies={ceremonies}
      />

      {/* Delete Confirmation Modal */}
      {deleteExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-rose-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-700 text-2xl flex items-center justify-center mx-auto">
              🗑️
            </div>
            <h4 className="font-serif font-bold text-zinc-900 text-lg">
              Delete Expense Entry?
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Are you sure you want to delete this expense record? This action will permanently remove it from your wedding financial ledger.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteExpenseId(null)}
                disabled={isDeleting}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
