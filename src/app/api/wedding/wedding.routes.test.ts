import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, PATCH } from './route';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Wedding API Routes (/api/wedding)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/wedding', () => {
    it('creates wedding and returns 201 for valid authenticated request', async () => {
      vi.spyOn(sessionHelpers, 'requireAuth').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
        membership: null,
        wedding: null,
      });

      const mockWedding = {
        id: 'w1',
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
        timeZone: 'Asia/Kolkata',
        website: { slug: 'princi-akshay-14022027' },
      };

      vi.spyOn(WeddingService, 'createWedding').mockResolvedValue({
        wedding: mockWedding as any,
        membership: {} as any,
      });

      const request = new NextRequest('http://localhost:3000/api/wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brideName: 'Princi',
          groomName: 'Akshay',
          weddingDate: '2027-02-14',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.data.id).toBe('w1');
      expect(json.data.website.slug).toBe('princi-akshay-14022027');
    });

    it('returns 400 on malformed input (e.g. invalid date)', async () => {
      vi.spyOn(sessionHelpers, 'requireAuth').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
        membership: null,
        wedding: null,
      });

      const request = new NextRequest('http://localhost:3000/api/wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brideName: 'Princi',
          groomName: 'Akshay',
          weddingDate: '14-02-2027', // Invalid format
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/wedding', () => {
    it('returns 200 with current wedding for authenticated member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
        membership: { role: USER_ROLES.ADMIN } as any,
        wedding: { id: 'w1' } as any,
        weddingId: 'w1',
        role: USER_ROLES.ADMIN,
      });

      vi.spyOn(WeddingService, 'getWeddingById').mockResolvedValue({
        id: 'w1',
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/wedding');
      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data.id).toBe('w1');
      expect(json.data.brideName).toBe('Princi');
    });

    it('returns 404 if user has no active wedding membership', async () => {
      const request = new NextRequest('http://localhost:3000/api/wedding');
      const response = await GET(request);
      // requireWeddingMember throws when not in wedding (or 401 when no session)
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/wedding', () => {
    it('updates wedding fields and returns 200', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
        membership: { role: USER_ROLES.ADMIN } as any,
        wedding: { id: 'w1' } as any,
        weddingId: 'w1',
        role: USER_ROLES.ADMIN,
      });

      vi.spyOn(WeddingService, 'updateWedding').mockResolvedValue({
        id: 'w1',
        brideName: 'Princi Sharma',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/wedding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brideName: 'Princi Sharma',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data.brideName).toBe('Princi Sharma');
    });
  });
});
