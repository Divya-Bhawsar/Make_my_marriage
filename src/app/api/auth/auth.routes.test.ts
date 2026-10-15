import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as signupHandler } from './signup/route';
import { POST as loginHandler } from './login/route';
import { POST as logoutHandler } from './logout/route';
import { GET as meHandler } from './me/route';
import { AuthService } from '@/modules/auth/auth.service';
import { SESSION_COOKIE_NAME, USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Auth API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('returns 201 and sets session cookie for valid registration', async () => {
      vi.spyOn(AuthService, 'signup').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        rawToken: 'token123',
        hasWedding: false,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Akshay Saini',
          email: 'akshay@example.com',
          password: 'secure-password',
        }),
      });

      const response = await signupHandler(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.data.user.name).toBe('Akshay');
      expect(json.data.hasWedding).toBe(false);

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('token123');
    });

    it('returns 400 for validation failures (e.g. short password)', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Akshay',
          email: 'akshay@example.com',
          password: 'short',
        }),
      });

      const response = await signupHandler(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and sets session cookie for valid credentials', async () => {
      vi.spyOn(AuthService, 'login').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay', email: 'akshay@example.com' },
        rawToken: 'token456',
        hasWedding: true,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'akshay@example.com',
          password: 'correct-password',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data.hasWedding).toBe(true);
      expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('token456');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears session cookie', async () => {
      const logoutSpy = vi.spyOn(AuthService, 'logout').mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=token-to-invalidate`,
        },
      });

      const response = await logoutHandler(request);
      expect(response.status).toBe(200);
      expect(logoutSpy).toHaveBeenCalledWith('token-to-invalidate');

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie?.maxAge).toBe(0);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with user, membership, and wedding when authenticated', async () => {
      vi.spyOn(sessionHelpers, 'requireAuth').mockResolvedValue({
        user: { id: 'u1', name: 'Akshay Saini', email: 'akshay@example.com' },
        session: {} as any,
        membership: {
          _id: { toString: () => 'm1' } as any,
          role: USER_ROLES.ADMIN,
          joinedAt: new Date('2026-09-01T00:00:00.000Z'),
        } as any,
        wedding: {
          id: 'w1',
          brideName: 'Princi',
          groomName: 'Akshay',
          weddingDate: '2027-02-14',
          timeZone: 'Asia/Kolkata',
          website: { slug: 'princi-akshay-14022027' },
        } as any,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/me');
      const response = await meHandler(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data.user.id).toBe('u1');
      expect(json.data.membership.role).toBe('ADMIN');
      expect(json.data.wedding.website.slug).toBe('princi-akshay-14022027');
    });

    it('returns 401 when unauthenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me');
      const response = await meHandler(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });
  });
});
