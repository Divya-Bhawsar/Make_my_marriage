import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { TaskChecklist } from '@/components/tasks/task-checklist';

export const metadata: Metadata = {
  title: 'Tasks Checklist & Family Committees | Make My Marriage',
  description:
    'Coordinate ceremonial duties, delegate responsibilities across family squads, and track Indian wedding preparations.',
};

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskChecklist />
      </main>
    </div>
  );
}
