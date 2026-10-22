import { z } from 'zod';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_COMMITTEES,
  PAGINATION,
} from '@/shared/constants';

export const taskStatusSchema = z.enum([
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.COMPLETED,
]);

export const taskPrioritySchema = z.enum([
  TASK_PRIORITY.LOW,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.HIGH,
]);

export const taskCommitteeSchema = z.enum(TASK_COMMITTEES);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  assignedMembershipId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignedMembershipId format')
    .optional()
    .nullable(),
  assigneeName: z
    .string()
    .trim()
    .max(100, 'Assignee name must not exceed 100 characters')
    .optional()
    .nullable(),
  committee: taskCommitteeSchema.optional().default('GENERAL'),
  eventId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid eventId format')
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ offset: true, message: 'dueDate must be a valid ISO 8601 datetime' })
    .optional()
    .nullable(),
  priority: taskPrioritySchema.optional().default('MEDIUM'),
  status: taskStatusSchema.optional().default('TODO'),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskOutput = z.output<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  assignedMembershipId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignedMembershipId format')
    .optional()
    .nullable(),
  assigneeName: z.string().trim().max(100).optional().nullable(),
  committee: taskCommitteeSchema.optional(),
  eventId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid eventId format')
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ offset: true, message: 'dueDate must be a valid ISO 8601 datetime' })
    .optional()
    .nullable(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const queryTasksSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : PAGINATION.DEFAULT_PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = parseInt(val || '', 10);
      if (isNaN(parsed) || parsed < 1) return PAGINATION.DEFAULT_LIMIT;
      return Math.min(parsed, PAGINATION.MAX_LIMIT);
    }),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  committee: z.string().trim().optional(),
  eventId: z.string().trim().optional(),
  assignedMembershipId: z.string().trim().optional(),
  myTasks: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export type QueryTasksInput = z.infer<typeof queryTasksSchema>;

export interface QueryTasksFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  committee?: string;
  eventId?: string;
  assignedMembershipId?: string;
  myTasks?: boolean;
}
