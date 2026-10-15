import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  AuthService,
  hashToken,
  generateSessionToken,
  hashPassword,
  comparePassword,
} from './auth.service';
import { UserModel } from './user.model';
import { SessionModel } from './session.model';
import { WeddingMembershipModel } from '../wedding/membership.model';
import { ConflictError, UnauthenticatedError } from '@/shared/errors/app-error';

// Mock DB connection
vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security Primitives', () => {
    it('generates a 64-character hex session token', () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('produces deterministic SHA-256 token hashes', () => {
      const token = 'sample-secret-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('hashes passwords and validates with comparePassword', async () => {
      const password = 'my-secure-password';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(await comparePassword(password, hash)).toBe(true);
      expect(await comparePassword('wrong-password', hash)).toBe(false);
    });
  });

  describe('signup', () => {
    it('creates a user and session when email is unique', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        name: 'Akshay Saini',
        email: 'Akshay@Example.com',
        emailNormalized: 'akshay@example.com',
        passwordHash: 'hashed-password',
      };
      vi.spyOn(UserModel, 'create').mockResolvedValue(mockUser as any);
      vi.spyOn(SessionModel, 'create').mockResolvedValue({} as any);

      const result = await AuthService.signup({
        name: 'Akshay Saini',
        email: 'Akshay@Example.com',
        password: 'password123',
      });

      expect(result.user).toEqual({
        id: mockUserId.toString(),
        name: 'Akshay Saini',
        email: 'Akshay@Example.com',
      });
      expect(result.rawToken).toHaveLength(64);
      expect(result.hasWedding).toBe(false);
    });

    it('throws ConflictError if normalized email already exists', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue({ _id: 'existing-user' } as any);

      await expect(
        AuthService.signup({
          name: 'Akshay Saini',
          email: 'akshay@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('authenticates user and returns session', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const passwordHash = await hashPassword('correct-password');
      const mockUser = {
        _id: mockUserId,
        name: 'Akshay Saini',
        email: 'akshay@example.com',
        passwordHash,
      };

      vi.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser as any);
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(SessionModel, 'create').mockResolvedValue({} as any);

      const result = await AuthService.login({
        email: 'akshay@example.com',
        password: 'correct-password',
      });

      expect(result.user.id).toBe(mockUserId.toString());
      expect(result.rawToken).toBeDefined();
      expect(result.hasWedding).toBe(false);
    });

    it('indicates hasWedding=true if user has a membership', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const passwordHash = await hashPassword('correct-password');
      const mockUser = {
        _id: mockUserId,
        name: 'Akshay Saini',
        email: 'akshay@example.com',
        passwordHash,
      };

      vi.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser as any);
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue({ _id: 'm1' } as any);
      vi.spyOn(SessionModel, 'create').mockResolvedValue({} as any);

      const result = await AuthService.login({
        email: 'akshay@example.com',
        password: 'correct-password',
      });

      expect(result.hasWedding).toBe(true);
    });

    it('throws UnauthenticatedError for non-existent email', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: 'unknown@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthenticatedError);
    });

    it('throws UnauthenticatedError for wrong password', async () => {
      const passwordHash = await hashPassword('real-password');
      vi.spyOn(UserModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        passwordHash,
      } as any);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('logout', () => {
    it('deletes session matching the token hash', async () => {
      const deleteSpy = vi.spyOn(SessionModel, 'deleteOne').mockResolvedValue({} as any);

      await AuthService.logout('raw-token');
      expect(deleteSpy).toHaveBeenCalledWith({ tokenHash: hashToken('raw-token') });
    });
  });

  describe('validateSession', () => {
    it('returns null for empty or invalid token', async () => {
      expect(await AuthService.validateSession('')).toBeNull();
    });

    it('returns user and session if session is active and user exists', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockSession = {
        _id: 's1',
        userId: mockUserId,
        tokenHash: hashToken('valid-token'),
      };
      const mockUser = {
        _id: mockUserId,
        name: 'Akshay Saini',
        email: 'akshay@example.com',
      };

      vi.spyOn(SessionModel, 'findOne').mockResolvedValue(mockSession as any);
      vi.spyOn(SessionModel, 'updateOne').mockReturnValue({ exec: vi.fn() } as any);
      vi.spyOn(UserModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await AuthService.validateSession('valid-token');
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(mockUserId.toString());
    });

    it('returns null if session is not found or expired', async () => {
      vi.spyOn(SessionModel, 'findOne').mockResolvedValue(null);

      const result = await AuthService.validateSession('expired-token');
      expect(result).toBeNull();
    });
  });
});
