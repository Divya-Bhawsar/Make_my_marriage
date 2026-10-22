import mongoose from 'mongoose';
import { TaskModel, ITask } from './task.model';
import { CreateTaskInput, UpdateTaskInput, QueryTasksFilter } from './task.schema';
import { WeddingMembershipModel } from '@/modules/wedding/membership.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { UserModel } from '@/modules/auth/user.model';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import {
  TASK_STATUS,
  TaskStatus,
  TASK_PRIORITY,
  TaskPriority,
  TASK_COMMITTEES,
  TaskCommittee,
  PAGINATION,
} from '@/shared/constants';
import { connectToDatabase } from '@/server/db/connection';

export interface TaskDTO {
  id: string;
  weddingId: string;
  title: string;
  description?: string | null;
  assignedMembershipId?: string | null;
  assigneeName?: string | null;
  committee: TaskCommittee;
  eventId?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string | null;
  createdByMembershipId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommitteeSummary {
  committee: TaskCommittee;
  total: number;
  completed: number;
  pending: number;
}

export interface TaskSummaryDTO {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionPercentage: number;
  highPriorityPendingCount: number;
  myPendingCount: number;
  byCommittee: CommitteeSummary[];
}

export interface AssignableMemberDTO {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function toTaskDTO(task: ITask): TaskDTO {
  return {
    id: task._id.toString(),
    weddingId: task.weddingId.toString(),
    title: task.title,
    description: task.description ?? null,
    assignedMembershipId: task.assignedMembershipId ? task.assignedMembershipId.toString() : null,
    assigneeName: task.assigneeName ?? null,
    committee: task.committee,
    eventId: task.eventId ? task.eventId.toString() : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    status: task.status,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdByMembershipId: task.createdByMembershipId.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export class TaskService {
  static async listTasks(
    weddingId: string,
    currentMembershipId?: string,
    query?: QueryTasksFilter
  ): Promise<{
    tasks: TaskDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const filter: Record<string, unknown> = { weddingId: weddingObjectId };

    if (query?.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { assigneeName: searchRegex },
      ];
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.priority) {
      filter.priority = query.priority;
    }

    if (query?.committee) {
      filter.committee = query.committee;
    }

    if (query?.eventId && mongoose.Types.ObjectId.isValid(query.eventId)) {
      filter.eventId = new mongoose.Types.ObjectId(query.eventId);
    }

    if (query?.myTasks && currentMembershipId && mongoose.Types.ObjectId.isValid(currentMembershipId)) {
      filter.assignedMembershipId = new mongoose.Types.ObjectId(currentMembershipId);
    } else if (query?.assignedMembershipId && mongoose.Types.ObjectId.isValid(query.assignedMembershipId)) {
      filter.assignedMembershipId = new mongoose.Types.ObjectId(query.assignedMembershipId);
    }

    const page = query?.page || PAGINATION.DEFAULT_PAGE;
    const limit = query?.limit || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      TaskModel.find(filter)
        .sort({ status: -1, dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TaskModel.countDocuments(filter),
    ]);

    return {
      tasks: tasks.map(toTaskDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createTask(
    weddingId: string,
    createdByMembershipId: string,
    input: CreateTaskInput
  ): Promise<TaskDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const creatorObjectId = new mongoose.Types.ObjectId(createdByMembershipId);

    let assignedMembershipObjectId: mongoose.Types.ObjectId | null = null;
    let resolvedAssigneeName = input.assigneeName?.trim() || null;

    if (input.assignedMembershipId) {
      if (!mongoose.Types.ObjectId.isValid(input.assignedMembershipId)) {
        throw new ValidationError('Invalid assignedMembershipId format');
      }
      assignedMembershipObjectId = new mongoose.Types.ObjectId(input.assignedMembershipId);
      // Integrity check per DATABASE_DESIGN.md Section 38
      const membership = await WeddingMembershipModel.findOne({
        _id: assignedMembershipObjectId,
        weddingId: weddingObjectId,
      });
      if (!membership) {
        throw new ValidationError('Assigned member does not belong to this wedding');
      }

      // If assigneeName wasn't manually specified, resolve member's user name
      if (!resolvedAssigneeName) {
        const user = await UserModel.findById(membership.userId);
        if (user) {
          resolvedAssigneeName = user.name;
        }
      }
    }

    let eventObjectId: mongoose.Types.ObjectId | null = null;
    if (input.eventId) {
      if (!mongoose.Types.ObjectId.isValid(input.eventId)) {
        throw new ValidationError('Invalid eventId format');
      }
      eventObjectId = new mongoose.Types.ObjectId(input.eventId);
      // Integrity check per DATABASE_DESIGN.md Section 38
      const eventExists = await WeddingEventModel.exists({
        _id: eventObjectId,
        weddingId: weddingObjectId,
      });
      if (!eventExists) {
        throw new ValidationError('Associated ceremony does not belong to this wedding');
      }
    }

    const dueDate = input.dueDate ? new Date(input.dueDate) : null;
    const completedAt = input.status === TASK_STATUS.COMPLETED ? new Date() : null;

    const task = await TaskModel.create({
      weddingId: weddingObjectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assignedMembershipId: assignedMembershipObjectId,
      assigneeName: resolvedAssigneeName,
      committee: input.committee || 'GENERAL',
      eventId: eventObjectId,
      dueDate,
      priority: input.priority || TASK_PRIORITY.MEDIUM,
      status: input.status || TASK_STATUS.TODO,
      completedAt,
      createdByMembershipId: creatorObjectId,
    });

    return toTaskDTO(task);
  }

  static async getTaskById(weddingId: string, taskId: string): Promise<TaskDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new NotFoundError('Task not found');
    }

    const task = await TaskModel.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return toTaskDTO(task);
  }

  static async updateTask(
    weddingId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new NotFoundError('Task not found');
    }

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const task = await TaskModel.findOne({
      _id: taskObjectId,
      weddingId: weddingObjectId,
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (input.assignedMembershipId !== undefined) {
      if (input.assignedMembershipId === null) {
        task.assignedMembershipId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(input.assignedMembershipId)) {
          throw new ValidationError('Invalid assignedMembershipId format');
        }
        const memberObjectId = new mongoose.Types.ObjectId(input.assignedMembershipId);
        const membership = await WeddingMembershipModel.findOne({
          _id: memberObjectId,
          weddingId: weddingObjectId,
        });
        if (!membership) {
          throw new ValidationError('Assigned member does not belong to this wedding');
        }
        task.assignedMembershipId = memberObjectId;

        if (!input.assigneeName) {
          const user = await UserModel.findById(membership.userId);
          if (user) {
            task.assigneeName = user.name;
          }
        }
      }
    }

    if (input.eventId !== undefined) {
      if (input.eventId === null) {
        task.eventId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(input.eventId)) {
          throw new ValidationError('Invalid eventId format');
        }
        const eventObjectId = new mongoose.Types.ObjectId(input.eventId);
        const eventExists = await WeddingEventModel.exists({
          _id: eventObjectId,
          weddingId: weddingObjectId,
        });
        if (!eventExists) {
          throw new ValidationError('Associated ceremony does not belong to this wedding');
        }
        task.eventId = eventObjectId;
      }
    }

    if (input.title !== undefined) task.title = input.title.trim();
    if (input.description !== undefined) {
      task.description = input.description ? input.description.trim() : null;
    }
    if (input.assigneeName !== undefined) {
      task.assigneeName = input.assigneeName ? input.assigneeName.trim() : null;
    }
    if (input.committee !== undefined) task.committee = input.committee;
    if (input.dueDate !== undefined) {
      task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.priority !== undefined) task.priority = input.priority;

    if (input.status !== undefined) {
      task.status = input.status;
      if (input.status === TASK_STATUS.COMPLETED) {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }

    await task.save();
    return toTaskDTO(task);
  }

  static async deleteTask(weddingId: string, taskId: string): Promise<void> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new NotFoundError('Task not found');
    }

