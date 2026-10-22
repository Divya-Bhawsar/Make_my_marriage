import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getTasks, POST as postTask } from './route';
import { GET as getSummary } from './summary/route';
import { GET as getMembers } from './members/route';
import {
  GET as getSingleTask,
  PATCH as patchTask,
  DELETE as deleteTask,
} from './[taskId]/route';
import { TaskService } from '@/modules/task/task.service';
import { USER_ROLES, TASK_STATUS, TASK_PRIORITY } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Task API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMemberContext = {
    user: { id: 'u1', name: 'Divya', email: 'divya@example.com' },
    session: {} as any,
    membership: {
      _id: 'm1' as any,
      userId: 'u1' as any,
      weddingId: 'w1' as any,
      role: USER_ROLES.ADMIN,
      joinedAt: new Date(),
    } as any,
    wedding: {
      id: 'w1',
      brideName: 'Eisha',
      groomName: 'Vivek',
      weddingDate: '2026-10-20',
      timeZone: 'Asia/Kolkata',
      website: { slug: 'eisha-vivek-20102026' },
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  const mockTaskDTO = {
    id: 't1',
    weddingId: 'w1',
    title: 'Book Pandit ji for Shubh Vivah',
    description: 'Confirm Vedic rituals and samagri list',
    assignedMembershipId: 'm1',
    assigneeName: 'Divya',
    committee: 'RITUALS_PUJA' as const,
    eventId: null,
    dueDate: '2026-10-18T10:00:00.000Z',
    priority: TASK_PRIORITY.HIGH,
    status: TASK_STATUS.TODO,
    completedAt: null,
    createdByMembershipId: 'm1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('GET /api/tasks', () => {
    it('returns 200 and list of tasks for authenticated wedding member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'listTasks').mockResolvedValue({
        tasks: [mockTaskDTO],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await getTasks(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe('Book Pandit ji for Shubh Vivah');
      expect(json.pagination.total).toBe(1);
    });
  });

  describe('POST /api/tasks', () => {
    it('returns 201 and creates new task', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'createTask').mockResolvedValue(mockTaskDTO);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Book Pandit ji for Shubh Vivah',
          description: 'Confirm Vedic rituals and samagri list',
          assigneeName: 'Divya',
          committee: 'RITUALS_PUJA',
          priority: 'HIGH',
        }),
      });

      const response = await postTask(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.title).toBe('Book Pandit ji for Shubh Vivah');
    });
  });

  describe('GET /api/tasks/summary', () => {
    it('returns 200 with aggregated task checklist metrics', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'getTaskSummary').mockResolvedValue({
        totalTasks: 10,
        completedTasks: 6,
        inProgressTasks: 2,
        todoTasks: 2,
        completionPercentage: 60,
        highPriorityPendingCount: 1,
        myPendingCount: 2,
        byCommittee: [
          { committee: 'RITUALS_PUJA', total: 4, completed: 3, pending: 1 },
          { committee: 'HOSPITALITY_LOGISTICS', total: 6, completed: 3, pending: 3 },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/tasks/summary');
      const response = await getSummary(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.totalTasks).toBe(10);
      expect(json.data.completionPercentage).toBe(60);
      expect(json.data.byCommittee).toHaveLength(2);
    });
  });

  describe('GET /api/tasks/members', () => {
    it('returns 200 with list of assignable members', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'listMembersForAssignment').mockResolvedValue([
        { id: 'm1', name: 'Divya', email: 'divya@example.com', role: 'ADMIN' },
      ]);

      const request = new NextRequest('http://localhost:3000/api/tasks/members');
      const response = await getMembers(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('Divya');
    });
  });

  describe('GET /api/tasks/[taskId]', () => {
    it('returns 200 and single task', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'getTaskById').mockResolvedValue(mockTaskDTO);

      const request = new NextRequest('http://localhost:3000/api/tasks/t1');
      const response = await getSingleTask(request, { params: { taskId: 't1' } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.id).toBe('t1');
    });
  });

  describe('PATCH /api/tasks/[taskId]', () => {
    it('returns 200 and updated task', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'updateTask').mockResolvedValue({
        ...mockTaskDTO,
        status: TASK_STATUS.COMPLETED,
        completedAt: new Date().toISOString(),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks/t1', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'COMPLETED',
        }),
      });

      const response = await patchTask(request, { params: { taskId: 't1' } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.status).toBe(TASK_STATUS.COMPLETED);
    });
  });

  describe('DELETE /api/tasks/[taskId]', () => {
    it('returns 200 and success: true', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(TaskService, 'deleteTask').mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/tasks/t1', {
        method: 'DELETE',
      });

      const response = await deleteTask(request, { params: { taskId: 't1' } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
