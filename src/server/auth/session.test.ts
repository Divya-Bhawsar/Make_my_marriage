import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import {
  setSessionCookie,
  clearSessionCookie,
  resolveSession,
  requireAuth,
  requireWeddingMember,
} from './session';
import { AuthService } from '@/modules/auth/auth.service';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { UnauthenticatedError, NotFoundError } from '@/shared/errors/app-error';
import { SESSION_COOKIE_NAME, USER_ROLES } from '@/shared/constants';

describe('Session and Authorization Helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('setSessionCookie and clearSessionCookie', () => {
    it('sets cookie with standard security attributes', () => {
      const response = new NextResponse();
      setSessionCookie(response, 'test-token');

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('test-token');
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe('lax');
      expect(cookie?.path).toBe('/');
    });

    it('clears cookie by expiring immediately', () => {
      const response = new NextResponse();
      clearSessionCookie(response);

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.maxAge).toBe(0);
    });
  });

  describe('resolveSession', () => {
    it('returns null when no cookie is provided in request', async () => {
      const req = new Request('http://localhost:3000/api/auth/me');
      const result = await resolveSession(req);
      expect(result).toBeNull();
    });

    it('resolves user and membership from valid session cookie', async () => {
      const req = new Request('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=valid-session-token`,
        },
      });

      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockWeddingId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(AuthService, 'validateSession').mockResolvedValue({
        user: { id: mockUserId, name: 'Akshay', email: 'akshay@example.com' },
        session: { _id: 's1' } as any,
      });

      vi.spyOn(WeddingService, 'getMembershipForUser').mockResolvedValue({
        membership: {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(mockUserId),
          weddingId: new mongoose.Types.ObjectId(mockWeddingId),
          role: USER_ROLES.ADMIN,
        } as any,
        wedding: { id: mockWeddingId, brideName: 'Princi', groomName: 'Akshay' } as any,
      });

      const result = await resolveSession(req);
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(mockUserId);
      expect(result?.wedding?.id).toBe(mockWeddingId);
      expect(result?.membership?.role).toBe(USER_ROLES.ADMIN);
    });
  });

  describe('requireAuth', () => {
    it('throws UnauthenticatedError if session resolution fails', async () => {
      const req = new Request('http://localhost:3000/api/wedding');
      await expect(requireAuth(req)).rejects.toThrow(UnauthenticatedError);
    });

    it('returns context if authentication succeeds', async () => {
      const req = new Request('http://localhost:3000/api/wedding', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=test-token` },
      });

      vi.spyOn(AuthService, 'validateSession').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
      });
      vi.spyOn(WeddingService, 'getMembershipForUser').mockResolvedValue(null);

      const context = await requireAuth(req);
      expect(context.user.id).toBe('u1');
      expect(context.wedding).toBeNull();
    });
  });

  describe('requireWeddingMember', () => {
    it('throws NotFoundError if authenticated user does not belong to a wedding', async () => {
      const req = new Request('http://localhost:3000/api/wedding', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=test-token` },
      });

      vi.spyOn(AuthService, 'validateSession').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
      });
      vi.spyOn(WeddingService, 'getMembershipForUser').mockResolvedValue(null);

      await expect(requireWeddingMember(req)).rejects.toThrow(NotFoundError);
    });

    it('returns wedding member context with weddingId and role if membership exists', async () => {
      const req = new Request('http://localhost:3000/api/wedding', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=test-token` },
      });

      const mockWeddingId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(AuthService, 'validateSession').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        session: {} as any,
      });
      vi.spyOn(WeddingService, 'getMembershipForUser').mockResolvedValue({
        membership: { role: USER_ROLES.ADMIN } as any,
        wedding: { id: mockWeddingId } as any,
      });

      const context = await requireWeddingMember(req);
      expect(context.weddingId).toBe(mockWeddingId);
      expect(context.role).toBe(USER_ROLES.ADMIN);
    });
  });
});
