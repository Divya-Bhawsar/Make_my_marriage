import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getSettings, PATCH as patchSettings } from './settings/route';
import { GET as listPhotos } from '../photos/route';
import { DELETE as deletePhoto } from '../photos/[photoId]/route';
import { GET as getPublicGallery } from '../public/galleries/[token]/route';
import { GET as getPublicPhotos } from '../public/galleries/[token]/photos/route';
import { PhotoService } from '@/modules/photo/photo.service';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Gallery & Photos API Routes', () => {
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
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  describe('GET /api/gallery/settings', () => {
    it('returns 200 and gallery settings for member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(PhotoService, 'getGallerySettings').mockResolvedValue({
        isEnabled: true,
        guestUploadsEnabled: true,
        token: 'token-abc',
        gallerySlug: 'eisha-vivek-20102026',
      });

      const req = new NextRequest('http://localhost:3000/api/gallery/settings');
      const res = await getSettings(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.token).toBe('token-abc');
      expect(json.data.guestUploadsEnabled).toBe(true);
    });
  });

  describe('PATCH /api/gallery/settings', () => {
    it('updates gallery settings successfully', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(PhotoService, 'updateGallerySettings').mockResolvedValue({
        isEnabled: false,
        guestUploadsEnabled: false,
        token: 'token-abc',
        gallerySlug: 'eisha-vivek-20102026',
      });

      const req = new NextRequest('http://localhost:3000/api/gallery/settings', {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: false, guestUploadsEnabled: false }),
      });
      const res = await patchSettings(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.isEnabled).toBe(false);
      expect(json.data.guestUploadsEnabled).toBe(false);
    });
  });

  describe('GET /api/photos', () => {
    it('lists photos with query parameters', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(PhotoService, 'listPhotos').mockResolvedValue({
        photos: [],
        hasMore: false,
        nextCursor: null,
        metrics: {
          totalCount: 0,
          guestCount: 0,
          memberCount: 0,
          totalSizeBytes: 0,
        },
      });

      const req = new NextRequest('http://localhost:3000/api/photos?limit=20');
      const res = await listPhotos(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.photos).toEqual([]);
      expect(json.data.metrics.totalCount).toBe(0);
    });
  });

  describe('DELETE /api/photos/[photoId]', () => {
    it('deletes photo successfully', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(PhotoService, 'deletePhoto').mockResolvedValue({
        success: true,
        id: 'photo-1',
      });

      const req = new NextRequest('http://localhost:3000/api/photos/photo-1', {
        method: 'DELETE',
      });
      const res = await deletePhoto(req, { params: { photoId: 'photo-1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
    });
  });

  describe('GET /api/public/galleries/[token]', () => {
    it('returns public gallery info without auth', async () => {
      vi.spyOn(PhotoService, 'getPublicGalleryByToken').mockResolvedValue({
        weddingId: 'w1',
        brideName: 'Eisha',
        groomName: 'Vivek',
        title: null,
        weddingDate: '2026-10-20',
        location: 'Indore',
        theme: 'crimson',
        slug: 'eisha-vivek-20102026',
        guestUploadsEnabled: true,
        events: [],
      });

      const req = new NextRequest('http://localhost:3000/api/public/galleries/test-token');
      const res = await getPublicGallery(req, { params: { token: 'test-token' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.brideName).toBe('Eisha');
      expect(json.data.groomName).toBe('Vivek');
    });
  });

  describe('GET /api/public/galleries/[token]/photos', () => {
    it('returns public photos without auth', async () => {
      vi.spyOn(PhotoService, 'listPublicPhotosByToken').mockResolvedValue({
        photos: [],
        hasMore: false,
        nextCursor: null,
        metrics: {
          totalCount: 0,
          guestCount: 0,
          memberCount: 0,
          totalSizeBytes: 0,
        },
      });

      const req = new NextRequest('http://localhost:3000/api/public/galleries/test-token/photos');
      const res = await getPublicPhotos(req, { params: { token: 'test-token' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.photos).toEqual([]);
    });
  });
});
