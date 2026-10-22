'use client';

import React, { useState } from 'react';
import { WeddingMemberDTO } from '@/modules/member/member.service';
import { UserRole, USER_ROLES } from '@/shared/constants';

interface MemberListProps {
  members: WeddingMemberDTO[];
  currentUserId: string;
  currentUserRole: UserRole;
  onRoleChange: (membershipId: string, newRole: UserRole) => Promise<void>;
  onRemoveMember: (membershipId: string) => Promise<void>;
}

export function MemberList({
  members,
  currentUserId,
  currentUserRole,
  onRoleChange,
  onRemoveMember,
}: MemberListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = currentUserRole === USER_ROLES.ADMIN;
  const adminCount = members.filter((m) => m.role === USER_ROLES.ADMIN).length;

  const handleRoleSelect = async (membershipId: string, newRole: UserRole) => {
    setActionError(null);
    setUpdatingId(membershipId);
    try {
      await onRoleChange(membershipId, newRole);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update member role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (membershipId: string) => {
    setActionError(null);
    setRemovingId(membershipId);
    try {
      await onRemoveMember(membershipId);
      setConfirmRemoveId(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <span className="text-4xl block mb-2">👥</span>
        <h3 className="font-serif font-bold text-zinc-900 text-base">No Committee Members Found</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Invite your family coordinators, siblings, and event managers to collaborate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs divide-y divide-zinc-100 overflow-hidden">
        {members.map((member) => {
          const isCurrentUser = member.user.id === currentUserId;
          const isLastAdmin = member.role === USER_ROLES.ADMIN && adminCount <= 1;
          const isUpdating = updatingId === member.membershipId;
          const isRemoving = removingId === member.membershipId;
          const isConfirming = confirmRemoveId === member.membershipId;

          // Avatar gradient seed
          const initial = (member.user.name || member.user.email || 'M').charAt(0).toUpperCase();

          return (
            <div
              key={member.membershipId}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
            >
              {/* Member Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-tr from-brand-crimson to-amber-600 text-white font-serif font-bold text-base flex items-center justify-center shadow-xs">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-zinc-900 text-sm truncate">
                      {member.user.name || 'Collaborator'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
                        You
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.role === USER_ROLES.ADMIN
                          ? 'bg-rose-100 text-brand-crimson'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span>{member.role === USER_ROLES.ADMIN ? '👑' : '🛡️'}</span>
                      <span>{member.role}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 truncate mt-0.5">
                    <span className="truncate">{member.user.email}</span>
                    <span>&bull;</span>
                    <span className="shrink-0">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 sm:justify-end shrink-0">
                {isAdmin ? (
                  <>
                    {/* Role dropdown */}
                    <div className="relative">
                      <select
                        aria-label="Change member role"
                        value={member.role}
                        disabled={isUpdating || (isLastAdmin && member.role === USER_ROLES.ADMIN)}
                        onChange={(e) =>
                          handleRoleSelect(member.membershipId, e.target.value as UserRole)
                        }
                        className={`text-xs font-semibold rounded-xl border px-3 py-1.5 focus:outline-hidden transition-all cursor-pointer ${
                          isLastAdmin
                            ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                            : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400 focus:border-brand-crimson'
                        }`}
                        title={
                          isLastAdmin
                            ? 'Cannot demote the last wedding Admin. Promote another member first.'
                            : undefined
                        }
                      >
                        <option value={USER_ROLES.ADMIN}>👑 Admin (Full Access)</option>
                        <option value={USER_ROLES.MANAGER}>🛡️ Manager (Operations)</option>
                      </select>
                    </div>

                    {/* Remove Member Button */}
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <button
                          onClick={() => handleRemove(member.membershipId)}
                          disabled={isRemoving}
                          className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          {isRemoving ? 'Removing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(member.membershipId)}
                        disabled={isLastAdmin}
                        title={
                          isLastAdmin
                            ? 'Cannot remove the last wedding Admin.'
                            : 'Remove collaborator from wedding workspace'
                        }
                        className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isLastAdmin
                            ? 'text-zinc-300 cursor-not-allowed'
                            : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        aria-label="Remove collaborator"
                      >
                        🗑️
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-zinc-400 italic">Managed by Admins</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