    const result = await TaskModel.deleteOne({
      _id: new mongoose.Types.ObjectId(taskId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Task not found');
    }
  }

  static async getTaskSummary(
    weddingId: string,
    currentMembershipId?: string
  ): Promise<TaskSummaryDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

    const [statusAggregate, committeeAggregate, highPriorityCount, myPendingCount] =
      await Promise.all([
        // Group by status
        TaskModel.aggregate([
          { $match: { weddingId: weddingObjectId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // Group by committee
        TaskModel.aggregate([
          { $match: { weddingId: weddingObjectId } },
          {
            $group: {
              _id: '$committee',
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', TASK_STATUS.COMPLETED] }, 1, 0] },
              },
            },
          },
        ]),

        // High priority pending
        TaskModel.countDocuments({
          weddingId: weddingObjectId,
          priority: TASK_PRIORITY.HIGH,
          status: { $ne: TASK_STATUS.COMPLETED },
        }),

        // My pending tasks
        currentMembershipId && mongoose.Types.ObjectId.isValid(currentMembershipId)
          ? TaskModel.countDocuments({
              weddingId: weddingObjectId,
              assignedMembershipId: new mongoose.Types.ObjectId(currentMembershipId),
              status: { $ne: TASK_STATUS.COMPLETED },
            })
          : Promise.resolve(0),
      ]);

    const statusMap = new Map<string, number>();
    statusAggregate.forEach((s) => statusMap.set(s._id, s.count));

    const todoTasks = statusMap.get(TASK_STATUS.TODO) || 0;
    const inProgressTasks = statusMap.get(TASK_STATUS.IN_PROGRESS) || 0;
    const completedTasks = statusMap.get(TASK_STATUS.COMPLETED) || 0;
    const totalTasks = todoTasks + inProgressTasks + completedTasks;

    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const commMap = new Map<string, { total: number; completed: number }>();
    committeeAggregate.forEach((c) =>
      commMap.set(c._id, { total: c.total, completed: c.completed })
    );

    const byCommittee: CommitteeSummary[] = TASK_COMMITTEES.map((comm) => {
      const data = commMap.get(comm) || { total: 0, completed: 0 };
      return {
        committee: comm,
        total: data.total,
        completed: data.completed,
        pending: Math.max(0, data.total - data.completed),
      };
    }).filter((c) => c.total > 0);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionPercentage,
      highPriorityPendingCount: highPriorityCount,
      myPendingCount,
      byCommittee,
    };
  }

  static async listMembersForAssignment(weddingId: string): Promise<AssignableMemberDTO[]> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const memberships = await WeddingMembershipModel.find({ weddingId: weddingObjectId });

    const userIds = memberships.map((m) => m.userId);
    const users = await UserModel.find({ _id: { $in: userIds } });
    const userMap = new Map<string, { name: string; email: string }>();
    users.forEach((u) => userMap.set(u._id.toString(), { name: u.name, email: u.email }));

    return memberships.map((m) => {
      const user = userMap.get(m.userId.toString());
      return {
        id: m._id.toString(),
        name: user?.name || 'Wedding Organizer',
        email: user?.email || '',
        role: m.role,
      };
    });
  }
}
