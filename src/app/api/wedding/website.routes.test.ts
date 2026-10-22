import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getWebsite, PATCH as patchWebsite } from './website/route';
import { GET as getLivestream, PATCH as patchLivestream } from './livestream/route';
import { GET as getPublicWedding } from '../public/weddings/[slug]/route';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Wedding Website & Livestream API Routes', () => {
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
      website: { slug: 'eisha-vivek-20102026', theme: 'crimson', isPublished: true },
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  describe('GET /api/wedding/website', () => {
    it('returns 200 and website settings', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(WeddingService, 'getWebsiteSettings').mockResolvedValue({
        slug: 'eisha-vivek-20102026',
        theme: 'crimson',
        isPublished: true,
        welcomeMessage: 'Welcome to our wedding',
      });

      const req = new NextRequest('http://localhost:3000/api/wedding/website');
      const res = await getWebsite(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.slug).toBe('eisha-vivek-20102026');
      expect(json.data.theme).toBe('crimson');
    });
  });

  describe('PATCH /api/wedding/website', () => {
    it('updates website settings and returns updated data', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(WeddingService, 'updateWebsiteSettings').mockResolvedValue({
        slug: 'eisha-vivek-20102026',
        theme: 'marigold',
        isPublished: true,
        welcomeMessage: 'Updated message',
      });

      const req = new NextRequest('http://localhost:3000/api/wedding/website', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: 'marigold',
          welcomeMessage: 'Updated message',
          isPublished: true,
        }),
      });

      const res = await patchWebsite(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.theme).toBe('marigold');
    });
  });

  describe('GET /api/wedding/livestream', () => {
    it('returns 200 and livestream configuration', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(WeddingService, 'getLivestreamSettings').mockResolvedValue({
        provider: 'YOUTUBE',
        youtubeUrl: 'https://youtube.com/live/12345',
        meetingUrl: null,
        instructions: null,
        scheduledStartTime: null,
        isEnabled: true,
      });

      const req = new NextRequest('http://localhost:3000/api/wedding/livestream');
      const res = await getLivestream(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.isEnabled).toBe(true);
    });
  });

  describe('PATCH /api/wedding/livestream', () => {
    it('updates livestream settings and returns updated data', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(WeddingService, 'updateLivestreamSettings').mockResolvedValue({
        provider: 'YOUTUBE',
        youtubeUrl: 'https://youtube.com/live/new',
        meetingUrl: null,
        instructions: null,
        scheduledStartTime: null,
        isEnabled: false,
      });

      const req = new NextRequest('http://localhost:3000/api/wedding/livestream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: 'https://youtube.com/live/new',
          isEnabled: false,
        }),
      });

      const res = await patchLivestream(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.isEnabled).toBe(false);
    });

    it('updates Google Meet provider settings via PATCH', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(WeddingService, 'updateLivestreamSettings').mockResolvedValue({
        provider: 'GOOGLE_MEET',
        youtubeUrl: null,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        instructions: 'Please mute mic during mantras',
        scheduledStartTime: '2026-10-20T18:30:00Z',
        isEnabled: true,
      });

      const req = new NextRequest('http://localhost:3000/api/wedding/livestream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GOOGLE_MEET',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          instructions: 'Please mute mic during mantras',
          isEnabled: true,
        }),
      });

      const res = await patchLivestream(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.provider).toBe('GOOGLE_MEET');
      expect(json.data.meetingUrl).toBe('https://meet.google.com/abc-defg-hij');
      expect(json.data.isEnabled).toBe(true);
    });
  });

  describe('GET /api/public/weddings/[slug]', () => {
    it('returns public wedding data without requiring auth', async () => {
      vi.spyOn(WeddingService, 'getPublicWeddingBySlug').mockResolvedValue({
        brideName: 'Eisha',
        groomName: 'Vivek',
        title: 'Vivek & Eisha',
        description: 'Indore wedding',
        weddingDate: '2026-10-20',
        timeZone: 'Asia/Kolkata',
        theme: 'crimson',
        isPublished: true,
        welcomeMessage: 'Welcome',
        slug: 'eisha-vivek-20102026',
        events: [],
        gallery: { isEnabled: true },
        livestream: { isEnabled: true, youtubeUrl: 'https://youtube.com/watch?v=abc123' },
      });

      const req = new NextRequest('http://localhost:3000/api/public/weddings/eisha-vivek-20102026');
      const res = await getPublicWedding(req, {
        params: Promise.resolve({ slug: 'eisha-vivek-20102026' }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.brideName).toBe('Eisha');
      expect(json.data.slug).toBe('eisha-vivek-20102026');
    });
  });
});
