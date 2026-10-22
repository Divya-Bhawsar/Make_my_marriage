import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { TaskMetricStrip } from '@/components/tasks/task-metric-strip';
import { TaskModal } from '@/components/tasks/task-modal';
import { TaskChecklist } from '@/components/tasks/task-checklist';
import TasksPage from '@/app/(dashboard)/app/tasks/page';
import { TaskSummaryDTO, TaskDTO } from '@/modules/task/task.service';
import { TASK_STATUS, TASK_PRIORITY } from '@/shared/constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/tasks',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Task UI Components', () => {
  const mockSummary: TaskSummaryDTO = {
    totalTasks: 12,
    completedTasks: 8,
    inProgressTasks: 2,
    todoTasks: 2,
    completionPercentage: 67,
    highPriorityPendingCount: 2,
    myPendingCount: 3,
    byCommittee: [
      { committee: 'RITUALS_PUJA', total: 4, completed: 3, pending: 1 },
      { committee: 'HOSPITALITY_LOGISTICS', total: 5, completed: 3, pending: 2 },
      { committee: 'ENTERTAINMENT_MUSIC', total: 3, completed: 2, pending: 1 },
    ],
  };

  const mockTask: TaskDTO = {
    id: 't1',
    weddingId: 'w1',
    title: 'Book Pandit ji for Shubh Vivah',
    description: 'Confirm Vedic rituals, havan samagri list, and muhurat timings',
    assignedMembershipId: 'm1',
    assigneeName: 'Pooja Didi',
    committee: 'RITUALS_PUJA',
    eventId: null,
    dueDate: '2026-10-18T10:00:00.000Z',
    priority: TASK_PRIORITY.HIGH,
    status: TASK_STATUS.TODO,
    completedAt: null,
    createdByMembershipId: 'm1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders TaskMetricStrip with completion rate, urgent tasks, and committee breakdown', () => {
    const html = normalizeHtml(
      renderToString(<TaskMetricStrip summary={mockSummary} isLoading={false} />)
    );

    expect(html).toContain('Wedding Preparation Progress');
    expect(html).toContain('Completion Rate');
    expect(html).toContain('67%');
    expect(html).toContain('High Priority Urgent');
    expect(html).toContain('My Assigned Duties');
    expect(html).toContain('Family Committees');
    expect(html).toContain('Rituals & Puja');
    expect(html).toContain('Hospitality & Logistics');
  });

  it('renders TaskMetricStrip skeleton when loading', () => {
    const html = normalizeHtml(
      renderToString(<TaskMetricStrip summary={null} isLoading={true} />)
    );

    expect(html).toContain('animate-pulse');
  });

  it('renders TaskModal in create mode', () => {
    const html = normalizeHtml(
      renderToString(
        <TaskModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          ceremonies={[{ id: 'c1', name: 'Sangeet', type: 'SANGEET' }]}
          members={[{ id: 'm1', name: 'Vivek', email: 'v@test.com', role: 'ADMIN' }]}
        />
      )
    );

    expect(html).toContain('Assign New Wedding Task');
    expect(html).toContain('Task Title *');
    expect(html).toContain('Family Committee Squad *');
    expect(html).toContain('Assigned Wedding Member');
    expect(html).toContain('Assignee / Committee Nickname');
    expect(html).toContain('Create Task ✨');
  });

  it('renders TaskModal in edit mode pre-populated with task data', () => {
    const html = normalizeHtml(
      renderToString(
        <TaskModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          taskToEdit={mockTask}
          ceremonies={[]}
          members={[]}
        />
      )
    );

    expect(html).toContain('Edit Wedding Task');
    expect(html).toContain('Book Pandit ji for Shubh Vivah');
    expect(html).toContain('Pooja Didi');
    expect(html).toContain('Save Changes');
  });

  it('does not render TaskModal when isOpen is false', () => {
    const html = renderToString(
      <TaskModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ceremonies={[]}
        members={[]}
      />
    );

    expect(html).toBe('');
  });

  it('renders TaskChecklist tabs, search, and committee filters', () => {
    const html = normalizeHtml(renderToString(<TaskChecklist />));

    expect(html).toContain('Tasks Checklist & Family Committees');
    expect(html).toContain('Assign Task');
    expect(html).toContain('All Tasks');
    expect(html).toContain('My Assigned Tasks');
    expect(html).toContain('Pending Action');
    expect(html).toContain('Completed');
    expect(html).toContain('Search tasks, squad, notes...');
    expect(html).toContain('All Committees');
    expect(html).toContain('All Priorities');
    expect(html).toContain('All Ceremonies');
  });

  it('renders TasksPage container', () => {
    const html = normalizeHtml(renderToString(<TasksPage />));

    expect(html).toContain('Make My Marriage');
    expect(html).toContain('Tasks Checklist & Family Committees');
  });
});
