import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MemberService } from './member.service';
import { WeddingMembershipModel } from '@/modules/wedding/membership.model';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { UserModel } from '@/modules/auth/user.model';
import { MemberInvitationModel } from './member-invitation.model';
import { USER_ROLES } from '@/shared/constants';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '@/shared/errors/app-error';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('MemberService', () => {
  const weddingId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();
  const membershipId = new mongoose.Types.ObjectId().toString();
  const invitationId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('listMembers', () => {
    it('returns empty array when no members exist', async () => {
      vi.spyOn(WeddingMembershipModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await MemberService.listMembers(weddingId);
      expect(result).toEqual([]);
    });

    it('returns formatted members with user info', async () => {
      const mockMembership = {
        _id: new mongoose.Types.ObjectId(membershipId),
        userId: new mongoose.Types.ObjectId(userId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        role: USER_ROLES.ADMIN,
        joinedAt: new Date('2026-01-01'),
      };

      vi.spyOn(WeddingMembershipModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockMembership]),
      } as any);

      vi.spyOn(UserModel, 'find').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(userId),
          name: 'Vivek Sharma',
          email: 'vivek@example.com',
        },
      ] as any);

      const result = await MemberService.listMembers(weddingId);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        membershipId,
        user: {
          id: userId,
          name: 'Vivek Sharma',
          email: 'vivek@example.com',
        },
        role: USER_ROLES.ADMIN,
      });
    });
  });

  describe('createInvitation', () => {
    it('throws NotFoundError if wedding does not exist', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      await expect(
        MemberService.createInvitation(weddingId, userId, {
          email: 'test@example.com',
          role: USER_ROLES.MANAGER,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError if user is already a member', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId(weddingId) } as any);
      vi.spyOn(UserModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId(userId) } as any);
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as any);

      await expect(
        MemberService.createInvitation(weddingId, userId, {
          email: 'test@example.com',
          role: USER_ROLES.MANAGER,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError if pending invite already exists', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId(weddingId) } as any);
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as any);

      await expect(
        MemberService.createInvitation(weddingId, userId, {
          email: 'test@example.com',
          role: USER_ROLES.MANAGER,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('successfully creates an invitation', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId(weddingId) } as any);
      vi.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(null);

      const mockCreated = {
        _id: new mongoose.Types.ObjectId(invitationId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        email: 'collaborator@example.com',
        role: USER_ROLES.MANAGER,
        token: 'token123',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      vi.spyOn(MemberInvitationModel, 'create').mockResolvedValue(mockCreated as any);

      const result = await MemberService.createInvitation(
        weddingId,
        userId,
        { email: 'collaborator@example.com', role: USER_ROLES.MANAGER },
        'http://localhost:3000'
      );

      expect(result.email).toBe('collaborator@example.com');
      expect(result.role).toBe(USER_ROLES.MANAGER);
      expect(result.inviteUrl).toContain('http://localhost:3000/member-invitation/token123');
    });
  });

  describe('listInvitations', () => {
    it('returns pending invitations', async () => {
      const mockInv = {
        _id: new mongoose.Types.ObjectId(invitationId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        email: 'pending@example.com',
        role: USER_ROLES.ADMIN,
        token: 'token456',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      vi.spyOn(MemberInvitationModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockInv]),
      } as any);

      const result = await MemberService.listInvitations(weddingId, 'https://example.com');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('pending@example.com');
      expect(result[0].role).toBe(USER_ROLES.ADMIN);
    });
  });

  describe('revokeInvitation', () => {
    it('throws NotFoundError if invitation does not exist', async () => {
      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(null);

      await expect(
        MemberService.revokeInvitation(weddingId, invitationId)
      ).rejects.toThrow(NotFoundError);
    });

    it('revokes an existing invitation', async () => {
      const mockDoc = {
        _id: new mongoose.Types.ObjectId(invitationId),
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(mockDoc as any);

      const res = await MemberService.revokeInvitation(weddingId, invitationId);
      expect(res.success).toBe(true);
      expect(mockDoc.status).toBe('REVOKED');
      expect(mockDoc.save).toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('prevents demoting the last ADMIN', async () => {
      const mockMembership = {
        _id: new mongoose.Types.ObjectId(membershipId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        role: USER_ROLES.ADMIN,
      };

      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(mockMembership as any);
      vi.spyOn(WeddingMembershipModel, 'countDocuments').mockResolvedValue(1);

      await expect(
        MemberService.updateMemberRole(weddingId, membershipId, USER_ROLES.MANAGER)
      ).rejects.toThrow(ForbiddenError);
    });

    it('successfully updates role if multiple admins exist', async () => {
      const mockMembership = {
        _id: new mongoose.Types.ObjectId(membershipId),
        userId: new mongoose.Types.ObjectId(userId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        role: USER_ROLES.ADMIN,
        joinedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(mockMembership as any);
      vi.spyOn(WeddingMembershipModel, 'countDocuments').mockResolvedValue(2);
      vi.spyOn(UserModel, 'findById').mockResolvedValue({ name: 'Vivek', email: 'v@example.com' } as any);

      const result = await MemberService.updateMemberRole(weddingId, membershipId, USER_ROLES.MANAGER);
      expect(result.role).toBe(USER_ROLES.MANAGER);
      expect(mockMembership.save).toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('prevents removing the last ADMIN', async () => {
      const mockMembership = {
        _id: new mongoose.Types.ObjectId(membershipId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        role: USER_ROLES.ADMIN,
      };

      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(mockMembership as any);
      vi.spyOn(WeddingMembershipModel, 'countDocuments').mockResolvedValue(1);

      await expect(
        MemberService.removeMember(weddingId, membershipId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('removes member when allowed', async () => {
      const mockMembership = {
        _id: new mongoose.Types.ObjectId(membershipId),
        weddingId: new mongoose.Types.ObjectId(weddingId),
        role: USER_ROLES.MANAGER,
      };

      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(mockMembership as any);
      vi.spyOn(WeddingMembershipModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      const res = await MemberService.removeMember(weddingId, membershipId);
      expect(res.success).toBe(true);
    });
  });

  describe('getPublicInvitationByToken', () => {
    it('throws NotFoundError if token not found or already accepted', async () => {
      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(null);

      await expect(
        MemberService.getPublicInvitationByToken('invalid-token')
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError if invitation expired', async () => {
      const expiredInvite = {
        token: 'exp-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 10000),
      };
      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(expiredInvite as any);

      await expect(
        MemberService.getPublicInvitationByToken('exp-token')
      ).rejects.toThrow(ValidationError);
    });

    it('returns sanitized public invitation details', async () => {
      const validInvite = {
        weddingId: new mongoose.Types.ObjectId(weddingId),
        email: 'collaborator@test.com',
        role: USER_ROLES.MANAGER,
        token: 'valid-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(validInvite as any);
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(weddingId),
        brideName: 'Eisha',
        groomName: 'Vivek',
        weddingDate: '2026-10-20',
        title: 'Vivek & Eisha',
      } as any);

      const result = await MemberService.getPublicInvitationByToken('valid-token');
      expect(result.email).toBe('collaborator@test.com');
      expect(result.wedding.brideName).toBe('Eisha');
      expect(result.wedding.groomName).toBe('Vivek');
    });
  });

  describe('acceptInvitation', () => {
    it('throws ForbiddenError if user email does not match invitation email', async () => {
      const validInvite = {
        weddingId: new mongoose.Types.ObjectId(weddingId),
        email: 'target@example.com',
        emailNormalized: 'target@example.com',
        token: 'accept-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(validInvite as any);
      vi.spyOn(UserModel, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(userId),
        email: 'different@example.com',
        emailNormalized: 'different@example.com',
      } as any);

      await expect(
        MemberService.acceptInvitation('accept-token', userId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError if user already belongs to a wedding', async () => {
      const validInvite = {
        weddingId: new mongoose.Types.ObjectId(weddingId),
        email: 'user@example.com',
        emailNormalized: 'user@example.com',
        token: 'accept-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      };

      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(validInvite as any);
      vi.spyOn(UserModel, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(userId),
        email: 'user@example.com',
        emailNormalized: 'user@example.com',
      } as any);
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as any);

      await expect(
        MemberService.acceptInvitation('accept-token', userId)
      ).rejects.toThrow(ConflictError);
    });

    it('successfully accepts invitation and creates membership', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const validInvite = {
        weddingId: new mongoose.Types.ObjectId(weddingId),
        email: 'user@example.com',
        emailNormalized: 'user@example.com',
        role: USER_ROLES.MANAGER,
        token: 'accept-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
        save: mockSave,
      };

      vi.spyOn(MemberInvitationModel, 'findOne').mockResolvedValue(validInvite as any);
      vi.spyOn(UserModel, 'findById').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(userId),
        email: 'user@example.com',
        emailNormalized: 'user@example.com',
      } as any);
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(WeddingMembershipModel, 'create').mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as any);

      const result = await MemberService.acceptInvitation('accept-token', userId);
      expect(result.weddingId).toBe(weddingId);
      expect(result.role).toBe(USER_ROLES.MANAGER);
      expect(validInvite.status).toBe('ACCEPTED');
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
