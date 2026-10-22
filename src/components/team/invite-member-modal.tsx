'use client';

import React, { useState } from 'react';
import { UserRole, USER_ROLES } from '@/shared/constants';
import { MemberInvitationDTO } from '@/modules/member/member-invitation.model';
import { resolveAbsoluteInviteUrl } from './team.utils';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationCreated: (invitation: MemberInvitationDTO) => void;
  weddingTitle?: string;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onInvitationCreated,
  weddingTitle,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.MANAGER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<MemberInvitationDTO | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setEmail('');
    setRole(USER_ROLES.MANAGER);
    setError(null);
    setCreatedInvite(null);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/members/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send invitation.');
      }

      setCreatedInvite(data.data);
      onInvitationCreated(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while inviting member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      const fullUrl = resolveAbsoluteInviteUrl(text);
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const getWhatsAppShareUrl = (invite: MemberInvitationDTO) => {
    const fullUrl = resolveAbsoluteInviteUrl(invite.inviteUrl);
    const text = `Namaste! You have been invited to join the wedding planning committee for ${
      weddingTitle || 'our wedding celebration'
    } as a ${invite.role === USER_ROLES.ADMIN ? 'Wedding Admin' : 'Event Manager'}.\n\nAccept your collaborator access here:\n${fullUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-sand/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-crimson to-brand-burgundy px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💌</span>
            <div>
              <h2 id="invite-modal-title" className="font-serif font-bold text-lg">
                Invite Wedding Committee Member
              </h2>
              <p className="text-xs text-white/80">
                Grant role-based coordination access to your trusted squad
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white text-xl font-bold p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdInvite ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <h3 className="font-serif font-bold text-emerald-900 text-base">
                  Invitation Created Successfully!
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Invite link generated for <strong>{createdInvite.email}</strong> as{' '}
                  <span className="font-semibold uppercase">{createdInvite.role}</span>.
                </p>
              </div>

              {/* Share link box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">
                  Collaborator Invitation Link (Valid 7 days)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resolveAbsoluteInviteUrl(createdInvite.inviteUrl)}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 font-mono text-zinc-700 select-all focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdInvite.inviteUrl)}
                    className="shrink-0 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={getWhatsAppShareUrl(createdInvite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  <span className="text-sm">💬</span>
                  <span>Share on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Invite Another
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <span className="text-base leading-none">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="member-email" className="text-xs font-semibold text-zinc-700">
                  Collaborator Email Address
                </label>
                <input
                  id="member-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. brother@example.com, cousin@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson text-sm outline-hidden transition-all"
                />
                <p className="text-[11px] text-zinc-500">
                  The collaborator must sign into Make My Marriage with this exact email to accept.
                </p>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Assign Authority Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Manager Option */}
                  <div
                    onClick={() => setRole(USER_ROLES.MANAGER)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      role === USER_ROLES.MANAGER
                        ? 'border-brand-crimson bg-rose-50/40 ring-1 ring-brand-crimson/30'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🛡️</span>
                      <span className="font-serif font-bold text-sm text-zinc-900">Event Manager</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      Operational access: Manage guest RSVPs, rituals, vendor contacts, and photo vault.
                      Cannot remove members or alter core wedding settings.
                    </p>
                  </div>

                  {/* Admin Option */}
                  <div
                    onClick={() => setRole(USER_ROLES.ADMIN)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      role === USER_ROLES.ADMIN
                        ? 'border-brand-crimson bg-rose-50/40 ring-1 ring-brand-crimson/30'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">👑</span>
                      <span className="font-serif font-bold text-sm text-zinc-900">Wedding Admin</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      Full authority: Invite and manage collaborators, edit financial ledgers, customize
                      website domains, and delete ceremonies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="px-5 py-2.5 rounded-xl bg-brand-crimson text-white text-xs font-bold shadow-md hover:bg-brand-burgundy transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Generating Invite...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Invitation</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
