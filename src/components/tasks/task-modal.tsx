'use client';

import React, { useState, useEffect } from 'react';
import { TaskDTO, AssignableMemberDTO } from '@/modules/task/task.service';
import {
  TASK_STATUS,
  TaskStatus,
  TASK_PRIORITY,
  TaskPriority,
  TASK_COMMITTEES,
  TaskCommittee,
} from '@/shared/constants';
import { COMMITTEE_META } from './task-metric-strip';

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: TaskDTO | null;
  ceremonies: CeremonyOption[];
  members: AssignableMemberDTO[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  ceremonies,
  members,
}: TaskModalProps) {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [committee, setCommittee] = useState<TaskCommittee>(taskToEdit?.committee || 'GENERAL');
  const [assignedMembershipId, setAssignedMembershipId] = useState(
    taskToEdit?.assignedMembershipId || ''
  );
  const [assigneeName, setAssigneeName] = useState(taskToEdit?.assigneeName || '');
  const [eventId, setEventId] = useState(taskToEdit?.eventId || '');
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate ? taskToEdit.dueDate.slice(0, 10) : ''
  );
  const [priority, setPriority] = useState<TaskPriority>(
    taskToEdit?.priority || TASK_PRIORITY.MEDIUM
  );
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || TASK_STATUS.TODO);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCommittee(taskToEdit.committee);
      setAssignedMembershipId(taskToEdit.assignedMembershipId || '');
      setAssigneeName(taskToEdit.assigneeName || '');
      setEventId(taskToEdit.eventId || '');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 10) : '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
    } else {
      setTitle('');
      setDescription('');
      setCommittee('GENERAL');
      setAssignedMembershipId('');
      setAssigneeName('');
      setEventId('');
      setDueDate('');
      setPriority(TASK_PRIORITY.MEDIUM);
      setStatus(TASK_STATUS.TODO);
    }
    setError('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        committee,
        assignedMembershipId: assignedMembershipId || null,
        assigneeName: assigneeName.trim() || null,
        eventId: eventId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        status,
      };

      const url = taskToEdit ? `/api/tasks/${taskToEdit.id}` : '/api/tasks';
      const method = taskToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save task');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberChange = (memberId: string) => {
    setAssignedMembershipId(memberId);
    if (!assigneeName) {
      const member = members.find((m) => m.id === memberId);
      if (member) setAssigneeName(member.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-brand-sand my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl font-bold">
              📋
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-zinc-900">
                {taskToEdit ? 'Edit Wedding Task' : 'Assign New Wedding Task'}
              </h3>
              <p className="text-xs text-zinc-500">
                Delegate duties to family committee squads, assignees, and ceremonies
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
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Book Vedic Pandit ji, Assemble Welcome Hampers, Book DJ"
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Description & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specific items to check, instructions, or vendor contacts..."
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden resize-none"
            />
          </div>

          {/* Committee & Ceremony */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Family Committee Squad *
              </label>
              <select
                value={committee}
                onChange={(e) => setCommittee(e.target.value as TaskCommittee)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
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

          {/* Assignment: Member & Family Squad Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Assigned Wedding Member
              </label>
              <select
                value={assignedMembershipId}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
                <option value="">Unassigned (General Family)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    👤 {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Assignee / Committee Nickname
              </label>
              <input
                type="text"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="e.g. Pooja Didi, Mama ji Squad, Cousin Crew"
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
              />
            </div>
          </div>

          {/* Due Date, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 font-semibold focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
                <option value={TASK_PRIORITY.HIGH}>🔴 High (Urgent)</option>
                <option value={TASK_PRIORITY.MEDIUM}>🟡 Medium (Standard)</option>
                <option value={TASK_PRIORITY.LOW}>🟢 Low (Flexible)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 font-semibold focus:border-brand-crimson focus:outline-hidden cursor-pointer"
              >
                <option value={TASK_STATUS.TODO}>⚪ To Do</option>
                <option value={TASK_STATUS.IN_PROGRESS}>🟡 In Progress</option>
                <option value={TASK_STATUS.COMPLETED}>🟢 Completed</option>
              </select>
            </div>
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
                  <span>Saving Task...</span>
                </>
              ) : (
                <span>{taskToEdit ? 'Save Changes' : 'Create Task ✨'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
