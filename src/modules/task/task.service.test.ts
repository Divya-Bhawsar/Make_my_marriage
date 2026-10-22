import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { TaskService } from './task.service';
import { TaskModel } from './task.model';
import { WeddingMembershipModel } from '@/modules/wedding/membership.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { UserModel } from '@/modules/auth/user.model';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import { TASK_STATUS, TASK_PRIORITY } from '@/shared/constants';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('TaskService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockMembershipId = new mongoose.Types.ObjectId().toString();
  const mockTaskId = new mongoose.Types.ObjectId().toString();
  const mockEventId = new mongoose.Types.ObjectId().toString();

  describe('createTask', () => {
    it('creates a task successfully and returns DTO', async () => {
      const mockCreatedTask = {
        _id: new mongoose.Types.ObjectId(mockTaskId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Book Pandit ji for Shubh Vivah',
        description: 'Confirm Vedic rituals, havan samagri list, and muhurat timings',
        assignedMembershipId: null,
        assigneeName: 'Pooja Didi',
        committee: 'RITUALS_PUJA',
        eventId: null,
        dueDate: new Date('2026-10-18T10:00:00.000Z'),
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.TODO,
        completedAt: null,
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(TaskModel, 'create').mockResolvedValue(mockCreatedTask as any);

      const result = await TaskService.createTask(mockWeddingId, mockMembershipId, {
        title: 'Book Pandit ji for Shubh Vivah',
        description: 'Confirm Vedic rituals, havan samagri list, and muhurat timings',
        assigneeName: 'Pooja Didi',
        committee: 'RITUALS_PUJA',
        dueDate: '2026-10-18T10:00:00.000Z',
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.TODO,
      });

      expect(result.id).toBe(mockTaskId);
      expect(result.title).toBe('Book Pandit ji for Shubh Vivah');
      expect(result.committee).toBe('RITUALS_PUJA');
      expect(result.priority).toBe(TASK_PRIORITY.HIGH);
      expect(result.status).toBe(TASK_STATUS.TODO);
      expect(result.completedAt).toBeNull();
    });

    it('sets completedAt when created with COMPLETED status', async () => {
      const mockCreatedTask = {
        _id: new mongoose.Types.ObjectId(mockTaskId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Finalize Mehendi playlist',
        committee: 'ENTERTAINMENT_MUSIC',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.COMPLETED,
        completedAt: new Date(),
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(TaskModel, 'create').mockResolvedValue(mockCreatedTask as any);

      const result = await TaskService.createTask(mockWeddingId, mockMembershipId, {
        title: 'Finalize Mehendi playlist',
        committee: 'ENTERTAINMENT_MUSIC',
        status: TASK_STATUS.COMPLETED,
      });

      expect(result.status).toBe(TASK_STATUS.COMPLETED);
      expect(result.completedAt).not.toBeNull();
    });

    it('validates assigned membership belongs to same wedding', async () => {
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(null);

      await expect(
        TaskService.createTask(mockWeddingId, mockMembershipId, {
          title: 'Guest airport pickups',
          assignedMembershipId: mockMembershipId,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('validates event belongs to same wedding', async () => {
      vi.spyOn(WeddingEventModel, 'exists').mockResolvedValue(null as any);

      await expect(
        TaskService.createTask(mockWeddingId, mockMembershipId, {
          title: 'Stage lighting setup',
          eventId: mockEventId,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('listTasks', () => {
    it('returns paginated list of tasks', async () => {
      const mockTaskDoc = {
        _id: new mongoose.Types.ObjectId(mockTaskId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Arrange safa and pagdi tie artist',
        committee: 'ATTIRE_JEWELLERY',
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.IN_PROGRESS,
        completedAt: null,
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockTaskDoc]),
      };

      vi.spyOn(TaskModel, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(TaskModel, 'countDocuments').mockResolvedValue(1);

      const result = await TaskService.listTasks(mockWeddingId, mockMembershipId, {
        page: 1,
        limit: 10,
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Arrange safa and pagdi tie artist');
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getTaskById', () => {
    it('throws NotFoundError for non-existent task', async () => {
      vi.spyOn(TaskModel, 'findOne').mockResolvedValue(null);

      await expect(TaskService.getTaskById(mockWeddingId, mockTaskId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateTask', () => {
    it('updates status and sets completedAt when marked completed', async () => {
      const mockDoc = {
        _id: new mongoose.Types.ObjectId(mockTaskId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Taste test sangeet chaat counter',
        committee: 'CATERING_HALWAI',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.TODO,
        completedAt: null,
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(TaskModel, 'findOne').mockResolvedValue(mockDoc as any);

      const result = await TaskService.updateTask(mockWeddingId, mockTaskId, {
        status: TASK_STATUS.COMPLETED,
      });

      expect(result.status).toBe(TASK_STATUS.COMPLETED);
      expect(mockDoc.completedAt).not.toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('deletes task successfully', async () => {
      vi.spyOn(TaskModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      await expect(TaskService.deleteTask(mockWeddingId, mockTaskId)).resolves.toBeUndefined();
    });

    it('throws NotFoundError if task not found for deletion', async () => {
      vi.spyOn(TaskModel, 'deleteOne').mockResolvedValue({ deletedCount: 0 } as any);

      await expect(TaskService.deleteTask(mockWeddingId, mockTaskId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getTaskSummary', () => {
    it('aggregates task completion statistics and committee breakdown', async () => {
      vi.spyOn(TaskModel, 'aggregate')
        .mockResolvedValueOnce([
          { _id: 'TODO', count: 3 },
          { _id: 'IN_PROGRESS', count: 2 },
          { _id: 'COMPLETED', count: 5 },
        ])
        .mockResolvedValueOnce([
          { _id: 'RITUALS_PUJA', total: 4, completed: 2 },
          { _id: 'HOSPITALITY_LOGISTICS', total: 6, completed: 3 },
        ]);

      vi.spyOn(TaskModel, 'countDocuments').mockResolvedValue(2); // high priority & my pending

      const summary = await TaskService.getTaskSummary(mockWeddingId, mockMembershipId);

      expect(summary.totalTasks).toBe(10);
      expect(summary.completedTasks).toBe(5);
      expect(summary.inProgressTasks).toBe(2);
      expect(summary.todoTasks).toBe(3);
      expect(summary.completionPercentage).toBe(50);
      expect(summary.highPriorityPendingCount).toBe(2);
      expect(summary.byCommittee).toHaveLength(2);
    });
  });

  describe('listMembersForAssignment', () => {
    it('returns assignable wedding members with names', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockMembership = {
        _id: new mongoose.Types.ObjectId(mockMembershipId),
        userId: mockUserId,
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        role: 'ADMIN',
      };

      const mockUser = {
        _id: mockUserId,
        name: 'Vivek Sharma',
        email: 'vivek@example.com',
      };

      vi.spyOn(WeddingMembershipModel, 'find').mockResolvedValue([mockMembership] as any);
      vi.spyOn(UserModel, 'find').mockResolvedValue([mockUser] as any);

      const members = await TaskService.listMembersForAssignment(mockWeddingId);

      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Vivek Sharma');
      expect(members[0].role).toBe('ADMIN');
    });
  });
});
