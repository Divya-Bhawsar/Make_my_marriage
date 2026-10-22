'use client';

import React from 'react';
import { TaskSummaryDTO } from '@/modules/task/task.service';
import { TaskCommittee } from '@/shared/constants';

interface TaskMetricStripProps {
  summary: TaskSummaryDTO | null;
  isLoading: boolean;
}

export const COMMITTEE_META: Record<
  TaskCommittee,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  RITUALS_PUJA: { label: 'Rituals & Puja', icon: '🪔', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  HOSPITALITY_LOGISTICS: { label: 'Hospitality & Logistics', icon: '🚗', bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200' },
  CATERING_HALWAI: { label: 'Catering & Halwai', icon: '🍲', bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  ATTIRE_JEWELLERY: { label: 'Attire & Jewellery', icon: '👗', bg: 'bg-fuchsia-50', text: 'text-fuchsia-900', border: 'border-fuchsia-200' },
  ENTERTAINMENT_MUSIC: { label: 'Music & Sangeet', icon: '🎵', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  DECOR_FLORAL: { label: 'Decor & Flowers', icon: '🌸', bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200' },
  INVITATIONS_GIFTS: { label: 'Cards & Shagun', icon: '💌', bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200' },
  GENERAL: { label: 'General Duties', icon: '✨', bg: 'bg-zinc-50', text: 'text-zinc-900', border: 'border-zinc-200' },
};

export function TaskMetricStrip({ summary, isLoading }: TaskMetricStripProps) {
  if (isLoading || !summary) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-200 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionPercentage,
    highPriorityPendingCount,
    myPendingCount,
    byCommittee,
  } = summary;

  return (
    <div className="rounded-3xl border-2 border-brand-sand/80 bg-white p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-serif font-bold text-zinc-900">
              Wedding Preparation Progress
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Checklist coordination across family squads, vendor tasks, and ceremonial duties
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 border border-amber-200">
          <span>🎯</span>
          <span>
            {completedTasks} of {totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'} Completed ({completionPercentage}%)
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Completion Rate */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Completion Rate
            </span>
            <span className="text-lg">✅</span>
          </div>
          <div className="text-3xl font-extrabold font-serif text-emerald-700">
            {completionPercentage}%
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
              <span>{completedTasks} Done</span>
              <span>{todoTasks + inProgressTasks} Remaining</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: High Priority Pending */}
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              High Priority Urgent
            </span>
            <span className="text-lg">🔥</span>
          </div>
          <div className="text-3xl font-extrabold font-serif text-rose-700">
            {highPriorityPendingCount}
          </div>
          <div className="text-[11px] text-rose-700 font-medium pt-1">
            {highPriorityPendingCount > 0
              ? 'Critical duties requiring immediate family action'
              : 'All urgent tasks cleared! ✨'}
          </div>
        </div>

        {/* Card 3: My Assigned Tasks */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              My Assigned Duties
            </span>
            <span className="text-lg">👤</span>
          </div>
          <div className="text-3xl font-extrabold font-serif text-blue-700">
            {myPendingCount}
          </div>
          <div className="text-[11px] text-blue-600 font-medium pt-1">
            {myPendingCount > 0
              ? 'Pending tasks delegated to you'
              : 'No pending tasks assigned to you'}
          </div>
        </div>

        {/* Card 4: Active Family Committees */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Family Committees
            </span>
            <span className="text-lg">🏛️</span>
          </div>
          <div className="text-3xl font-extrabold font-serif text-amber-800">
            {byCommittee.length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium pt-1">
            Active committee squads coordinating
          </div>
        </div>
      </div>

      {/* Committee Progress Pills */}
      {byCommittee.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
            <span>Family Committee Breakdown</span>
            <span className="text-zinc-500 font-normal">
              {byCommittee.length} active {byCommittee.length === 1 ? 'squad' : 'squads'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {byCommittee.map((comm) => {
              const meta = COMMITTEE_META[comm.committee] || COMMITTEE_META.GENERAL;
              return (
                <div
                  key={comm.committee}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}:</span>
                  <span className="font-bold">
                    {comm.completed}/{comm.total} Done
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
