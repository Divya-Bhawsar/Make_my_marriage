'use client';

import React, { useEffect, useState } from 'react';
import { WeddingMemberDTO } from '@/modules/member/member.service';
import { MemberInvitationDTO } from '@/modules/member/member-invitation.model';
import { UserRole, USER_ROLES } from '@/shared/constants';
import { TeamMetricStrip } from './team-metric-strip';
import { MemberList } from './member-list';
import { PendingInvitationsList } from './pending-invitations-list';
import { InviteMemberModal } from './invite-member-modal';

interface TeamManagerProps {
  initialMembers: WeddingMemberDTO[];
  initialInvitations: MemberInvitationDTO[];
  currentUserId: string;
  currentUserRole: UserRole;
  weddingTitle?: string;
}

export function TeamManager({
  initialMembers,
  initialInvitations,
  currentUserId,
  currentUserRole,
  weddingTitle,
}: TeamManagerProps) {
  const [members, setMembers] = useState<WeddingMemberDTO[]>(initialMembers);
  const [invitations, setInvitations] = useState<MemberInvitationDTO[]>(initialInvitations);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const isAdmin = currentUserRole === USER_ROLES.ADMIN;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const reloadData = async () => {
    setIsLoading(true);
    try {
      const membersRes = await fetch('/api/members');
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.data || []);
      }

      if (isAdmin) {
        const invitesRes = await fetch('/api/members/invitations');
        if (invitesRes.ok) {
          const data = await invitesRes.json();
          setInvitations(data.data || []);
        }
      }
    } catch {
      // Keep existing data
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: UserRole) => {
    const res = await fetch(`/api/members/${membershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to update member role');
    }

    setMembers((prev) =>
      prev.map((m) => (m.membershipId === membershipId ? { ...m, role: newRole } : m))
    );
    showFeedback('success', `Role successfully updated to ${newRole}.`);
  };

  const handleRemoveMember = async (membershipId: string) => {
    const res = await fetch(`/api/members/${membershipId}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to remove member');
    }

    setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
    showFeedback('success', 'Collaborator removed from wedding workspace.');
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    const res = await fetch(`/api/members/invitations/${invitationId}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to revoke invitation');
    }

    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    showFeedback('success', 'Invitation revoked successfully.');
  };

  const handleInvitationCreated = (newInvite: MemberInvitationDTO) => {
    setInvitations((prev) => [newInvite, ...prev]);
    showFeedback('success', `Invitation generated for ${newInvite.email}.`);
  };

  // Filtered members by search
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.user.name.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
              Wedding Committee &amp; Roles
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Collaborate with family coordinators, bridesmaids, groomsmen, and planners with role-based permissions.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-crimson hover:bg-brand-burgundy text-white font-semibold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>💌</span>
            <span>Invite Collaborator</span>
          </button>
        )}
      </div>

      {/* Role explanation banner for Managers */}
      {!isAdmin && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
          <span className="text-xl leading-none">🛡️</span>
          <div>
            <p className="font-bold">You are an Event Manager</p>
            <p className="text-blue-700 mt-0.5">
              You have operational access to coordinate ceremonies, RSVPs, vendor communications, and photo albums.
              Only Wedding Admins can invite new members or change team roles.
            </p>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Strip */}
      <TeamMetricStrip members={members} invitations={invitations} />

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/80 border border-zinc-200/80 self-start">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Active Committee ({members.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'invitations'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Pending Invites ({invitations.length})
            </button>
          )}
        </div>

        {activeTab === 'members' && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member or email..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-zinc-300 focus:border-brand-crimson focus:outline-hidden transition-all bg-white"
            />
            <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">🔍</span>
          </div>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'members' ? (
        <MemberList
          members={filteredMembers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onRoleChange={handleRoleChange}
          onRemoveMember={handleRemoveMember}
        />
      ) : (
        <PendingInvitationsList
          invitations={invitations}
          onRevoke={handleRevokeInvitation}
          weddingTitle={weddingTitle}
        />
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvitationCreated={handleInvitationCreated}
        weddingTitle={weddingTitle}
      />
    </div>
  );
}
