import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  VENDOR_CATEGORIES,
  VENDOR_SOURCES,
  VendorCategory,
  VendorSource,
} from '@/shared/constants';

export interface IVendor {
  weddingId: mongoose.Types.ObjectId;
  name: string;
  category: VendorCategory;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  totalAgreedCostPaise?: number | null;
  eventIds: mongoose.Types.ObjectId[];
  notes?: string | null;
  source: VendorSource;
  googlePlaceId?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorDocument extends IVendor, Document {
  _id: mongoose.Types.ObjectId;
}

const vendorSchema = new Schema<IVendorDocument>(
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
    category: {
      type: String,
      required: true,
      enum: VENDOR_CATEGORIES,
      default: 'OTHER',
      index: true,
    },
    contactPerson: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 40,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      maxlength: 254,
    },
    address: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300,
    },
    website: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    totalAgreedCostPaise: {
      type: Number,
      default: null,
      min: 0,
      validate: {
        validator: function (val: number | null) {
          if (val === null || val === undefined) return true;
          return Number.isInteger(val);
        },
        message: '{VALUE} is not an integer value for totalAgreedCostPaise',
      },
    },
    eventIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'WeddingEvent',
      },
    ],
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    source: {
      type: String,
      required: true,
      enum: Object.values(VENDOR_SOURCES),
      default: VENDOR_SOURCES.MANUAL,
    },
    googlePlaceId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    rating: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    userRatingsTotal: {
      type: Number,
      default: null,
      min: 0,
    },
    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'vendors',
  }
);

// Compound indexes defined in Section 53 of DATABASE_DESIGN.md
vendorSchema.index({ weddingId: 1, category: 1 });
vendorSchema.index({ weddingId: 1, archivedAt: 1 });
vendorSchema.index({ weddingId: 1, googlePlaceId: 1 });

export const VendorModel: Model<IVendorDocument> =
  (mongoose.models.Vendor as Model<IVendorDocument>) ||
  mongoose.model<IVendorDocument>('Vendor', vendorSchema);
