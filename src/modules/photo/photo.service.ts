import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/server/db/connection';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { PhotoModel, PhotoDTO, toPhotoDTO } from './photo.model';
import { UpdateGallerySettingsInput, QueryPhotosInput } from './photo.schema';
import { hashToken } from '@/modules/auth/auth.service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '@/shared/errors/app-error';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB

export interface GallerySettingsDTO {
  isEnabled: boolean;
  guestUploadsEnabled: boolean;
  token: string;
  gallerySlug: string;
}

export interface PhotoListResponse {
  photos: PhotoDTO[];
  hasMore: boolean;
  nextCursor: string | null;
  metrics: {
    totalCount: number;
    guestCount: number;
    memberCount: number;
    totalSizeBytes: number;
  };
}

export interface PublicGalleryDTO {
  weddingId: string;
  brideName: string;
  groomName: string;
  title: string | null;
  weddingDate: string;
  location: string | null;
  theme: string;
  slug: string;
  guestUploadsEnabled: boolean;
  events: Array<{
    id: string;
    name: string;
    type: string;
    startsAt: string;
  }>;
}

export class PhotoService {
  /**
   * Retrieves gallery configuration for wedding organizers.
   * Auto-generates and backfills a high-entropy sharing token if absent.
   */
  static async getGallerySettings(weddingId: string): Promise<GallerySettingsDTO> {
    await connectToDatabase();

    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    let token = wedding.gallery?.token;
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      wedding.gallery.token = token;
      wedding.gallery.tokenHash = hashToken(token);
      await wedding.save();
    }

