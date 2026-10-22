import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { EventService } from './event.service';
import { WeddingEventModel } from './event.model';
import { NotFoundError, ConflictError, ValidationError } from '@/shared/errors/app-error';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('EventService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockEventId = new mongoose.Types.ObjectId().toString();

  describe('createEvent', () => {
    it('creates an event with valid dates and returns DTO', async () => {
      const mockCreatedEvent = {
        _id: new mongoose.Types.ObjectId(mockEventId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Haldi Ceremony',
        type: 'HALDI',
        startsAt: new Date('2026-10-18T10:00:00.000Z'),
        endsAt: new Date('2026-10-18T13:00:00.000Z'),
        venueName: 'Palace Courtyard',
        address: 'Indore, MP',
        dressCode: 'Shades of Yellow',
        description: 'Traditional auspicious Haldi ritual',
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingEventModel, 'create').mockResolvedValue(mockCreatedEvent as any);

      const result = await EventService.createEvent(mockWeddingId, {
        name: 'Haldi Ceremony',
        type: 'HALDI',
        startsAt: '2026-10-18T10:00:00.000Z',
        endsAt: '2026-10-18T13:00:00.000Z',
        venueName: 'Palace Courtyard',
        address: 'Indore, MP',
        dressCode: 'Shades of Yellow',
        description: 'Traditional auspicious Haldi ritual',
      });

      expect(result.id).toBe(mockEventId);
      expect(result.name).toBe('Haldi Ceremony');
      expect(result.type).toBe('HALDI');
      expect(result.venueName).toBe('Palace Courtyard');
    });

    it('throws ValidationError if endsAt is before or equal to startsAt', async () => {
      await expect(
        EventService.createEvent(mockWeddingId, {
          name: 'Invalid Timing Event',
          startsAt: '2026-10-18T15:00:00.000Z',
          endsAt: '2026-10-18T12:00:00.000Z',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('listEvents', () => {
    it('returns active events sorted by startsAt and excludes archived by default', async () => {
      const mockEvents = [
        {
          _id: new mongoose.Types.ObjectId(),
          weddingId: new mongoose.Types.ObjectId(mockWeddingId),
          name: 'Mehendi & Dhol',
          type: 'MEHENDI',
          startsAt: new Date('2026-10-18T16:00:00.000Z'),
          endsAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);

      const result = await EventService.listEvents(mockWeddingId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mehendi & Dhol');
    });
  });

  describe('getEventById', () => {
    it('returns event by id', async () => {
      const mockEvent = {
        _id: new mongoose.Types.ObjectId(mockEventId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Sangeet Night',
        type: 'SANGEET',
        startsAt: new Date('2026-10-19T19:00:00.000Z'),
        endsAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingEventModel, 'findOne').mockResolvedValue(mockEvent as any);

      const result = await EventService.getEventById(mockWeddingId, mockEventId);
      expect(result.name).toBe('Sangeet Night');
    });

    it('throws NotFoundError for non-existent event', async () => {
      vi.spyOn(WeddingEventModel, 'findOne').mockResolvedValue(null);

      await expect(EventService.getEventById(mockWeddingId, mockEventId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateEvent', () => {
    it('throws ConflictError if event is already archived', async () => {
      const mockArchivedEvent = {
        _id: new mongoose.Types.ObjectId(mockEventId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Archived Ceremony',
        archivedAt: new Date(),
      };

      vi.spyOn(WeddingEventModel, 'findOne').mockResolvedValue(mockArchivedEvent as any);

      await expect(
        EventService.updateEvent(mockWeddingId, mockEventId, { name: 'Renamed' })
      ).rejects.toThrow(ConflictError);
    });

    it('updates fields successfully on active event', async () => {
      const mockEvent = {
        _id: new mongoose.Types.ObjectId(mockEventId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Old Name',
        type: 'CUSTOM',
        startsAt: new Date('2026-10-20T10:00:00.000Z'),
        endsAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(WeddingEventModel, 'findOne').mockResolvedValue(mockEvent as any);

      const result = await EventService.updateEvent(mockWeddingId, mockEventId, {
        name: 'Varmala & Pheras',
        type: 'WEDDING',
      });

      expect(mockEvent.name).toBe('Varmala & Pheras');
      expect(mockEvent.type).toBe('WEDDING');
      expect(mockEvent.save).toHaveBeenCalled();
      expect(result.name).toBe('Varmala & Pheras');
    });
  });

  describe('archiveEvent', () => {
    it('sets archivedAt timestamp on active event', async () => {
      const mockEvent = {
        _id: new mongoose.Types.ObjectId(mockEventId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        archivedAt: null,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(WeddingEventModel, 'findOne').mockResolvedValue(mockEvent as any);

      await EventService.archiveEvent(mockWeddingId, mockEventId);
      expect(mockEvent.archivedAt).toBeInstanceOf(Date);
      expect(mockEvent.save).toHaveBeenCalled();
    });
  });
});
