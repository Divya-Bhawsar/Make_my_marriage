import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { TeamMetricStrip } from '../team-metric-strip';
import { MemberList } from '../member-list';
import { PendingInvitationsList } from '../pending-invitations-list';
import { InviteMemberModal } from '../invite-member-modal';
import { PublicMemberInvitationView } from '../public-member-invitation-view';
import { WeddingMemberDTO } from '@/modules/member/member.service';
import { MemberInvitationDTO } from '@/modules/member/member-invitation.model';
import { USER_ROLES } from '@/shared/constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/team',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Team & Committee Components', () => {
  const mockMembers: WeddingMemberDTO[] = [
    {
      membershipId: 'm1',
      user: {
        id: 'u1',
        name: 'Vivek Sharma',
        email: 'vivek@example.com',
      },
      role: USER_ROLES.ADMIN,
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      membershipId: 'm2',
      user: {
        id: 'u2',
        name: 'Eisha Patel',
        email: 'eisha@example.com',
      },
      role: USER_ROLES.MANAGER,
      joinedAt: '2026-01-05T00:00:00.000Z',
    },
  ];

  const mockInvitations: MemberInvitationDTO[] = [
    {
      id: 'inv1',
      weddingId: 'w1',
      email: 'brother@example.com',
      role: USER_ROLES.MANAGER,
      token: 'tok12345678',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      isExpired: false,
      inviteUrl: 'http://localhost:3000/member-invitation/tok12345678',
    },
  ];

  describe('TeamMetricStrip', () => {
    it('renders accurate metric numbers and labels', () => {
      const html = normalizeHtml(
        renderToString(
          <TeamMetricStrip members={mockMembers} invitations={mockInvitations} />
        )
      );

      expect(html).toContain('Total Committee');
      expect(html).toContain('Wedding Admins');
      expect(html).toContain('Event Managers');
      expect(html).toContain('Pending Invites');

      // Check numbers
      expect(html).toContain('>2<'); // 2 members
      expect(html).toContain('>1<'); // 1 admin, 1 manager, 1 pending
    });
  });

  describe('MemberList', () => {
    it('renders member rows with names, emails, and roles', () => {
      const html = normalizeHtml(
        renderToString(
          <MemberList
            members={mockMembers}
            currentUserId="u1"
            currentUserRole={USER_ROLES.ADMIN}
            onRoleChange={vi.fn()}
            onRemoveMember={vi.fn()}
          />
        )
      );

      expect(html).toContain('Vivek Sharma');
      expect(html).toContain('vivek@example.com');
      expect(html).toContain('Eisha Patel');
      expect(html).toContain('eisha@example.com');
      expect(html).toContain('You');
      expect(html).toContain('👑');
      expect(html).toContain('🛡️');
    });

    it('disables demoting and removing the last ADMIN', () => {
      // Single admin in wedding
      const singleAdminMembers: WeddingMemberDTO[] = [
        {
          membershipId: 'm1',
          user: { id: 'u1', name: 'Vivek Sharma', email: 'vivek@example.com' },
          role: USER_ROLES.ADMIN,
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const html = normalizeHtml(
        renderToString(
          <MemberList
            members={singleAdminMembers}
            currentUserId="u1"
            currentUserRole={USER_ROLES.ADMIN}
            onRoleChange={vi.fn()}
            onRemoveMember={vi.fn()}
          />
        )
      );

      expect(html).toContain('disabled');
      expect(html).toContain('Cannot demote the last wedding Admin');
      expect(html).toContain('Cannot remove the last wedding Admin');
    });

    it('shows read-only view when current user is MANAGER', () => {
      const html = normalizeHtml(
        renderToString(
          <MemberList
            members={mockMembers}
            currentUserId="u2"
            currentUserRole={USER_ROLES.MANAGER}
            onRoleChange={vi.fn()}
            onRemoveMember={vi.fn()}
          />
        )
      );

      expect(html).toContain('Managed by Admins');
      expect(html).not.toContain('<select');
    });

    it('renders empty placeholder if no members exist', () => {
      const html = normalizeHtml(
        renderToString(
          <MemberList
            members={[]}
            currentUserId="u1"
            currentUserRole={USER_ROLES.ADMIN}
            onRoleChange={vi.fn()}
            onRemoveMember={vi.fn()}
          />
        )
      );

      expect(html).toContain('No Committee Members Found');
    });
  });

  describe('PendingInvitationsList', () => {
    it('renders pending invitations with WhatsApp and Copy actions', () => {
      const html = normalizeHtml(
        renderToString(
          <PendingInvitationsList
            invitations={mockInvitations}
            onRevoke={vi.fn()}
            weddingTitle="Vivek & Eisha"
          />
        )
      );

      expect(html).toContain('brother@example.com');
      expect(html).toContain('MANAGER');
      expect(html).toContain('Copy Link');
      expect(html).toContain('WhatsApp');
      expect(html).toContain('api.whatsapp.com/send');
    });

    it('renders empty state when no pending invitations', () => {
      const html = normalizeHtml(
        renderToString(
          <PendingInvitationsList
            invitations={[]}
            onRevoke={vi.fn()}
          />
        )
      );

      expect(html).toContain('No Pending Invitations');
    });
  });

  describe('InviteMemberModal', () => {
    it('returns null when closed', () => {
      const html = renderToString(
        <InviteMemberModal
          isOpen={false}
          onClose={vi.fn()}
          onInvitationCreated={vi.fn()}
        />
      );

      expect(html).toBe('');
    });

    it('renders dialog form with role options when open', () => {
      const html = normalizeHtml(
        renderToString(
          <InviteMemberModal
            isOpen={true}
            onClose={vi.fn()}
            onInvitationCreated={vi.fn()}
          />
        )
      );

      expect(html).toContain('Invite Wedding Committee Member');
      expect(html).toContain('Collaborator Email Address');
      expect(html).toContain('Event Manager');
      expect(html).toContain('Wedding Admin');
      expect(html).toContain('Generate Invitation');
    });
  });

  describe('PublicMemberInvitationView', () => {
    it('renders initial loading state with luxury theme', () => {
      const html = normalizeHtml(
        renderToString(
          <PublicMemberInvitationView token="test-token" />
        )
      );

      expect(html).toContain('Opening your wedding committee invitation...');
    });
  });
});
