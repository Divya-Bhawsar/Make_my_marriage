import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  TASK_STATUS,
  TaskStatus,
  TASK_PRIORITY,
  TaskPriority,
  TASK_COMMITTEES,
  TaskCommittee,
} from '@/shared/constants';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  title: string;
  description?: string | null;
  assignedMembershipId?: mongoose.Types.ObjectId | null;
  assigneeName?: string | null;
  committee: TaskCommittee;
  eventId?: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: Date | null;
  createdByMembershipId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: 'Wedding',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    assignedMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingMembership',
      default: null,
      index: true,
    },
    assigneeName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    committee: {
      type: String,
      enum: TASK_COMMITTEES,
      default: 'GENERAL',
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingEvent',
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    createdByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingMembership',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'tasks',
  }
);

// Compound indexes matching DATABASE_DESIGN.md Section 39
taskSchema.index({ weddingId: 1, status: 1 });
taskSchema.index({ weddingId: 1, dueDate: 1 });
taskSchema.index({ weddingId: 1, assignedMembershipId: 1, status: 1 });
taskSchema.index({ weddingId: 1, eventId: 1 });
taskSchema.index({ weddingId: 1, committee: 1 });

export const TaskModel: Model<ITask> =
  (mongoose.models.Task as Model<ITask>) ||
  mongoose.model<ITask>('Task', taskSchema);
