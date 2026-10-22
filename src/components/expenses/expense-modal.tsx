'use client';

import React, { useState, useEffect } from 'react';
import { ExpenseDTO } from '@/modules/expense/expense.service';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  PAYMENT_STATUS,
  PaymentStatus,
  PAYER_SIDE,
  PayerSide,
} from '@/shared/constants';
import { paiseToRupees, formatRupees, rupeesToPaise } from '@/shared/utils/currency';
import { CATEGORY_META } from './expense-metric-strip';

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: ExpenseDTO | null;
  ceremonies: CeremonyOption[];
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
  ceremonies,
}: ExpenseModalProps) {
  const [title, setTitle] = useState(expenseToEdit?.title || '');
  const [category, setCategory] = useState<ExpenseCategory>(expenseToEdit?.category || 'CATERING');
  const [amountRupees, setAmountRupees] = useState<string>(
    expenseToEdit ? paiseToRupees(expenseToEdit.amountPaise).toString() : ''
  );
  const [paidRupees, setPaidRupees] = useState<string>(
    expenseToEdit ? paiseToRupees(expenseToEdit.paidAmountPaise).toString() : ''
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    expenseToEdit?.paymentStatus || PAYMENT_STATUS.PARTIAL
  );
  const [payerSide, setPayerSide] = useState<PayerSide>(
    expenseToEdit?.payerSide || PAYER_SIDE.SHARED
  );
  const [eventId, setEventId] = useState<string>(expenseToEdit?.eventId || '');
  const [vendorName, setVendorName] = useState<string>(expenseToEdit?.vendorName || '');
  const [expenseDate, setExpenseDate] = useState<string>(
    expenseToEdit?.expenseDate
      ? expenseToEdit.expenseDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>(expenseToEdit?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setAmountRupees(paiseToRupees(expenseToEdit.amountPaise).toString());
      setPaidRupees(paiseToRupees(expenseToEdit.paidAmountPaise).toString());
      setPaymentStatus(expenseToEdit.paymentStatus);
      setPayerSide(expenseToEdit.payerSide);
      setEventId(expenseToEdit.eventId || '');
      setVendorName(expenseToEdit.vendorName || '');
      setExpenseDate(
        expenseToEdit.expenseDate ? expenseToEdit.expenseDate.slice(0, 10) : ''
      );
      setNotes(expenseToEdit.notes || '');
    } else {
      setTitle('');
      setCategory('CATERING');
      setAmountRupees('');
      setPaidRupees('');
      setPaymentStatus(PAYMENT_STATUS.PARTIAL);
      setPayerSide(PAYER_SIDE.SHARED);
      setEventId('');
      setVendorName('');
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
    setError('');
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const parsedTotal = parseFloat(amountRupees) || 0;
  const parsedPaid =
    paymentStatus === PAYMENT_STATUS.PAID
      ? parsedTotal
      : paymentStatus === PAYMENT_STATUS.PENDING
      ? 0
      : parseFloat(paidRupees) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide an expense title');
      return;
    }

    if (parsedTotal <= 0) {
      setError('Agreed amount must be greater than zero');
      return;
    }

    if (paymentStatus === PAYMENT_STATUS.PARTIAL && parsedPaid > parsedTotal) {
      setError('Paid token amount cannot exceed total agreed amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        category,
        amount: parsedTotal,
        paidAmount: parsedPaid,
        paymentStatus,
        payerSide,
        eventId: eventId || null,
        vendorName: vendorName.trim() || null,
        expenseDate: new Date(expenseDate || Date.now()).toISOString(),
        notes: notes.trim() || null,
      };

      const url = expenseToEdit ? `/api/expenses/${expenseToEdit.id}` : '/api/expenses';
      const method = expenseToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save expense');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving expense';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-brand-sand my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-brand-crimson flex items-center justify-center text-xl font-bold">
              ₹
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-zinc-900">
                {expenseToEdit ? 'Edit Wedding Expense' : 'Record Wedding Expense'}
              </h3>
              <p className="text-xs text-zinc-500">
                Halwai tokens, venue advances, decor milestones, and vendor contracts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Expense Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Halwai Token Advance, Mandap Floral Setup, DJ Booking"
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
            />
          </div>

          {/* Category & Ceremony Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat] || CATEGORY_META.OTHER;
                  return (
                    <option key={cat} value={cat}>
                      {meta.icon} {meta.label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Associated Ceremony
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
                <option value="">General / All Ceremonies</option>
                {ceremonies.map((ceremony) => (
                  <option key={ceremony.id} value={ceremony.id}>
                    {ceremony.name} ({ceremony.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Total Agreed Cost (₹) *
                </label>
                {parsedTotal > 0 && (
                  <span className="text-[11px] font-bold text-brand-crimson">
                    {formatRupees(rupeesToPaise(parsedTotal))}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-400 font-serif font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full rounded-xl border border-zinc-300 pl-8 pr-3 py-3 text-sm text-zinc-900 font-semibold placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 font-semibold focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
                <option value={PAYMENT_STATUS.PARTIAL}>🟡 Advance Token Paid (Partial)</option>
                <option value={PAYMENT_STATUS.PAID}>🟢 Fully Cleared / Paid</option>
                <option value={PAYMENT_STATUS.PENDING}>⚪ Estimated / Unpaid (Pending)</option>
              </select>
            </div>
          </div>

          {/* Conditional Advance Token Amount if PARTIAL */}
          {paymentStatus === PAYMENT_STATUS.PARTIAL && (
            <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  Advance Token Paid Amount (₹) *
                </label>
                {parsedPaid > 0 && (
                  <span className="text-xs font-bold text-emerald-700">
                    Paid: {formatRupees(rupeesToPaise(parsedPaid))} • Balance: {formatRupees(rupeesToPaise(Math.max(0, parsedTotal - parsedPaid)))}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-400 font-serif font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  max={parsedTotal || undefined}
                  step="any"
                  value={paidRupees}
                  onChange={(e) => setPaidRupees(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl border border-amber-300 bg-white pl-8 pr-3 py-2.5 text-sm text-zinc-900 font-semibold focus:border-brand-crimson focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Payer Attribution (Groom vs Bride vs Shared) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
              Payer Attribution (Who is funding this?)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { side: PAYER_SIDE.SHARED, label: 'Joint / Shared', icon: '🤝', activeBg: 'border-purple-600 bg-purple-50 text-purple-900' },
                { side: PAYER_SIDE.GROOM, label: "Groom's Side", icon: '🎩', activeBg: 'border-blue-600 bg-blue-50 text-blue-900' },
                { side: PAYER_SIDE.BRIDE, label: "Bride's Side", icon: '👰', activeBg: 'border-rose-600 bg-rose-50 text-rose-900' },
              ].map((item) => (
                <button
                  key={item.side}
                  type="button"
                  onClick={() => setPayerSide(item.side)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    payerSide === item.side
                      ? `${item.activeBg} shadow-2xs font-bold`
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vendor Name & Expense Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Vendor / Payee Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Sharma Caterers, Taj Palace"
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Payment / Agreement Date
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Payment Notes & Transaction Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via UPI GPay ref #123456. Remaining balance due on Oct 19."
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-crimson to-amber-800 px-5 py-2.5 text-xs font-serif font-bold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Ledger Entry...</span>
                </>
              ) : (
                <span>{expenseToEdit ? 'Save Changes' : 'Record Expense ✨'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
