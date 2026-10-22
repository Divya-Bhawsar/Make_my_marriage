import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  GUEST_SIDE,
  GuestSide,
  DIETARY_PREFERENCE,
  DietaryPreference,
  RSVP_STATUS,
  RsvpStatus,
} from '@/shared/constants';

export interface IGuest extends Document {
  _id: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  name: string;
  email?: string | null;
  emailNormalized?: string | null;
  phone?: string | null;
  side: GuestSide;
  dietary: DietaryPreference;
  maxGuests: number;
  invitedEventIds: mongoose.Types.ObjectId[];
  invitationToken: string;
  rsvpStatus: RsvpStatus;
  attendingCount?: number | null;
  rsvpUpdatedAt?: Date | null;
  wishes?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>(
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
      maxlength: 120,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      maxlength: 254,
    },
    emailNormalized: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 40,
    },
    side: {
      type: String,
      enum: Object.values(GUEST_SIDE),
      default: GUEST_SIDE.GROOM,
    },
    dietary: {
      type: String,
      enum: Object.values(DIETARY_PREFERENCE),
      default: DIETARY_PREFERENCE.ALL,
    },
    maxGuests: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 10000,
    },
    invitedEventIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'WeddingEvent',
      },
    ],
    invitationToken: {
      type: String,
      required: true,
      unique: true,
    },
    rsvpStatus: {
      type: String,
      enum: Object.values(RSVP_STATUS),
      default: RSVP_STATUS.PENDING,
    },
    attendingCount: {
      type: Number,
      default: null,
    },
    rsvpUpdatedAt: {
      type: Date,
      default: null,
    },
    wishes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    collection: 'guests',
  }
);

// Indexes matching DATABASE_DESIGN.md Section 47
guestSchema.index({ weddingId: 1, rsvpStatus: 1 });
guestSchema.index({ weddingId: 1, side: 1 });
guestSchema.index({ weddingId: 1, name: 1 });

export const GuestModel: Model<IGuest> =
  (mongoose.models.Guest as Model<IGuest>) ||
  mongoose.model<IGuest>('Guest', guestSchema);
