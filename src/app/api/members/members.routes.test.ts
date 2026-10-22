import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMembers } from './route';
import { PATCH as patchMember, DELETE as deleteMember } from './[membershipId]/route';
import { GET as getInvitations, POST as postInvitation } from './invitations/route';
import { DELETE as deleteInvitation } from './invitations/[invitationId]/route';
import { GET as getPublicInvitation } from '../public/member-invitations/[token]/route';
import { POST as acceptInvitation } from '../member-invitations/[token]/accept/route';
import { MemberService } from '@/modules/member/member.service';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Member & Invitations API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAdminContext = {
    user: { id: 'u1', name: 'Vivek', email: 'vivek@example.com' },
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

  const mockManagerContext = {
    ...mockAdminContext,
    role: USER_ROLES.MANAGER,
  };

  describe('GET /api/members', () => {
    it('returns list of members for authenticated wedding member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockManagerContext);
      vi.spyOn(MemberService, 'listMembers').mockResolvedValue([
        {
          membershipId: 'm1',
          user: { id: 'u1', name: 'Vivek', email: 'vivek@example.com' },
          role: USER_ROLES.ADMIN,
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/members');
      const res = await getMembers(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].membershipId).toBe('m1');
    });
  });

  describe('PATCH /api/members/:membershipId', () => {
    it('returns 403 if user is not an ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockManagerContext);

      const req = new NextRequest('http://localhost:3000/api/members/m1', {
        method: 'PATCH',
        body: JSON.stringify({ role: USER_ROLES.MANAGER }),
      });
      const res = await patchMember(req, { params: { membershipId: 'm1' } });
      expect(res.status).toBe(403);
    });

    it('updates member role when called by ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockAdminContext);
      vi.spyOn(MemberService, 'updateMemberRole').mockResolvedValue({
        membershipId: 'm2',
        user: { id: 'u2', name: 'Rohan', email: 'rohan@example.com' },
        role: USER_ROLES.MANAGER,
        joinedAt: '2026-01-01T00:00:00.000Z',
      });

      const req = new NextRequest('http://localhost:3000/api/members/m2', {
        method: 'PATCH',
        body: JSON.stringify({ role: USER_ROLES.MANAGER }),
      });
      const res = await patchMember(req, { params: { membershipId: 'm2' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.role).toBe(USER_ROLES.MANAGER);
    });
  });

  describe('DELETE /api/members/:membershipId', () => {
    it('returns 403 if user is not an ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockManagerContext);

      const req = new NextRequest('http://localhost:3000/api/members/m1', {
        method: 'DELETE',
      });
      const res = await deleteMember(req, { params: { membershipId: 'm1' } });
      expect(res.status).toBe(403);
    });

    it('removes member when called by ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockAdminContext);
      vi.spyOn(MemberService, 'removeMember').mockResolvedValue({
        success: true,
        id: 'm2',
      });

      const req = new NextRequest('http://localhost:3000/api/members/m2', {
        method: 'DELETE',
      });
      const res = await deleteMember(req, { params: { membershipId: 'm2' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET & POST /api/members/invitations', () => {
    it('GET returns 403 if user is not an ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockManagerContext);

      const req = new NextRequest('http://localhost:3000/api/members/invitations');
      const res = await getInvitations(req);
      expect(res.status).toBe(403);
    });

    it('GET returns list of invitations for ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockAdminContext);
      vi.spyOn(MemberService, 'listInvitations').mockResolvedValue([
        {
          id: 'inv1',
          weddingId: 'w1',
          email: 'pending@example.com',
          role: USER_ROLES.MANAGER,
          token: 'token123',
          status: 'PENDING',
          expiresAt: '2026-10-25T00:00:00.000Z',
          createdAt: '2026-10-18T00:00:00.000Z',
          isExpired: false,
          inviteUrl: 'http://localhost:3000/member-invitation/token123',
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/members/invitations');
      const res = await getInvitations(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toHaveLength(1);
    });

    it('POST returns 201 and creates invitation for ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockAdminContext);
      vi.spyOn(MemberService, 'createInvitation').mockResolvedValue({
        id: 'inv1',
        weddingId: 'w1',
        email: 'collaborator@example.com',
        role: USER_ROLES.MANAGER,
        token: 'token123',
        status: 'PENDING',
        expiresAt: '2026-10-25T00:00:00.000Z',
        createdAt: '2026-10-18T00:00:00.000Z',
        isExpired: false,
        inviteUrl: 'http://localhost:3000/member-invitation/token123',
      });

      const req = new NextRequest('http://localhost:3000/api/members/invitations', {
        method: 'POST',
        body: JSON.stringify({
          email: 'collaborator@example.com',
          role: USER_ROLES.MANAGER,
        }),
      });
      const res = await postInvitation(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data.email).toBe('collaborator@example.com');
    });
  });

  describe('DELETE /api/members/invitations/:invitationId', () => {
    it('revokes invitation when called by ADMIN', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockAdminContext);
      vi.spyOn(MemberService, 'revokeInvitation').mockResolvedValue({
        success: true,
        id: 'inv1',
      });

      const req = new NextRequest('http://localhost:3000/api/members/invitations/inv1', {
        method: 'DELETE',
      });
      const res = await deleteInvitation(req, { params: { invitationId: 'inv1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/public/member-invitations/:token', () => {
    it('returns public invitation without authentication', async () => {
      vi.spyOn(MemberService, 'getPublicInvitationByToken').mockResolvedValue({
        email: 'collab@example.com',
        role: USER_ROLES.MANAGER,
        wedding: {
          id: 'w1',
          brideName: 'Eisha',
          groomName: 'Vivek',
          weddingDate: '2026-10-20',
          title: 'Vivek & Eisha',
        },
        expiresAt: '2026-10-25T00:00:00.000Z',
      });

      const req = new NextRequest('http://localhost:3000/api/public/member-invitations/tok123');
      const res = await getPublicInvitation(req, { params: { token: 'tok123' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.email).toBe('collab@example.com');
      expect(data.data.wedding.brideName).toBe('Eisha');
    });
  });

  describe('POST /api/member-invitations/:token/accept', () => {
    it('accepts invitation for authenticated user', async () => {
      vi.spyOn(sessionHelpers, 'requireAuth').mockResolvedValue({
        user: { id: 'u2', name: 'Rohan', email: 'collab@example.com' },
        session: {} as any,
        membership: null,
        wedding: null,
      });

      vi.spyOn(MemberService, 'acceptInvitation').mockResolvedValue({
        weddingId: 'w1',
        role: USER_ROLES.MANAGER,
      });

      const req = new NextRequest('http://localhost:3000/api/member-invitations/tok123/accept', {
        method: 'POST',
      });
      const res = await acceptInvitation(req, { params: { token: 'tok123' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.weddingId).toBe('w1');
    });
  });
});
