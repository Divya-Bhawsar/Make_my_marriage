'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/landing/logo';
import { PublicMemberInvitationDTO } from '@/modules/member/member.service';
import { USER_ROLES } from '@/shared/constants';

interface PublicMemberInvitationViewProps {
  token: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailNormalized?: string;
}

export function PublicMemberInvitationView({ token }: PublicMemberInvitationViewProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<PublicMemberInvitationDTO | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Load public invitation
        const inviteRes = await fetch(`/api/public/member-invitations/${token}`);
        const inviteData = await inviteRes.json();

        if (!inviteRes.ok) {
          throw new Error(inviteData.error?.message || 'Invalid or expired invitation link.');
        }

        setInvitation(inviteData.data);

        // 2. Check if user is logged in
        try {
          const authRes = await fetch('/api/auth/me');
          if (authRes.ok) {
            const authData = await authRes.json();
            setCurrentUser(authData.data.user);
          }
        } catch {
          // Unauthenticated is expected for new invitees
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [token]);

  const handleAccept = async () => {
    setError(null);
    setIsAccepting(true);

    try {
      const res = await fetch(`/api/member-invitations/${token}/accept`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to accept invitation.');
      }

      setAcceptSuccess(true);
      setTimeout(() => {
        router.push('/app');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join wedding workspace.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-ivory/60 via-white to-brand-sand/30 p-4">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-brand-crimson border-t-transparent" />
          <p className="text-sm font-medium text-zinc-600 font-serif">
            Opening your wedding committee invitation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-ivory/60 via-white to-brand-sand/30 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl text-center space-y-4">
          <span className="text-4xl block">✉️</span>
          <h1 className="font-serif font-extrabold text-xl text-zinc-900">
            Invitation Not Available
          </h1>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {error || 'This wedding invitation link has expired or has already been accepted.'}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-crimson text-white text-xs font-bold hover:bg-brand-burgundy transition-all"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coupleNames =
    invitation.wedding.title || `${invitation.wedding.brideName} & ${invitation.wedding.groomName}`;
  const isEmailMatch =
    currentUser && currentUser.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-brand-ivory/80 via-white to-brand-sand/40 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-brand-sand/80 shadow-2xl overflow-hidden">
        {/* Luxury Header Banner */}
        <div className="bg-gradient-to-r from-brand-crimson via-brand-burgundy to-brand-crimson p-6 sm:p-8 text-white text-center relative">
          <div className="inline-flex items-center justify-center mb-3">
            <Logo size="md" />
          </div>
          <p className="text-xs font-bold tracking-widest uppercase text-brand-gold">
            Official Committee Invitation
          </p>
          <h1 className="font-serif font-extrabold text-2xl sm:text-3xl mt-1 tracking-tight">
            {coupleNames}
          </h1>
          <p className="text-xs text-white/80 mt-1 font-serif">
            Wedding Date: {new Date(invitation.wedding.weddingDate).toLocaleDateString(undefined, {
              dateStyle: 'long',
            })}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {acceptSuccess ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-2 animate-in fade-in">
              <span className="text-4xl block">🎉</span>
              <h2 className="font-serif font-bold text-lg text-emerald-900">
                Welcome to the Wedding Team!
              </h2>
              <p className="text-xs text-emerald-700">
                You are now an active collaborator. Redirecting to your wedding command center...
              </p>
            </div>
          ) : (
            <>
              {/* Role Badge & Invitation Card */}
              <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-5 text-center space-y-2">
                <span className="text-3xl block">
                  {invitation.role === USER_ROLES.ADMIN ? '👑' : '🛡️'}
                </span>
                <p className="text-xs font-semibold text-zinc-600">
                  You have been invited to join the wedding planning squad as:
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-serif font-extrabold text-sm tracking-wide">
                  {invitation.role === USER_ROLES.ADMIN ? 'Wedding Admin' : 'Event Manager'}
                </div>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  {invitation.role === USER_ROLES.ADMIN
                    ? 'Full authority to oversee budgets, invite committee members, configure live streams, and manage all ceremonies.'
                    : 'Operational authority to coordinate ritual checklists, update guest RSVPs, communicate with vendors, and manage photo vaults.'}
                </p>
              </div>

              {/* Account Match & Acceptance Flow */}
              {!currentUser ? (
                /* Unauthenticated View */
                <div className="space-y-4 text-center">
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-600">
                    <p className="font-semibold text-zinc-800">
                      Invitation sent to: <strong>{invitation.email}</strong>
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Please log in or sign up using this email address to accept your invitation.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/login?returnUrl=/member-invitation/${token}`}
                      className="flex-1 py-3 px-4 rounded-xl bg-brand-crimson hover:bg-brand-burgundy text-white font-bold text-xs shadow-md transition-all text-center"
                    >
                      Sign In to Accept
                    </Link>
                    <Link
                      href={`/signup?email=${encodeURIComponent(
                        invitation.email
                      )}&returnUrl=/member-invitation/${token}`}
                      className="flex-1 py-3 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs transition-all text-center"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              ) : isEmailMatch ? (
                /* Authenticated & Email Matches */
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
                    <span className="text-base leading-none">✓</span>
                    <span>
                      Signed in as <strong>{currentUser.email}</strong>. Ready to join!
                    </span>
                  </div>

                  <button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="w-full py-3.5 px-4 rounded-2xl bg-brand-crimson hover:bg-brand-burgundy text-white font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isAccepting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Joining Wedding Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Accept &amp; Enter Wedding Workspace</span>
                        <span>&rarr;</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Authenticated but Email Mismatch */
                <div className="space-y-4">
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>Account Email Mismatch</span>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      This invitation was issued to <strong>{invitation.email}</strong>, but you are
                      currently signed in as <strong>{currentUser.email}</strong>.
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sign Out &amp; Switch Account
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
