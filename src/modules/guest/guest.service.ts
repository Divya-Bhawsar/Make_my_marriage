import crypto from 'crypto';
import mongoose from 'mongoose';
import { GuestModel, IGuest } from './guest.model';
import { CreateGuestInput, UpdateGuestInput, QueryGuestsInput, SubmitRsvpInput } from './guest.schema';
import { WeddingModel } from '../wedding/wedding.model';
import { WeddingEventModel } from '../event/event.model';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import { GuestSide, DietaryPreference, RsvpStatus, RSVP_STATUS, PAGINATION } from '@/shared/constants';
import { connectToDatabase } from '@/server/db/connection';
import { env } from '@/env';

export interface GuestDTO {
  id: string;
  weddingId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  side: GuestSide;
  dietary: DietaryPreference;
  maxGuests: number;
  invitedEventIds: string[];
  invitationToken: string;
  rsvpStatus: RsvpStatus;
  attendingCount?: number | null;
  rsvpUpdatedAt?: string | null;
  wishes?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toGuestDTO(guest: IGuest): GuestDTO {
  return {
    id: guest._id.toString(),
    weddingId: guest.weddingId.toString(),
    name: guest.name,
    email: guest.email ?? null,
    phone: guest.phone ?? null,
    side: guest.side,
    dietary: guest.dietary,
    maxGuests: guest.maxGuests,
    invitedEventIds: guest.invitedEventIds?.map((id) => id.toString()) || [],
    invitationToken: guest.invitationToken,
    rsvpStatus: guest.rsvpStatus,
    attendingCount: guest.attendingCount ?? null,
    rsvpUpdatedAt: guest.rsvpUpdatedAt ? guest.rsvpUpdatedAt.toISOString() : null,
    wishes: guest.wishes ?? null,
    notes: guest.notes ?? null,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
  };
}

export class GuestService {
  static async listGuests(
    weddingId: string,
    query?: QueryGuestsInput
  ): Promise<{
    guests: GuestDTO[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const filter: Record<string, unknown> = { weddingId: weddingObjectId };

    if (query?.rsvpStatus) {
      filter.rsvpStatus = query.rsvpStatus;
    }

    if (query?.side) {
      filter.side = query.side;
    }

    if (query?.eventId) {
      filter.invitedEventIds = new mongoose.Types.ObjectId(query.eventId);
    }

    if (query?.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { emailNormalized: regex }, { phone: regex }];
    }

    const page = query?.page || PAGINATION.DEFAULT_PAGE;
    const limit = query?.limit || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [guests, total] = await Promise.all([
      GuestModel.find(filter)
        .sort({ name: 1, _id: 1 })
        .skip(skip)
        .limit(limit),
      GuestModel.countDocuments(filter),
    ]);

    return {
      guests: guests.map(toGuestDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createGuest(weddingId: string, input: CreateGuestInput): Promise<GuestDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

    // Validate invitedEventIds belong to this wedding
    const eventObjectIds = (input.invitedEventIds || []).map((id) => new mongoose.Types.ObjectId(id));
    if (eventObjectIds.length > 0) {
      const validCount = await WeddingEventModel.countDocuments({
        _id: { $in: eventObjectIds },
        weddingId: weddingObjectId,
      });
      if (validCount !== eventObjectIds.length) {
        throw new ValidationError('One or more invited event IDs are invalid for this wedding');
      }
    }

    // Generate cryptographic stable token (32 bytes base64url)
    const token = crypto.randomBytes(32).toString('base64url');

    const guest = await GuestModel.create({
      weddingId: weddingObjectId,
      name: input.name.trim(),
      email: input.email ? input.email.trim() : null,
      emailNormalized: input.email ? input.email.trim().toLowerCase() : null,
      phone: input.phone ? input.phone.trim() : null,
      side: input.side || 'GROOM',
      dietary: input.dietary || 'ALL',
      maxGuests: input.maxGuests || 1,
      invitedEventIds: eventObjectIds,
      invitationToken: token,
      rsvpStatus: RSVP_STATUS.PENDING,
      attendingCount: null,
      notes: input.notes ? input.notes.trim() : null,
    });

    return toGuestDTO(guest);
  }

  static async getGuestById(weddingId: string, guestId: string): Promise<GuestDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      throw new NotFoundError('Guest not found');
    }

    const guest = await GuestModel.findOne({
      _id: new mongoose.Types.ObjectId(guestId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    return toGuestDTO(guest);
  }

  static async updateGuest(
    weddingId: string,
    guestId: string,
    input: UpdateGuestInput
  ): Promise<GuestDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      throw new NotFoundError('Guest not found');
    }

    const guest = await GuestModel.findOne({
      _id: new mongoose.Types.ObjectId(guestId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    // Capacity guard
    if (
      input.maxGuests !== undefined &&
      guest.attendingCount &&
      input.maxGuests < guest.attendingCount
    ) {
      throw new ValidationError(
        `Cannot reduce max capacity below current confirmed attendance (${guest.attendingCount})`
      );
    }

    // Validate event IDs
    if (input.invitedEventIds !== undefined) {
      const eventObjectIds = input.invitedEventIds.map((id) => new mongoose.Types.ObjectId(id));
      if (eventObjectIds.length > 0) {
        const validCount = await WeddingEventModel.countDocuments({
          _id: { $in: eventObjectIds },
          weddingId: new mongoose.Types.ObjectId(weddingId),
        });
        if (validCount !== eventObjectIds.length) {
          throw new ValidationError('One or more invited event IDs are invalid for this wedding');
        }
      }
      guest.invitedEventIds = eventObjectIds;
    }

    if (input.name !== undefined) guest.name = input.name.trim();
    if (input.email !== undefined) {
      guest.email = input.email ? input.email.trim() : null;
      guest.emailNormalized = input.email ? input.email.trim().toLowerCase() : null;
    }
    if (input.phone !== undefined) guest.phone = input.phone ? input.phone.trim() : null;
    if (input.side !== undefined) guest.side = input.side;
    if (input.dietary !== undefined) guest.dietary = input.dietary;
    if (input.maxGuests !== undefined) guest.maxGuests = input.maxGuests;
    if (input.notes !== undefined) guest.notes = input.notes ? input.notes.trim() : null;

    if (input.rsvpStatus !== undefined) {
      guest.rsvpStatus = input.rsvpStatus;
      guest.rsvpUpdatedAt = new Date();
      if (input.rsvpStatus === RSVP_STATUS.ATTENDING) {
        guest.attendingCount =
          input.attendingCount !== undefined && input.attendingCount !== null
            ? input.attendingCount
            : guest.attendingCount ?? guest.maxGuests;
      } else if (input.rsvpStatus === RSVP_STATUS.NOT_ATTENDING) {
        guest.attendingCount = 0;
      } else {
        guest.attendingCount = null;
      }
    } else if (input.attendingCount !== undefined) {
      guest.attendingCount = input.attendingCount;
    }

    if (input.wishes !== undefined) {
      guest.wishes = input.wishes ? input.wishes.trim() : null;
    }

    await guest.save();
    return toGuestDTO(guest);
  }

  static async deleteGuest(weddingId: string, guestId: string): Promise<void> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      throw new NotFoundError('Guest not found');
    }

    const result = await GuestModel.deleteOne({
      _id: new mongoose.Types.ObjectId(guestId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Guest not found');
    }
  }

  static async getGuestInvitationLink(weddingId: string, guestId: string): Promise<string> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      throw new NotFoundError('Guest not found');
    }

    const guest = await GuestModel.findOne({
      _id: new mongoose.Types.ObjectId(guestId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    }).select('+invitationToken');

    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    return `${baseUrl}/invite/${guest.invitationToken}`;
  }

  static async getPublicInvitation(token: string) {
    await connectToDatabase();

    const guest = await GuestModel.findOne({ invitationToken: token });
    if (!guest) {
      throw new NotFoundError('Invitation link is invalid or no longer exists');
    }

    const wedding = await WeddingModel.findById(guest.weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }

    // Only load active events this guest is invited to
    const events = await WeddingEventModel.find({
      _id: { $in: guest.invitedEventIds },
      weddingId: guest.weddingId,
      archivedAt: null,
    }).sort({ startsAt: 1 });

    return {
      guest: {
        id: guest._id.toString(),
        name: guest.name,
        side: guest.side,
        dietary: guest.dietary,
        maxGuests: guest.maxGuests,
        rsvpStatus: guest.rsvpStatus,
        attendingCount: guest.attendingCount ?? null,
        wishes: guest.wishes ?? null,
      },
      wedding: {
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        weddingDate: wedding.weddingDate,
        title: wedding.title || `${wedding.groomName} & ${wedding.brideName}'s Wedding`,
        city: wedding.location?.city || null,
      },
      events: events.map((ev) => ({
        id: ev._id.toString(),
        name: ev.name,
        type: ev.type,
        startsAt: ev.startsAt.toISOString(),
        endsAt: ev.endsAt ? ev.endsAt.toISOString() : null,
        venueName: ev.venueName ?? null,
        address: ev.address ?? null,
        dressCode: ev.dressCode ?? null,
        description: ev.description ?? null,
      })),
    };
  }

  static async submitPublicRsvp(token: string, input: SubmitRsvpInput) {
    await connectToDatabase();

    const guest = await GuestModel.findOne({ invitationToken: token });
    if (!guest) {
      throw new NotFoundError('Invitation link is invalid or no longer exists');
    }

    if (input.status === RSVP_STATUS.ATTENDING) {
      if (input.attendingCount < 1 || input.attendingCount > guest.maxGuests) {
        throw new ValidationError(
          `Attending guests must be between 1 and your invited capacity of ${guest.maxGuests}`
        );
      }
      guest.attendingCount = input.attendingCount;
    } else {
      guest.attendingCount = 0;
    }

    guest.rsvpStatus = input.status;
    guest.rsvpUpdatedAt = new Date();
    if (input.dietary) guest.dietary = input.dietary;
    if (input.wishes !== undefined) guest.wishes = input.wishes ? input.wishes.trim() : null;

    await guest.save();

    return {
      success: true,
      rsvpStatus: guest.rsvpStatus,
      attendingCount: guest.attendingCount,
    };
  }

  static async getCatererPlateSummary(weddingId: string) {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

    const [guests, events] = await Promise.all([
      GuestModel.find({ weddingId: weddingObjectId }),
      WeddingEventModel.find({ weddingId: weddingObjectId, archivedAt: null }).sort({ startsAt: 1 }),
    ]);

    let totalCapacity = 0;
    let confirmedAttendingPlates = 0;
    let pendingCount = 0;
    let declinedCount = 0;

    const dietaryCounts = {
      ALL: 0,
      PURE_VEG: 0,
      JAIN: 0,
      NON_VEG: 0,
    };

    const sideCounts = {
      GROOM: 0,
      BRIDE: 0,
      MUTUAL: 0,
    };

    // Calculate per-ceremony plates
    const eventPlatesMap: Record<string, number> = {};
    for (const ev of events) {
      eventPlatesMap[ev._id.toString()] = 0;
    }

    for (const g of guests) {
      totalCapacity += g.maxGuests;

      if (g.rsvpStatus === RSVP_STATUS.ATTENDING) {
        const count = g.attendingCount || 1;
        confirmedAttendingPlates += count;
        dietaryCounts[g.dietary] = (dietaryCounts[g.dietary] || 0) + count;
        sideCounts[g.side] = (sideCounts[g.side] || 0) + count;

        for (const evId of g.invitedEventIds) {
          const idStr = evId.toString();
          if (eventPlatesMap[idStr] !== undefined) {
            eventPlatesMap[idStr] += count;
          }
        }
      } else if (g.rsvpStatus === RSVP_STATUS.NOT_ATTENDING) {
        declinedCount += 1;
      } else {
        pendingCount += 1;
      }
    }

    const eventSummaries = events.map((ev) => ({
      eventId: ev._id.toString(),
      name: ev.name,
      type: ev.type,
      startsAt: ev.startsAt.toISOString(),
      confirmedPlates: eventPlatesMap[ev._id.toString()] || 0,
    }));

    return {
      totalGuestsCount: guests.length,
      totalCapacity,
      confirmedAttendingPlates,
      pendingCount,
      declinedCount,
      dietaryBreakdown: dietaryCounts,
      sideBreakdown: sideCounts,
      eventSummaries,
    };
  }
}
