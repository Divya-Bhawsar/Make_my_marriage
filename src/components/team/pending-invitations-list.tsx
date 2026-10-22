'use client';

import React, { useState } from 'react';
import { MemberInvitationDTO } from '@/modules/member/member-invitation.model';
import { USER_ROLES } from '@/shared/constants';

import { resolveAbsoluteInviteUrl } from './team.utils';

interface PendingInvitationsListProps {
  invitations: MemberInvitationDTO[];
  onRevoke: (invitationId: string) => Promise<void>;
  weddingTitle?: string;
}

export function PendingInvitationsList({
  invitations,
  onRevoke,
  weddingTitle,
}: PendingInvitationsListProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (id: string, url: string) => {
    try {
      const fullUrl = resolveAbsoluteInviteUrl(url);
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleRevoke = async (invitationId: string) => {
    setError(null);
    setRevokingId(invitationId);
    try {
      await onRevoke(invitationId);
      setConfirmRevokeId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  const getWhatsAppShareUrl = (invite: MemberInvitationDTO) => {
    const fullUrl = resolveAbsoluteInviteUrl(invite.inviteUrl);
    const text = `Namaste! You have been invited to join the wedding planning committee for ${
      weddingTitle || 'our celebration'
    } as a ${invite.role === USER_ROLES.ADMIN ? 'Wedding Admin' : 'Event Manager'}.\n\nAccept your collaborator access here:\n${fullUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  if (invitations.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <span className="text-4xl block mb-2">✉️</span>
        <h3 className="font-serif font-bold text-zinc-900 text-base">No Pending Invitations</h3>
        <p className="text-xs text-zinc-500 mt-1">
          All invited collaborators have accepted their invitations or no invitations have been sent yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs divide-y divide-zinc-100 overflow-hidden">
        {invitations.map((inv) => {
          const isCopied = copiedId === inv.id;
          const isRevoking = revokingId === inv.id;
          const isConfirming = confirmRevokeId === inv.id;

          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return (
            <div
              key={inv.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
            >
              {/* Invite info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/70 font-bold text-base flex items-center justify-center">
                  ✉️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-zinc-900 text-sm truncate">
                      {inv.email}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.role === USER_ROLES.ADMIN
                          ? 'bg-rose-100 text-brand-crimson'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span>{inv.role === USER_ROLES.ADMIN ? '👑' : '🛡️'}</span>
                      <span>{inv.role}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span>Sent {new Date(inv.createdAt).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span className={daysLeft <= 1 ? 'text-rose-600 font-medium' : 'text-zinc-600'}>
                      {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} days`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share & Revoke Actions */}
              <div className="flex items-center gap-2 sm:justify-end shrink-0">
                {/* Copy Link */}
                <button
                  type="button"
                  onClick={() => handleCopy(inv.id, inv.inviteUrl)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isCopied ? '✓' : '📋'}</span>
                  <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                </button>

                {/* WhatsApp */}
                <a
                  href={getWhatsAppShareUrl(inv)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="text-sm">💬</span>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>

                {/* Revoke */}
                {isConfirming ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={isRevoking}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {isRevoking ? 'Revoking...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmRevokeId(null)}
                      className="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRevokeId(inv.id)}
                    className="p-2 rounded-xl text-xs text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Revoke invitation"
                    aria-label="Revoke invitation"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
