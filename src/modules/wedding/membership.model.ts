import mongoose, { Schema, Document, Model } from 'mongoose';
import { USER_ROLES, UserRole } from '@/shared/constants';

export interface IWeddingMembership extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WeddingMembershipSchema = new Schema<IWeddingMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // V1 Rule: One user belongs to only one wedding
      index: true,
    },
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: 'Wedding',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'wedding_memberships',
  }
);

// Compound indexes
WeddingMembershipSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
WeddingMembershipSchema.index({ weddingId: 1, role: 1 });

export const WeddingMembershipModel: Model<IWeddingMembership> =
  mongoose.models.WeddingMembership ||
  mongoose.model<IWeddingMembership>(
    'WeddingMembership',
    WeddingMembershipSchema,
    'wedding_memberships'
  );