    return {
      isEnabled: wedding.gallery.isEnabled ?? true,
      guestUploadsEnabled: wedding.gallery.guestUploadsEnabled ?? true,
      token,
      gallerySlug: wedding.website.slug,
    };
  }

  /**
   * Updates gallery configuration toggles or regenerates the table QR/gallery token.
   */
  static async updateGallerySettings(
    weddingId: string,
    input: UpdateGallerySettingsInput
  ): Promise<GallerySettingsDTO> {
    await connectToDatabase();

    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    if (input.isEnabled !== undefined) {
      wedding.gallery.isEnabled = input.isEnabled;
    }
    if (input.guestUploadsEnabled !== undefined) {
      wedding.gallery.guestUploadsEnabled = input.guestUploadsEnabled;
    }
    if (input.regenerateToken) {
      const newToken = crypto.randomBytes(24).toString('hex');
      wedding.gallery.token = newToken;
      wedding.gallery.tokenHash = hashToken(newToken);
    }

    await wedding.save();

    return {
      isEnabled: wedding.gallery.isEnabled,
      guestUploadsEnabled: wedding.gallery.guestUploadsEnabled,
      token: wedding.gallery.token || wedding.gallery.tokenHash,
      gallerySlug: wedding.website.slug,
    };
  }

  /**
   * Lists photos with cursor pagination, album event filter, and gallery metrics.
   */
  static async listPhotos(
    weddingId: string,
    options: QueryPhotosInput
  ): Promise<PhotoListResponse> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

    const query: Record<string, unknown> = {
      weddingId: weddingObjectId,
      status: 'READY',
    };

    if (options.eventId) {
      query.eventId = new mongoose.Types.ObjectId(options.eventId);
    }

    if (options.cursor) {
      try {
        const cursorDate = new Date(options.cursor);
        query.createdAt = { $lt: cursorDate };
      } catch {
        // Fallback to no cursor filter if invalid
      }
    }

    const limit = Math.min(options.limit || 30, 100);

    const [photos, totalCount, guestCount, sizeAggregate] = await Promise.all([
      PhotoModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1),
      PhotoModel.countDocuments({ weddingId: weddingObjectId, status: 'READY' }),
      PhotoModel.countDocuments({
        weddingId: weddingObjectId,
        status: 'READY',
        uploaderType: 'GUEST',
      }),
      PhotoModel.aggregate([
        { $match: { weddingId: weddingObjectId, status: 'READY' } },
        { $group: { _id: null, totalBytes: { $sum: '$sizeBytes' } } },
      ]),
    ]);

    const hasMore = photos.length > limit;
    const paginatedPhotos = hasMore ? photos.slice(0, limit) : photos;
    const nextCursor =
      hasMore && paginatedPhotos.length > 0
        ? paginatedPhotos[paginatedPhotos.length - 1].createdAt.toISOString()
        : null;

    const totalSizeBytes =
      sizeAggregate.length > 0 && sizeAggregate[0].totalBytes
        ? sizeAggregate[0].totalBytes
        : 0;

    return {
      photos: paginatedPhotos.map(toPhotoDTO),
      hasMore,
      nextCursor,
      metrics: {
        totalCount,
        guestCount,
        memberCount: totalCount - guestCount,
        totalSizeBytes,
      },
    };
  }

  /**
   * Uploads and registers a wedding photo from binary buffer.
   */
  static async uploadPhoto(params: {
    weddingId: string;
    userId?: string | null;
    uploaderType: 'MEMBER' | 'GUEST';
    uploaderName?: string | null;
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
    eventId?: string | null;
    caption?: string | null;
  }): Promise<PhotoDTO> {
    await connectToDatabase();

    if (!ALLOWED_MIME_TYPES.has(params.mimeType.toLowerCase())) {
      throw new ValidationError(
        'Unsupported image type. Please upload JPEG, PNG, or WebP images.'
      );
    }

    if (params.fileBuffer.length > MAX_FILE_SIZE) {
      throw new ValidationError('File size exceeds the maximum limit of 10 MiB.');
    }

    if (params.fileBuffer.length === 0) {
      throw new ValidationError('Uploaded file cannot be empty.');
    }

    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(params.weddingId),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    let eventObjectId: mongoose.Types.ObjectId | null = null;
    if (params.eventId) {
      const event = await WeddingEventModel.findOne({
        _id: new mongoose.Types.ObjectId(params.eventId),
        weddingId: wedding._id,
        archivedAt: null,
      });
      if (!event) {
        throw new ValidationError('Selected ceremony event does not exist in this wedding.');
      }
      eventObjectId = event._id;
    }

    // Determine extension
    let ext = 'jpg';
    if (params.mimeType.includes('png')) ext = 'png';
    else if (params.mimeType.includes('webp')) ext = 'webp';
    else if (params.filename.includes('.')) {
      const parts = params.filename.split('.');
      ext = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    }

    const uniqueId = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const safeFilename = `${uniqueId}.${ext}`;
    const objectKey = `weddings/${params.weddingId}/photos/${safeFilename}`;

    // Write file to public/uploads directory for static local serving
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'weddings',
      params.weddingId,
      'photos'
    );
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFilename);
    await fs.promises.writeFile(filePath, params.fileBuffer);

    const imageUrl = `/uploads/weddings/${params.weddingId}/photos/${safeFilename}`;

    const photo = await PhotoModel.create({
      weddingId: wedding._id,
      eventId: eventObjectId,
      uploaderType: params.uploaderType,
      uploaderName: params.uploaderName?.trim() || null,
      uploadedByUserId: params.userId ? new mongoose.Types.ObjectId(params.userId) : null,
      objectKey,
      imageUrl,
      filename: params.filename.trim() || safeFilename,
      mimeType: params.mimeType,
      sizeBytes: params.fileBuffer.length,
      caption: params.caption ? params.caption.trim() : null,
      status: 'READY',
    });

    return toPhotoDTO(photo);
  }

  /**
   * Deletes a photo permanently from database and unlinks local storage file.
   */
  static async deletePhoto(weddingId: string, photoId: string): Promise<{ success: boolean; id: string }> {
    await connectToDatabase();

    const photo = await PhotoModel.findOne({
      _id: new mongoose.Types.ObjectId(photoId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
      status: { $ne: 'DELETED' },
    });

    if (!photo) {
      throw new NotFoundError('Photo not found');
    }

    photo.status = 'DELETED';
    photo.deletedAt = new Date();
    await photo.save();

    // Best-effort local file unlink
    try {
      const localFilePath = path.join(process.cwd(), 'public', photo.imageUrl);
      if (fs.existsSync(localFilePath)) {
        await fs.promises.unlink(localFilePath);
      }
    } catch {
      // Ignored for resilience
    }

    return { success: true, id: photoId };
  }

  /**
   * Resolves wedding details for public guest table QR scan & gallery browsing.
   */
  static async getPublicGalleryByToken(token: string): Promise<PublicGalleryDTO> {
    await connectToDatabase();

    const cleanToken = token.trim();
    const tokenHashValue = hashToken(cleanToken);

    const wedding = await WeddingModel.findOne({
      $or: [
        { 'gallery.token': cleanToken },
        { 'gallery.tokenHash': tokenHashValue },
        { 'gallery.tokenHash': cleanToken },
        { 'website.slug': cleanToken },
      ],
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding gallery not found or invalid link.');
    }

    if (!wedding.gallery?.isEnabled) {
      throw new ForbiddenError('This wedding photo gallery has been made private by the couple.');
    }

    const events = await WeddingEventModel.find({
      weddingId: wedding._id,
      archivedAt: null,
    }).sort({ startsAt: 1 });

    return {
      weddingId: wedding._id.toString(),
      brideName: wedding.brideName,
      groomName: wedding.groomName,
      title: wedding.title ?? null,
      weddingDate: wedding.weddingDate,
      location: wedding.location?.city || wedding.location?.formattedAddress || null,
      theme: wedding.website.theme,
      slug: wedding.website.slug,
      guestUploadsEnabled: wedding.gallery.guestUploadsEnabled ?? true,
      events: events.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        type: e.type,
        startsAt: e.startsAt.toISOString(),
      })),
    };
  }

  /**
   * Lists public photos using the guest table QR / gallery token.
   */
  static async listPublicPhotosByToken(
    token: string,
    options: QueryPhotosInput
  ): Promise<PhotoListResponse> {
    const publicGallery = await this.getPublicGalleryByToken(token);
    return this.listPhotos(publicGallery.weddingId, options);
  }

  /**
   * Allows invited guests to upload candid photos directly without creating an account.
   */
  static async uploadGuestPhoto(
    token: string,
    params: {
      fileBuffer: Buffer;
      filename: string;
      mimeType: string;
      eventId?: string | null;
      caption?: string | null;
      uploaderName?: string | null;
    }
  ): Promise<PhotoDTO> {
    const publicGallery = await this.getPublicGalleryByToken(token);

    if (!publicGallery.guestUploadsEnabled) {
      throw new ForbiddenError(
        'Guest photo contributions have been turned off by the host family.'
      );
    }

    return this.uploadPhoto({
      weddingId: publicGallery.weddingId,
      uploaderType: 'GUEST',
      uploaderName: params.uploaderName ? params.uploaderName.trim() : 'Wedding Guest',
      fileBuffer: params.fileBuffer,
      filename: params.filename,
      mimeType: params.mimeType,
      eventId: params.eventId,
      caption: params.caption,
    });
  }
}
