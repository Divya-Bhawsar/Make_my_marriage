import crypto from 'crypto';
import mongoose from 'mongoose';
import { WeddingModel, IWedding, IWeddingLocation } from './wedding.model';
import { WeddingMembershipModel, IWeddingMembership } from './membership.model';
import {
  CreateWeddingInput,
  UpdateWeddingInput,
  UpdateWebsiteInput,
  UpdateLivestreamInput,
} from './wedding.schema';
import { WeddingEventModel } from '@/modules/event/event.model';
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
        token: rawGalleryToken,
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

  static async getWebsiteSettings(weddingId: string) {
    await connectToDatabase();
    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });
    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }
    return {
      slug: wedding.website.slug,
      theme: wedding.website.theme,
      isPublished: wedding.website.isPublished,
      welcomeMessage: wedding.website.welcomeMessage ?? null,
    };
  }

  static async updateWebsiteSettings(weddingId: string, input: UpdateWebsiteInput) {
    await connectToDatabase();
    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });
    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }
    if (input.theme !== undefined) wedding.website.theme = input.theme;
    if (input.welcomeMessage !== undefined) {
      wedding.website.welcomeMessage = input.welcomeMessage ? input.welcomeMessage.trim() : null;
    }
    if (input.isPublished !== undefined) wedding.website.isPublished = input.isPublished;

    await wedding.save();
    return {
      slug: wedding.website.slug,
      theme: wedding.website.theme,
      isPublished: wedding.website.isPublished,
      welcomeMessage: wedding.website.welcomeMessage ?? null,
    };
  }

  static async getLivestreamSettings(weddingId: string) {
    await connectToDatabase();
    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });
    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    const rawYt = wedding.livestream?.youtubeUrl ?? null;
    const rawMeet = wedding.livestream?.meetingUrl ?? null;
    const isMeet =
      wedding.livestream?.provider === 'GOOGLE_MEET' ||
      Boolean(rawMeet && rawMeet.includes('meet.google.com')) ||
      Boolean(rawYt && rawYt.includes('meet.google.com'));

    const provider: 'YOUTUBE' | 'GOOGLE_MEET' = isMeet ? 'GOOGLE_MEET' : 'YOUTUBE';
    const meetingUrl = rawMeet || (rawYt && rawYt.includes('meet.google.com') ? rawYt : null);
    const youtubeUrl = rawYt && !rawYt.includes('meet.google.com') ? rawYt : null;

    return {
      provider,
      youtubeUrl,
      meetingUrl,
      instructions: wedding.livestream?.instructions ?? null,
      scheduledStartTime: wedding.livestream?.scheduledStartTime ?? null,
      isEnabled: wedding.livestream?.isEnabled ?? false,
    };
  }

  static async updateLivestreamSettings(weddingId: string, input: UpdateLivestreamInput) {
    await connectToDatabase();
    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });
    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }
    if (!wedding.livestream) {
      wedding.livestream = { isEnabled: false } as any;
    }

    let provider = input.provider || wedding.livestream.provider || 'YOUTUBE';
    let youtubeUrl =
      input.youtubeUrl !== undefined
        ? input.youtubeUrl
          ? input.youtubeUrl.trim()
          : null
        : wedding.livestream.youtubeUrl ?? null;
    let meetingUrl =
      input.meetingUrl !== undefined
        ? input.meetingUrl
          ? input.meetingUrl.trim()
          : null
        : wedding.livestream.meetingUrl ?? null;

    // Auto-route URLs if pasted in the other field
    if (youtubeUrl && youtubeUrl.includes('meet.google.com')) {
      meetingUrl = youtubeUrl;
      youtubeUrl = null;
      provider = 'GOOGLE_MEET';
    } else if (meetingUrl && (meetingUrl.includes('youtube.com') || meetingUrl.includes('youtu.be'))) {
      youtubeUrl = meetingUrl;
      meetingUrl = null;
      provider = 'YOUTUBE';
    } else if (provider === 'GOOGLE_MEET' && !meetingUrl && youtubeUrl) {
      meetingUrl = youtubeUrl;
      youtubeUrl = null;
    }

    wedding.livestream.provider = provider as any;
    wedding.livestream.youtubeUrl = youtubeUrl;
    wedding.livestream.meetingUrl = meetingUrl;

    if (input.instructions !== undefined) {
      wedding.livestream.instructions = input.instructions ? input.instructions.trim() : null;
    }
    if (input.scheduledStartTime !== undefined) {
      wedding.livestream.scheduledStartTime = input.scheduledStartTime
        ? input.scheduledStartTime.trim()
        : null;
    }
    if (input.isEnabled !== undefined) {
      wedding.livestream.isEnabled = input.isEnabled;
    }

    await wedding.save();
    return {
      provider: (wedding.livestream?.provider as 'YOUTUBE' | 'GOOGLE_MEET') || 'YOUTUBE',
      youtubeUrl: wedding.livestream?.youtubeUrl ?? null,
      meetingUrl: wedding.livestream?.meetingUrl ?? null,
      instructions: wedding.livestream?.instructions ?? null,
      scheduledStartTime: wedding.livestream?.scheduledStartTime ?? null,
      isEnabled: wedding.livestream?.isEnabled ?? false,
    };
  }

  static async getPublicWeddingBySlug(
    slug: string,
    options?: { allowUnpublished?: boolean }
  ): Promise<PublicWeddingDTO> {
    await connectToDatabase();
    const wedding = await WeddingModel.findOne({
      'website.slug': slug.toLowerCase().trim(),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding website not found');
    }

    if (!wedding.website.isPublished && !options?.allowUnpublished) {
      throw new NotFoundError('Wedding website not found');
    }

    const events = await WeddingEventModel.find({
      weddingId: wedding._id,
      archivedAt: null,
    }).sort({ startsAt: 1 });

    const rawYt = wedding.livestream?.youtubeUrl ?? null;
    const rawMeet = wedding.livestream?.meetingUrl ?? null;
    const isMeet =
      wedding.livestream?.provider === 'GOOGLE_MEET' ||
      Boolean(rawMeet && rawMeet.includes('meet.google.com')) ||
      Boolean(rawYt && rawYt.includes('meet.google.com'));

    const livestreamProvider: 'YOUTUBE' | 'GOOGLE_MEET' = isMeet ? 'GOOGLE_MEET' : 'YOUTUBE';
    const effectiveMeetingUrl =
      rawMeet || (rawYt && rawYt.includes('meet.google.com') ? rawYt : null);
    const effectiveYoutubeUrl =
      rawYt && !rawYt.includes('meet.google.com') ? rawYt : null;

    return {
      brideName: wedding.brideName,
      groomName: wedding.groomName,
      title: wedding.title ?? null,
      description: wedding.description ?? null,
      weddingDate: wedding.weddingDate,
      timeZone: wedding.timeZone,
      location: wedding.location
        ? {
            formattedAddress: wedding.location.formattedAddress ?? null,
            city: wedding.location.city ?? null,
            state: wedding.location.state ?? null,
            country: wedding.location.country ?? null,
            latitude: wedding.location.latitude ?? null,
            longitude: wedding.location.longitude ?? null,
            googlePlaceId: wedding.location.googlePlaceId ?? null,
          }
        : null,
      coverImageObjectKey: wedding.coverImageObjectKey ?? null,
      theme: wedding.website.theme,
      isPublished: wedding.website.isPublished,
      welcomeMessage: wedding.website.welcomeMessage ?? null,
      slug: wedding.website.slug,
      events: events.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        type: e.type,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt ? e.endsAt.toISOString() : null,
        venueName: e.venueName ?? null,
        address: e.address ?? null,
        dressCode: e.dressCode ?? null,
        description: e.description ?? null,
      })),
      gallery: {
        isEnabled: wedding.gallery?.isEnabled ?? false,
      },
      livestream: {
        provider: livestreamProvider,
        youtubeUrl: effectiveYoutubeUrl,
        meetingUrl: effectiveMeetingUrl,
        instructions: wedding.livestream?.instructions ?? null,
        scheduledStartTime: wedding.livestream?.scheduledStartTime ?? null,
        isEnabled: wedding.livestream?.isEnabled ?? false,
      },
    };
  }
}

export interface PublicWeddingCeremonyDTO {
  id: string;
  name: string;
  type: string;
  startsAt: string;
  endsAt?: string | null;
  venueName?: string | null;
  address?: string | null;
  dressCode?: string | null;
  description?: string | null;
}

export interface PublicWeddingDTO {
  brideName: string;
  groomName: string;
  title: string | null;
  description: string | null;
  weddingDate: string;
  timeZone: string;
  location?: IWeddingLocation | null;
  coverImageObjectKey?: string | null;
  theme: string;
  isPublished: boolean;
  welcomeMessage: string | null;
  slug: string;
  events: PublicWeddingCeremonyDTO[];
  gallery: {
    isEnabled: boolean;
  };
  livestream: {
    provider?: 'YOUTUBE' | 'GOOGLE_MEET' | string;
    youtubeUrl?: string | null;
    meetingUrl?: string | null;
    instructions?: string | null;
    scheduledStartTime?: string | null;
    isEnabled: boolean;
  };
}
