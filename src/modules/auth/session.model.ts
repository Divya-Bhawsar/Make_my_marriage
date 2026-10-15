import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB TTL index will automatically expire documents when current time reaches expiresAt
      expires: 0,
    },
    lastUsedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'sessions',
  }
);

export const SessionModel: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema, 'sessions');
