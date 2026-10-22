import mongoose, { Schema, Document, Model } from 'mongoose';
import { USER_ROLES, UserRole } from '@/shared/constants';

export type MemberInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED';

export interface IMemberInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  email: string;
  emailNormalized: string;
  role: UserRole;
  token: string;
  tokenHash: string;
  status: MemberInvitationStatus;
  invitedByUserId: mongoose.Types.ObjectId;
  acceptedByUserId?: mongoose.Types.ObjectId | null;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberInvitationDTO {
  id: string;
  weddingId: string;
  email: string;
  role: UserRole;
  token: string;
  status: MemberInvitationStatus;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  inviteUrl: string;
  inviteLink?: string;
}

const MemberInvitationSchema = new Schema<IMemberInvitation>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: 'Wedding',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    emailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MANAGER,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED'],
      default: 'PENDING',
      required: true,
    },
    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acceptedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'wedding_member_invitations',
  }
);

// Compound indexes
MemberInvitationSchema.index({ weddingId: 1, status: 1 });
MemberInvitationSchema.index({ weddingId: 1, emailNormalized: 1, status: 1 });

export function toMemberInvitationDTO(invitation: IMemberInvitation, baseUrl?: string): MemberInvitationDTO {
  const isExpired = invitation.status === 'PENDING' && new Date() > invitation.expiresAt;
  const cleanBase = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  const inviteUrl = cleanBase
    ? `${cleanBase}/member-invitation/${invitation.token}`
    : `/member-invitation/${invitation.token}`;

  return {
    id: invitation._id.toString(),
    weddingId: invitation.weddingId.toString(),
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    isExpired,
    inviteUrl,
    inviteLink: inviteUrl,
  };
}

export const MemberInvitationModel: Model<IMemberInvitation> =
  mongoose.models.MemberInvitation ||
  mongoose.model<IMemberInvitation>(
    'MemberInvitation',
    MemberInvitationSchema,
    'wedding_member_invitations'
  );
