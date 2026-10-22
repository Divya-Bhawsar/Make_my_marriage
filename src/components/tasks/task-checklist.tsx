'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TaskDTO,
  TaskSummaryDTO,
  AssignableMemberDTO,
} from '@/modules/task/task.service';
import { TaskMetricStrip, COMMITTEE_META } from './task-metric-strip';
import { TaskModal } from './task-modal';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_COMMITTEES,
  TaskStatus,
  TaskPriority,
} from '@/shared/constants';

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

export function TaskChecklist() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [summary, setSummary] = useState<TaskSummaryDTO | null>(null);
  const [members, setMembers] = useState<AssignableMemberDTO[]>([]);
  const [ceremonies, setCeremonies] = useState<CeremonyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active View Filter
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_TASKS' | 'PENDING' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [ceremonyFilter, setCeremonyFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskDTO | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load summary, members, and ceremonies once
  const loadMetadata = useCallback(async () => {
    try {
      const [sumRes, memRes, cerRes] = await Promise.all([
        fetch('/api/tasks/summary'),
        fetch('/api/tasks/members'),
        fetch('/api/events'),
      ]);

      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        setSummary(sumJson.data);
      }

      if (memRes.ok) {
        const memJson = await memRes.json();
        setMembers(memJson.data || []);
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
      // Non-critical background failure
    }
  }, []);

  // Load tasks with filters
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '100');

      if (search.trim()) params.set('search', search.trim());
      if (committeeFilter !== 'ALL') params.set('committee', committeeFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (ceremonyFilter !== 'ALL') params.set('eventId', ceremonyFilter);

      if (activeTab === 'MY_TASKS') {
        params.set('myTasks', 'true');
      } else if (activeTab === 'PENDING') {
        // We'll filter on client or let server return all and filter
      } else if (activeTab === 'COMPLETED') {
        params.set('status', TASK_STATUS.COMPLETED);
      }

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load tasks');

      const json = await res.json();
      let fetchedTasks = json.data || [];

      if (activeTab === 'PENDING') {
        fetchedTasks = fetchedTasks.filter(
          (t: TaskDTO) => t.status !== TASK_STATUS.COMPLETED
        );
      }

      setTasks(fetchedTasks);
      setError('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading tasks';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, committeeFilter, priorityFilter, ceremonyFilter, activeTab]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  const handleToggleTask = async (task: TaskDTO) => {
    const nextStatus =
      task.status === TASK_STATUS.COMPLETED ? TASK_STATUS.TODO : TASK_STATUS.COMPLETED;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task status');

      loadMetadata();
    } catch {
      // Revert if failed
      loadTasks();
    }
  };

  const handleQuickPriorityChange = async (task: TaskDTO, newPriority: TaskPriority) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      loadTasks();
      loadMetadata();
    } catch {
      // Ignored
    }
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${deleteTaskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');

      setDeleteTaskId(null);
      loadTasks();
      loadMetadata();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const ceremonyMap = new Map<string, CeremonyOption>();
  ceremonies.forEach((c) => ceremonyMap.set(c.id, c));

  return (
    <div className="space-y-8">
      {/* Top Banner Metric Strip */}
      <TaskMetricStrip summary={summary} isLoading={isLoading && !summary} />

      {/* Main Checklist Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
        {/* Header & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h1 className="text-2xl font-serif font-bold text-zinc-900">
                Tasks Checklist & Family Committees
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Organize ceremonial rituals, guest logistics, and delegate wedding duties across family committees.
            </p>
          </div>

          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-crimson to-amber-800 px-5 py-3 text-xs font-serif font-bold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Assign Task</span>
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Tasks', icon: '📋' },
            { id: 'MY_TASKS', label: 'My Assigned Tasks', icon: '👤' },
            { id: 'PENDING', label: 'Pending Action', icon: '⏳' },
            { id: 'COMPLETED', label: 'Completed', icon: '✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-crimson text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-zinc-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, squad, notes..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Committee Filter */}
          <div>
            <select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 font-medium focus:border-brand-crimson focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Committees ({TASK_COMMITTEES.length})</option>
              {TASK_COMMITTEES.map((comm) => {
                const meta = COMMITTEE_META[comm];
                return (
                  <option key={comm} value={comm}>
                    {meta.icon} {meta.label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 font-medium focus:border-brand-crimson focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value={TASK_PRIORITY.HIGH}>🔴 High Priority</option>
              <option value={TASK_PRIORITY.MEDIUM}>🟡 Medium Priority</option>
              <option value={TASK_PRIORITY.LOW}>🟢 Low Priority</option>
            </select>
          </div>

          {/* Ceremony Filter */}
          <div>
            <select
              value={ceremonyFilter}
              onChange={(e) => setCeremonyFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800 font-medium focus:border-brand-crimson focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Ceremonies</option>
              {ceremonies.map((c) => (
                <option key={c.id} value={c.id}>
                  🪔 {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Task List / Checklist */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="inline-flex items-center gap-2 text-xs">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-crimson border-t-transparent" />
                <span>Loading wedding task checklist...</span>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-zinc-200">
              <div className="max-w-md mx-auto space-y-3">
                <div className="text-4xl">📝</div>
                <h3 className="font-serif font-bold text-base text-zinc-900">
                  No Wedding Tasks Found
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {search || committeeFilter !== 'ALL' || priorityFilter !== 'ALL' || ceremonyFilter !== 'ALL'
                    ? 'No tasks match your selected filter criteria. Try clearing search or filters.'
                    : 'Get started by creating your first wedding preparation task! Assign rituals, guest airport logistics, or sangeet choreographies.'}
                </p>
                <button
                  onClick={() => {
                    setTaskToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-xs font-semibold text-brand-crimson transition-colors cursor-pointer"
                >
                  <span>+</span>
                  <span>Create First Task</span>
                </button>
              </div>
            </div>
          ) : (
            tasks.map((task) => {
              const meta = COMMITTEE_META[task.committee] || COMMITTEE_META.GENERAL;
              const ceremony = task.eventId ? ceremonyMap.get(task.eventId) : null;
              const isDone = task.status === TASK_STATUS.COMPLETED;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-zinc-50/70 border-zinc-200 opacity-75'
                      : 'bg-white border-zinc-200 hover:border-brand-sand hover:shadow-xs'
                  }`}
                >
                  {/* Left: Checkbox + Title + Description */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-zinc-300 hover:border-brand-crimson bg-white'
                      }`}
                    >
                      {isDone && <span className="text-xs font-black">✓</span>}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-serif font-bold text-base transition-all ${
                            isDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            handleQuickPriorityChange(task, e.target.value as TaskPriority)
                          }
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold border cursor-pointer ${
                            task.priority === TASK_PRIORITY.HIGH
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : task.priority === TASK_PRIORITY.MEDIUM
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <option value={TASK_PRIORITY.HIGH}>🔴 High</option>
                          <option value={TASK_PRIORITY.MEDIUM}>🟡 Medium</option>
                          <option value={TASK_PRIORITY.LOW}>🟢 Low</option>
                        </select>
                      </div>

                      {task.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Badges strip */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                        {/* Committee Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>

                        {/* Assignee / Squad */}
                        {task.assigneeName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            <span>👤</span>
                            <span>{task.assigneeName}</span>
                          </span>
                        )}

                        {/* Associated Ceremony */}
                        {ceremony && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <span>🪔</span>
                            <span>{ceremony.name}</span>
                          </span>
                        )}

                        {/* Due Date */}
                        {task.dueDate && (
                          <span className="text-[10px] text-zinc-500 font-medium">
                            📅 Due {new Date(task.dueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setTaskToEdit(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteTaskId(task.id)}
                      className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 text-zinc-400 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task Modal (Add/Edit) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadTasks();
          loadMetadata();
        }}
        taskToEdit={taskToEdit}
        ceremonies={ceremonies}
        members={members}
      />

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-rose-200 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-700 text-2xl flex items-center justify-center mx-auto">
              🗑️
            </div>
            <h4 className="font-serif font-bold text-zinc-900 text-lg">
              Delete Wedding Task?
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Are you sure you want to remove this task? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTaskId(null)}
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
