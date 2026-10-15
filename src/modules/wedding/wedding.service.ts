import crypto from 'crypto';
import mongoose from 'mongoose';
import { WeddingModel, IWedding, IWeddingLocation } from './wedding.model';
import { WeddingMembershipModel, IWeddingMembership } from './membership.model';
import { CreateWeddingInput, UpdateWeddingInput } from './wedding.schema';
import { generateUniqueWeddingSlug } from './slug.util';
import { ConflictError, NotFoundError } from '@/shared/errors/app-error';
import { ERROR_CODES, USER_ROLES } from '@/shared/constants';
import { connectToDatabase } from '@/server/db/connection';
import { hashToken } from '../auth/auth.service';

export interface WeddingDTO {
  id: string;
  brideName: string;
  groomName: string;
  title?: string | null;
  description?: string | null;
  weddingDate: string;
  timeZone: string;
  coverImageObjectKey?: string | null;
  location?: IWeddingLocation;
  website: {
    slug: string;
    theme: string;
    isPublished: boolean;
    welcomeMessage?: string | null;
  };
  gallery: {
    isEnabled: boolean;
    guestUploadsEnabled: boolean;
  };
  livestream: {
    youtubeUrl?: string | null;
    isEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export function toWeddingDTO(wedding: IWedding): WeddingDTO {
  return {
    id: wedding._id.toString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    title: wedding.title ?? null,
    description: wedding.description ?? null,
    weddingDate: wedding.weddingDate,
    timeZone: wedding.timeZone,
    coverImageObjectKey: wedding.coverImageObjectKey ?? null,
    location: wedding.location,
    website: {
      slug: wedding.website.slug,
      theme: wedding.website.theme,
      isPublished: wedding.website.isPublished,
      welcomeMessage: wedding.website.welcomeMessage ?? null,
    },
    gallery: {
      isEnabled: wedding.gallery.isEnabled,
      guestUploadsEnabled: wedding.gallery.guestUploadsEnabled,
    },
    livestream: {
      youtubeUrl: wedding.livestream.youtubeUrl ?? null,
      isEnabled: wedding.livestream.isEnabled,
    },
    createdAt: wedding.createdAt.toISOString(),
    updatedAt: wedding.updatedAt.toISOString(),
  };
}

export class WeddingService {
  static async createWedding(
    userId: string,
    input: CreateWeddingInput
  ): Promise<{ wedding: WeddingDTO; membership: IWeddingMembership }> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Rule 1: One user can belong to only one wedding in V1
    const existingMembership = await WeddingMembershipModel.findOne({ userId: userObjectId });
    if (existingMembership) {
      throw new ConflictError(
        'You already belong to a wedding. Each user can belong to only one wedding in V1.',
        ERROR_CODES.ALREADY_HAS_WEDDING
      );
    }

    // Generate unique slug
    const slug = await generateUniqueWeddingSlug(
      input.brideName,
      input.groomName,
      input.weddingDate
    );

    // Generate gallery secret token and its SHA-256 hash
    const rawGalleryToken = crypto.randomBytes(32).toString('hex');
    const galleryTokenHash = hashToken(rawGalleryToken);

    // Create Wedding
    const wedding = await WeddingModel.create({
      brideName: input.brideName.trim(),
      groomName: input.groomName.trim(),
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
      weddingDate: input.weddingDate,
      timeZone: input.timeZone || 'Asia/Kolkata',
      location: input.location || undefined,
      website: {
        slug,
        theme: 'CLASSIC',
        isPublished: false,
        welcomeMessage: null,
      },
      gallery: {
        tokenHash: galleryTokenHash,
        isEnabled: true,
        guestUploadsEnabled: true,
      },
      livestream: {
        youtubeUrl: null,
        isEnabled: false,
      },
      createdByUserId: userObjectId,
    });

    // Create Initial Admin Membership
    try {
      const membership = await WeddingMembershipModel.create({
        userId: userObjectId,
        weddingId: wedding._id,
        role: USER_ROLES.ADMIN,
      });

      return {
        wedding: toWeddingDTO(wedding),
        membership,
      };
    } catch (membershipError) {
      // Clean up orphaned wedding if membership creation fails
      await WeddingModel.deleteOne({ _id: wedding._id });
      throw membershipError;
    }
  }

  static async getWeddingById(weddingId: string): Promise<WeddingDTO> {
    await connectToDatabase();

    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    return toWeddingDTO(wedding);
  }

  static async updateWedding(weddingId: string, input: UpdateWeddingInput): Promise<WeddingDTO> {
    await connectToDatabase();

    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    if (input.brideName !== undefined) wedding.brideName = input.brideName.trim();
    if (input.groomName !== undefined) wedding.groomName = input.groomName.trim();
    if (input.title !== undefined) wedding.title = input.title?.trim() || null;
    if (input.description !== undefined) wedding.description = input.description?.trim() || null;
    if (input.weddingDate !== undefined) wedding.weddingDate = input.weddingDate;
    if (input.timeZone !== undefined) wedding.timeZone = input.timeZone;
    if (input.location !== undefined) {
      wedding.location = input.location ?? undefined;
    }

    // Slug is immutable per system design specifications

    await wedding.save();
    return toWeddingDTO(wedding);
  }

  static async getMembershipForUser(
    userId: string
  ): Promise<{ membership: IWeddingMembership; wedding: WeddingDTO } | null> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const membership = await WeddingMembershipModel.findOne({ userId: userObjectId });

    if (!membership) {
      return null;
    }

    const wedding = await WeddingModel.findOne({
      _id: membership.weddingId,
      deletedAt: null,
    });

    if (!wedding) {
      return null;
    }

    return {
      membership,
      wedding: toWeddingDTO(wedding),
    };
  }
}
