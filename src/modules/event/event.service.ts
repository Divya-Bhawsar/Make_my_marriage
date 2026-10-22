import mongoose from 'mongoose';
import { WeddingEventModel, IWeddingEvent } from './event.model';
import { CreateEventInput, UpdateEventInput, QueryEventsInput } from './event.schema';
import { NotFoundError, ConflictError, ValidationError } from '@/shared/errors/app-error';
import { ERROR_CODES, StandardEventType } from '@/shared/constants';
import { connectToDatabase } from '@/server/db/connection';

export interface WeddingEventDTO {
  id: string;
  weddingId: string;
  name: string;
  type: StandardEventType;
  startsAt: string;
  endsAt?: string | null;
  venueName?: string | null;
  address?: string | null;
  description?: string | null;
  dressCode?: string | null;
  coverImageObjectKey?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toWeddingEventDTO(event: IWeddingEvent): WeddingEventDTO {
  return {
    id: event._id.toString(),
    weddingId: event.weddingId.toString(),
    name: event.name,
    type: event.type,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt ? event.endsAt.toISOString() : null,
    venueName: event.venueName ?? null,
    address: event.address ?? null,
    description: event.description ?? null,
    dressCode: event.dressCode ?? null,
    coverImageObjectKey: event.coverImageObjectKey ?? null,
    archivedAt: event.archivedAt ? event.archivedAt.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export class EventService {
  static async listEvents(weddingId: string, query?: QueryEventsInput): Promise<WeddingEventDTO[]> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const filter: Record<string, unknown> = { weddingId: weddingObjectId };

    if (!query?.includeArchived) {
      filter.archivedAt = null;
    }

    if (query?.from || query?.to) {
      const timeFilter: Record<string, Date> = {};
      if (query.from) timeFilter.$gte = new Date(query.from);
      if (query.to) timeFilter.$lte = new Date(query.to);
      filter.startsAt = timeFilter;
    }

    const events = await WeddingEventModel.find(filter).sort({ startsAt: 1 });
    return events.map(toWeddingEventDTO);
  }

  static async createEvent(weddingId: string, input: CreateEventInput): Promise<WeddingEventDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const startsAt = new Date(input.startsAt);
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;

    if (endsAt && endsAt <= startsAt) {
      throw new ValidationError('endsAt must be strictly after startsAt');
    }

    const event = await WeddingEventModel.create({
      weddingId: weddingObjectId,
      name: input.name.trim(),
      type: input.type || 'CUSTOM',
      startsAt,
      endsAt,
      venueName: input.venueName?.trim() || null,
      address: input.address?.trim() || null,
      description: input.description?.trim() || null,
      dressCode: input.dressCode?.trim() || null,
      coverImageObjectKey: input.coverImageObjectKey?.trim() || null,
      archivedAt: null,
    });

    return toWeddingEventDTO(event);
  }

  static async getEventById(weddingId: string, eventId: string): Promise<WeddingEventDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundError('Event not found');
    }

    const event = await WeddingEventModel.findOne({
      _id: new mongoose.Types.ObjectId(eventId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return toWeddingEventDTO(event);
  }

  static async updateEvent(
    weddingId: string,
    eventId: string,
    input: UpdateEventInput
  ): Promise<WeddingEventDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundError('Event not found');
    }

    const event = await WeddingEventModel.findOne({
      _id: new mongoose.Types.ObjectId(eventId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.archivedAt) {
      throw new ConflictError('Cannot modify an archived event', ERROR_CODES.CONFLICT);
    }

    // Merge timestamps to validate endsAt > startsAt
    const nextStartsAt = input.startsAt ? new Date(input.startsAt) : event.startsAt;
    const nextEndsAt =
      input.endsAt !== undefined
        ? input.endsAt
          ? new Date(input.endsAt)
          : null
        : event.endsAt;

    if (nextEndsAt && nextEndsAt <= nextStartsAt) {
      throw new ValidationError('endsAt must be strictly after startsAt');
    }

    if (input.name !== undefined) event.name = input.name.trim();
    if (input.type !== undefined) event.type = input.type;
    if (input.startsAt !== undefined) event.startsAt = nextStartsAt;
    if (input.endsAt !== undefined) event.endsAt = nextEndsAt;
    if (input.venueName !== undefined) event.venueName = input.venueName ? input.venueName.trim() : null;
    if (input.address !== undefined) event.address = input.address ? input.address.trim() : null;
    if (input.description !== undefined)
      event.description = input.description ? input.description.trim() : null;
    if (input.dressCode !== undefined) event.dressCode = input.dressCode ? input.dressCode.trim() : null;
    if (input.coverImageObjectKey !== undefined)
      event.coverImageObjectKey = input.coverImageObjectKey ? input.coverImageObjectKey.trim() : null;

    await event.save();
    return toWeddingEventDTO(event);
  }

  static async archiveEvent(weddingId: string, eventId: string): Promise<void> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundError('Event not found');
    }

    const event = await WeddingEventModel.findOne({
      _id: new mongoose.Types.ObjectId(eventId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (!event.archivedAt) {
      event.archivedAt = new Date();
      await event.save();
    }
  }
}
