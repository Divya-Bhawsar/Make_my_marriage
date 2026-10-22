import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getEvents, POST as postEvent } from './route';
import {
  GET as getSingleEvent,
  PATCH as patchEvent,
  DELETE as deleteEvent,
} from './[eventId]/route';
import { EventService } from '@/modules/event/event.service';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Events API Routes (/api/events)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMemberContext = {
    user: { id: 'u1', name: 'Divya', email: 'divya@example.com' },
    session: {} as any,
    membership: {
      _id: 'm1' as any,
      userId: 'u1' as any,
      weddingId: 'w1' as any,
      role: USER_ROLES.ADMIN,
      joinedAt: new Date(),
    } as any,
    wedding: {
      id: 'w1',
      brideName: 'Eisha',
      groomName: 'Vivek',
      weddingDate: '2026-10-20',
      timeZone: 'Asia/Kolkata',
      website: { slug: 'eisha-vivek-20102026' },
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  describe('GET /api/events', () => {
    it('returns 200 and list of events for wedding member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const mockEvents = [
        {
          id: 'e1',
          weddingId: 'w1',
          name: 'Mehendi & Sangeet',
          type: 'MEHENDI',
          startsAt: '2026-10-19T16:00:00.000Z',
          endsAt: '2026-10-19T22:00:00.000Z',
          venueName: 'Sayaji Hotel',
          address: 'Indore',
          dressCode: 'Indo-Western Glamour',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(EventService, 'listEvents').mockResolvedValue(mockEvents as any);

      const request = new NextRequest('http://localhost:3000/api/events');
      const response = await getEvents(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('Mehendi & Sangeet');
    });
  });

  describe('POST /api/events', () => {
    it('creates an event and returns 201', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const mockEvent = {
        id: 'e1',
        weddingId: 'w1',
        name: 'Haldi Ceremony',
        type: 'HALDI',
        startsAt: '2026-10-19T10:00:00.000Z',
        endsAt: '2026-10-19T13:00:00.000Z',
        venueName: 'Home Courtyard',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(EventService, 'createEvent').mockResolvedValue(mockEvent as any);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Haldi Ceremony',
          type: 'HALDI',
          startsAt: '2026-10-19T10:00:00.000Z',
          endsAt: '2026-10-19T13:00:00.000Z',
          venueName: 'Home Courtyard',
        }),
      });

      const response = await postEvent(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data.name).toBe('Haldi Ceremony');
    });

    it('returns 400 when missing required name or startsAt', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const request = new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: 'No Name Event',
        }),
      });

      const response = await postEvent(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/events/[eventId]', () => {
    it('returns 200 with single event', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const mockEvent = {
        id: 'e1',
        name: 'Pheras',
        type: 'WEDDING',
      };
      vi.spyOn(EventService, 'getEventById').mockResolvedValue(mockEvent as any);

      const request = new NextRequest('http://localhost:3000/api/events/e1');
      const response = await getSingleEvent(request, { params: { eventId: 'e1' } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.name).toBe('Pheras');
    });
  });

  describe('PATCH /api/events/[eventId]', () => {
    it('updates event and returns 200', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const updated = {
        id: 'e1',
        name: 'Grand Reception & Dinner',
        type: 'RECEPTION',
      };
      vi.spyOn(EventService, 'updateEvent').mockResolvedValue(updated as any);

      const request = new NextRequest('http://localhost:3000/api/events/e1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Grand Reception & Dinner' }),
      });

      const response = await patchEvent(request, { params: { eventId: 'e1' } });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.name).toBe('Grand Reception & Dinner');
    });
  });

  describe('DELETE /api/events/[eventId]', () => {
    it('archives event and returns 200 with success: true', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(EventService, 'archiveEvent').mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/events/e1', {
        method: 'DELETE',
      });

      const response = await deleteEvent(request, { params: { eventId: 'e1' } });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });
});
