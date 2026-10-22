'use client';

import React, { useState } from 'react';
import { BroadcastRecipientDTO } from '@/modules/broadcast/broadcast.service';
import { RSVP_STATUS } from '@/shared/constants';

interface BroadcastRecipientTableProps {
  recipients: BroadcastRecipientDTO[];
  onCopyText: (text: string) => void;
}

export function BroadcastRecipientTable({
  recipients,
  onCopyText,
}: BroadcastRecipientTableProps) {
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleLaunchWhatsApp = (guestId: string, url: string) => {
    setSentMap((prev) => ({ ...prev, [guestId]: true }));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = (guestId: string, message: string) => {
    onCopyText(message);
    setCopiedId(guestId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = recipients.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || (r.phone && r.phone.includes(q));
  });

  if (recipients.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-8 text-center space-y-2">
        <span className="text-4xl block">🔍</span>
        <h3 className="font-serif font-bold text-zinc-900 text-base">No Matching Guests Found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No guests match your current audience filter. Try adjusting the RSVP status, family side,
          or ceremony options above.
        </p>
      </div>
    );
  }

  const sentCount = Object.keys(sentMap).length;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
      {/* Top Bar with Search & Progress */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-zinc-900 text-sm">
            Recipients List ({filtered.length})
          </span>
          {sentCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-in fade-in">
              ✓ {sentCount} Launched this session
            </span>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-zinc-300 focus:border-brand-crimson focus:outline-hidden transition-all bg-white"
          />
          <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Recipient Rows */}
      <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
        {filtered.map((recipient) => {
          const isSent = Boolean(sentMap[recipient.guestId]);
          const isCopied = copiedId === recipient.guestId;

          return (
            <div
              key={recipient.guestId}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-zinc-50/70 transition-colors"
            >
              {/* Guest Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-sm font-bold shadow-xs ${
                    recipient.hasPhone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {recipient.hasPhone ? '💬' : '⚠️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-zinc-900 text-sm truncate">
                      {recipient.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {recipient.side}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        recipient.rsvpStatus === RSVP_STATUS.ATTENDING
                          ? 'bg-emerald-100 text-emerald-800'
                          : recipient.rsvpStatus === RSVP_STATUS.NOT_ATTENDING
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {recipient.rsvpStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span>{recipient.phoneDisplay}</span>
                    <span>&bull;</span>
                    <span>
                      {recipient.rsvpStatus === RSVP_STATUS.ATTENDING
                        ? `${recipient.attendingCount ?? recipient.maxGuests} Plates Confirmed`
                        : `Max ${recipient.maxGuests} Guests Allowed`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:justify-end shrink-0">
                {/* Copy personalized text button */}
                <button
                  type="button"
                  onClick={() => handleCopy(recipient.guestId, recipient.personalizedMessage)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isCopied ? '✓' : '📋'}</span>
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Direct WhatsApp Launcher Button */}
                <button
                  type="button"
                  onClick={() => handleLaunchWhatsApp(recipient.guestId, recipient.whatsappUrl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    isSent
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : recipient.hasPhone
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-900 text-white'
                  }`}
                >
                  <span>{isSent ? '✓' : '💬'}</span>
                  <span>{isSent ? 'Sent (Re-send)' : 'Send WhatsApp'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
