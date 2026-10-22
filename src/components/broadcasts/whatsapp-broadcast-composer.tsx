'use client';

import React from 'react';
import {
  BROADCAST_TEMPLATES,
  BroadcastTemplateType,
} from '@/modules/broadcast/broadcast.schema';
import { RSVP_STATUS, GUEST_SIDE } from '@/shared/constants';
import { BroadcastRecipientDTO } from '@/modules/broadcast/broadcast.service';

interface CeremonyOption {
  id: string;
  name: string;
}

interface WhatsAppBroadcastComposerProps {
  selectedTemplate: BroadcastTemplateType;
  onSelectTemplate: (t: BroadcastTemplateType) => void;
  rsvpFilter: string;
  onChangeRsvpFilter: (val: string) => void;
  sideFilter: string;
  onChangeSideFilter: (val: string) => void;
  ceremonyFilter: string;
  onChangeCeremonyFilter: (val: string) => void;
  ceremonies: CeremonyOption[];
  messageText: string;
  onChangeMessageText: (text: string) => void;
  sampleRecipient?: BroadcastRecipientDTO;
  coupleTitle: string;
}

export function WhatsAppBroadcastComposer({
  selectedTemplate,
  onSelectTemplate,
  rsvpFilter,
  onChangeRsvpFilter,
  sideFilter,
  onChangeSideFilter,
  ceremonyFilter,
  onChangeCeremonyFilter,
  ceremonies,
  messageText,
  onChangeMessageText,
  sampleRecipient,
  coupleTitle,
}: WhatsAppBroadcastComposerProps) {
  const templateTabs = [
    { type: BROADCAST_TEMPLATES.RSVP_REMINDER, label: '💌 RSVP Reminder', desc: 'Nudge unconfirmed guests' },
    { type: BROADCAST_TEMPLATES.CEREMONY_ITINERARY, label: '📅 Ceremony Guide', desc: 'Timings, venues & dress themes' },
    { type: BROADCAST_TEMPLATES.PHOTO_VAULT, label: '📸 Photo Vault', desc: 'Invite candid photo uploads' },
    { type: BROADCAST_TEMPLATES.VIRTUAL_LIVESTREAM, label: '🪔 Virtual Stream', desc: 'YouTube/Google Meet link' },
    { type: BROADCAST_TEMPLATES.CUSTOM, label: '✍️ Custom Note', desc: 'Announcements & updates' },
  ];

  const insertVariable = (variableName: string) => {
    onChangeMessageText(`${messageText} {{${variableName}}}`);
  };

  // Generate live preview text with sample recipient
  const livePreviewText = React.useMemo(() => {
    const guestName = sampleRecipient?.name || 'Aarav Sharma';
    const rsvpUrl = sampleRecipient?.personalInviteUrl || 'https://makemymarriage.com/invite/sample';
    return messageText
      .replace(/{{guestName}}/g, guestName)
      .replace(/{{coupleNames}}/g, coupleTitle)
      .replace(/{{rsvpUrl}}/g, rsvpUrl)
      .replace(/{{galleryUrl}}/g, 'https://makemymarriage.com/gallery/sample-vault')
      .replace(/{{websiteUrl}}/g, 'https://makemymarriage.com/w/sample')
      .replace(
        /{{ceremoniesList}}/g,
        '• Mehendi & Sangeet (Oct 19, 5:00 PM) — Royal Orchid\n• Pheras & Wedding (Oct 20, 11:00 AM) — Lake Palace [Theme: Pastel Gold]'
      );
  }, [messageText, sampleRecipient, coupleTitle]);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
      {/* Step 1: Template Selection Pills */}
      <div className="p-4 sm:p-6 border-b border-zinc-100 bg-zinc-50/50">
        <label className="text-xs font-bold text-zinc-700 block mb-3 uppercase tracking-wider">
          Step 1: Choose Message Purpose
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {templateTabs.map((tab) => {
            const isSelected = selectedTemplate === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => onSelectTemplate(tab.type)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-crimson bg-rose-50/60 shadow-xs ring-1 ring-brand-crimson/30'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <span className="font-serif font-bold text-xs text-zinc-900 block truncate">
                  {tab.label}
                </span>
                <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{tab.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Audience Filters & Editor */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Filters & Textarea */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-2 uppercase tracking-wider">
              Step 2: Filter Target Guest Segment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* RSVP status */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                  RSVP Status
                </label>
                <select
                  aria-label="Filter by RSVP status"
                  value={rsvpFilter}
                  onChange={(e) => onChangeRsvpFilter(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
                >
                  <option value="ALL">All RSVPs</option>
                  <option value={RSVP_STATUS.PENDING}>⏳ Pending RSVPs</option>
                  <option value={RSVP_STATUS.ATTENDING}>✅ Confirmed Attending</option>
                  <option value={RSVP_STATUS.NOT_ATTENDING}>❌ Declined</option>
                </select>
              </div>

              {/* Side */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                  Family Side
                </label>
                <select
                  aria-label="Filter by family side"
                  value={sideFilter}
                  onChange={(e) => onChangeSideFilter(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
                >
                  <option value="ALL">All Sides</option>
                  <option value={GUEST_SIDE.GROOM}>Groom Side (Ladkewale)</option>
                  <option value={GUEST_SIDE.BRIDE}>Bride Side (Ladkiwale)</option>
                  <option value={GUEST_SIDE.MUTUAL}>Mutual / Friends</option>
                </select>
              </div>

              {/* Ceremony */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                  Ceremony
                </label>
                <select
                  aria-label="Filter by ceremony"
                  value={ceremonyFilter}
                  onChange={(e) => onChangeCeremonyFilter(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-800 focus:border-brand-crimson focus:outline-hidden"
                >
                  <option value="">All Ceremonies</option>
                  {ceremonies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="broadcast-message-editor" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Step 3: Customize Message Body
              </label>
              <span className="text-[11px] text-zinc-400">Personalized per guest</span>
            </div>
            <textarea
              id="broadcast-message-editor"
              rows={8}
              value={messageText}
              onChange={(e) => onChangeMessageText(e.target.value)}
              className="w-full p-3.5 text-xs sm:text-sm font-sans rounded-2xl border border-zinc-300 bg-white focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson focus:outline-hidden transition-all leading-relaxed"
              placeholder="Write your customized wedding WhatsApp broadcast message..."
            />

            {/* Variable Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                Insert:
              </span>
              {[
                { tag: 'guestName', label: '👤 Guest Name' },
                { tag: 'coupleNames', label: '💑 Couple Names' },
                { tag: 'rsvpUrl', label: '🔗 RSVP Link' },
                { tag: 'ceremoniesList', label: '📅 Schedule' },
                { tag: 'galleryUrl', label: '📸 Vault Link' },
                { tag: 'websiteUrl', label: '🌐 Website Link' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Realistic WhatsApp Chat Simulator */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <label className="text-xs font-bold text-zinc-700 block mb-2 uppercase tracking-wider">
            Live WhatsApp Chat Preview
          </label>
          <div className="w-full rounded-2xl bg-[#0b141a] p-3 shadow-md border border-zinc-800 text-white font-sans text-xs">
            {/* WhatsApp Top Header Bar */}
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-800">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                💍
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-white truncate">{coupleTitle}</p>
                <p className="text-[10px] text-emerald-400">Make My Marriage Wedding Bot</p>
              </div>
              <span className="text-zinc-400 text-xs">🔒</span>
            </div>

            {/* Chat Body Wallpaper */}
            <div className="py-4 px-2 min-h-[220px] max-h-[340px] overflow-y-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] flex flex-col justify-end">
              {/* WhatsApp Message Bubble */}
              <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-xs shadow-sm max-w-[95%] self-end space-y-1.5 text-left animate-in fade-in duration-200">
                <p className="text-xs whitespace-pre-wrap leading-relaxed select-text font-sans">
                  {livePreviewText}
                </p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-zinc-300 pt-0.5">
                  <span>Just now</span>
                  <span className="text-[#53bdeb] font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Chat footer input mockup */}
            <div className="pt-2 text-[10px] text-zinc-400 text-center border-t border-zinc-800">
              Personalized link automatically generated for each guest
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
