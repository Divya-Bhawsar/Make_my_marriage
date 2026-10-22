import mongoose, { Schema, Document, Model } from 'mongoose';

export type PhotoUploaderType = 'MEMBER' | 'GUEST';
export type PhotoStatus = 'READY' | 'PENDING' | 'DELETED';

export interface IPhoto extends Document {
  _id: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId | null;
  uploaderType: PhotoUploaderType;
  uploaderName?: string | null;
  uploadedByUserId?: mongoose.Types.ObjectId | null;
  objectKey: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  status: PhotoStatus;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoDTO {
  id: string;
  weddingId: string;
  eventId: string | null;
  uploaderType: PhotoUploaderType;
  uploaderName: string | null;
  uploadedByUserId: string | null;
  objectKey: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  caption: string | null;
  status: PhotoStatus;
  createdAt: string;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: 'Wedding',
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    uploaderType: {
      type: String,
      enum: ['MEMBER', 'GUEST'],
      default: 'MEMBER',
      required: true,
    },
    uploaderName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    objectKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: null,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
      max: 10 * 1024 * 1024, // 10 MiB limit per product spec
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    status: {
      type: String,
      enum: ['READY', 'PENDING', 'DELETED'],
      default: 'READY',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'photos',
  }
);

// Compound indexes for performant cursor and album listing
PhotoSchema.index({ weddingId: 1, status: 1, createdAt: -1 });
PhotoSchema.index({ weddingId: 1, status: 1, eventId: 1, createdAt: -1 });

export function toPhotoDTO(photo: IPhoto): PhotoDTO {
  return {
    id: photo._id.toString(),
    weddingId: photo.weddingId.toString(),
    eventId: photo.eventId ? photo.eventId.toString() : null,
    uploaderType: photo.uploaderType,
    uploaderName: photo.uploaderName ?? null,
    uploadedByUserId: photo.uploadedByUserId ? photo.uploadedByUserId.toString() : null,
    objectKey: photo.objectKey,
    imageUrl: photo.imageUrl,
    thumbnailUrl: photo.thumbnailUrl ?? null,
    filename: photo.filename,
    mimeType: photo.mimeType,
    sizeBytes: photo.sizeBytes,
    width: photo.width ?? null,
    height: photo.height ?? null,
    caption: photo.caption ?? null,
    status: photo.status,
    createdAt: photo.createdAt.toISOString(),
  };
}

export const PhotoModel: Model<IPhoto> =
  mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema, 'photos');
