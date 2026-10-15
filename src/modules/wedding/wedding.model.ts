import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWeddingLocation {
  formattedAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
}

export interface IWeddingWebsite {
  slug: string;
  theme: string;
  isPublished: boolean;
  welcomeMessage?: string | null;
}

export interface IWeddingGallery {
  tokenHash: string;
  isEnabled: boolean;
  guestUploadsEnabled: boolean;
}

export interface IWeddingLivestream {
  youtubeUrl?: string | null;
  isEnabled: boolean;
}

export interface IWedding extends Document {
  _id: mongoose.Types.ObjectId;
  brideName: string;
  groomName: string;
  title?: string | null;
  description?: string | null;
  weddingDate: string;
  timeZone: string;
  coverImageObjectKey?: string | null;
  location?: IWeddingLocation;
  website: IWeddingWebsite;
  gallery: IWeddingGallery;
  livestream: IWeddingLivestream;
  createdByUserId: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WeddingSchema = new Schema<IWedding>(
  {
    brideName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    groomName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    weddingDate: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    timeZone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
    },
    coverImageObjectKey: {
      type: String,
    },
    location: {
      formattedAddress: String,
      city: String,
      state: String,
      country: String,
      latitude: Number,
      longitude: Number,
      googlePlaceId: String,
    },
    website: {
      slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
      },
      theme: {
        type: String,
        required: true,
        default: 'CLASSIC',
      },
      isPublished: {
        type: Boolean,
        required: true,
        default: false,
      },
      welcomeMessage: String,
    },
    gallery: {
      tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      isEnabled: {
        type: Boolean,
        required: true,
        default: true,
      },
      guestUploadsEnabled: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    livestream: {
      youtubeUrl: String,
      isEnabled: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'weddings',
  }
);

export const WeddingModel: Model<IWedding> =
  mongoose.models.Wedding || mongoose.model<IWedding>('Wedding', WeddingSchema, 'weddings');
