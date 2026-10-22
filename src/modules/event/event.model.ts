import mongoose, { Schema, Document, Model } from 'mongoose';
import { STANDARD_EVENT_TYPES, StandardEventType } from '@/shared/constants';

export interface IWeddingEvent extends Document {
  _id: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  name: string;
  type: StandardEventType;
  startsAt: Date;
  endsAt?: Date | null;
  venueName?: string | null;
  address?: string | null;
  description?: string | null;
  dressCode?: string | null;
  coverImageObjectKey?: string | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const weddingEventSchema = new Schema<IWeddingEvent>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: 'Wedding',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: STANDARD_EVENT_TYPES,
      default: 'CUSTOM',
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    venueName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    address: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    dressCode: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    coverImageObjectKey: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

// Indexes matching DATABASE_DESIGN.md Section 35
weddingEventSchema.index({ weddingId: 1, startsAt: 1 });
weddingEventSchema.index({ weddingId: 1, archivedAt: 1 });

export const WeddingEventModel: Model<IWeddingEvent> =
  (mongoose.models.WeddingEvent as Model<IWeddingEvent>) ||
  mongoose.model<IWeddingEvent>('WeddingEvent', weddingEventSchema);
