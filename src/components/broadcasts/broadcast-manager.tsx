'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BROADCAST_TEMPLATES,
  BroadcastTemplateType,
} from '@/modules/broadcast/broadcast.schema';
import {
  BroadcastRecipientDTO,
  BroadcastPreviewResult,
} from '@/modules/broadcast/broadcast.service';
import { BroadcastMetricStrip } from './broadcast-metric-strip';
import { WhatsAppBroadcastComposer } from './whatsapp-broadcast-composer';
import { BroadcastRecipientTable } from './broadcast-recipient-table';
import { ExportCenterCard } from './export-center-card';

interface CeremonyOption {
  id: string;
  name: string;
}

interface BroadcastManagerProps {
  initialResult: BroadcastPreviewResult;
  ceremonies: CeremonyOption[];
  coupleTitle: string;
}

export function BroadcastManager({
  initialResult,
  ceremonies,
  coupleTitle,
}: BroadcastManagerProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'exports'>('whatsapp');
  const [selectedTemplate, setSelectedTemplate] = useState<BroadcastTemplateType>(
    initialResult.template || BROADCAST_TEMPLATES.RSVP_REMINDER
  );
  const [rsvpFilter, setRsvpFilter] = useState('ALL');
  const [sideFilter, setSideFilter] = useState('ALL');
  const [ceremonyFilter, setCeremonyFilter] = useState('');
  const [messageText, setMessageText] = useState(initialResult.templateMessage);
  const [recipients, setRecipients] = useState<BroadcastRecipientDTO[]>(
    initialResult.recipients || []
  );
  const [summary, setSummary] = useState(initialResult.summary);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadRecipients = useCallback(async (template: BroadcastTemplateType, rsvp: string, side: string, ceremony: string, customMsg?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/broadcasts/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          rsvpStatus: rsvp,
          side,
          eventId: ceremony || undefined,
          customMessage: customMsg,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const result: BroadcastPreviewResult = data.data;
        setRecipients(result.recipients || []);
        setSummary(result.summary);
        setMessageText(result.templateMessage);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectTemplate = (template: BroadcastTemplateType) => {
    setSelectedTemplate(template);
    loadRecipients(template, rsvpFilter, sideFilter, ceremonyFilter);
  };

  const handleRsvpFilterChange = (rsvp: string) => {
    setRsvpFilter(rsvp);
    loadRecipients(selectedTemplate, rsvp, sideFilter, ceremonyFilter, messageText);
  };

  const handleSideFilterChange = (side: string) => {
    setSideFilter(side);
    loadRecipients(selectedTemplate, rsvpFilter, side, ceremonyFilter, messageText);
  };

  const handleCeremonyFilterChange = (ceremony: string) => {
    setCeremonyFilter(ceremony);
    loadRecipients(selectedTemplate, rsvpFilter, sideFilter, ceremony, messageText);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
              WhatsApp Broadcasts &amp; Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Dispatch personalized WhatsApp invitations, RSVP nudges, and export CSV run-sheets for family squads and caterers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/90 border border-zinc-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>💬</span>
            <span>WhatsApp Broadcasts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exports'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>📑</span>
            <span>Reports &amp; Exports</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-2xl bg-zinc-900 text-white p-3 text-xs font-semibold shadow-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Strip */}
      <BroadcastMetricStrip
        totalRecipients={summary.totalRecipients}
        phoneReadyCount={summary.phoneReadyCount}
        pendingRsvpCount={summary.pendingRsvpCount}
        attendingCount={summary.attendingCount}
      />

      {activeTab === 'whatsapp' ? (
        <div className="space-y-6">
          {/* Message Composer & Live Chat Simulation */}
          <WhatsAppBroadcastComposer
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
            rsvpFilter={rsvpFilter}
            onChangeRsvpFilter={handleRsvpFilterChange}
            sideFilter={sideFilter}
            onChangeSideFilter={handleSideFilterChange}
            ceremonyFilter={ceremonyFilter}
            onChangeCeremonyFilter={handleCeremonyFilterChange}
            ceremonies={ceremonies}
            messageText={messageText}
            onChangeMessageText={setMessageText}
            sampleRecipient={recipients[0]}
            coupleTitle={coupleTitle}
          />

          {/* Recipient Action Table */}
          <BroadcastRecipientTable
            recipients={recipients}
            onCopyText={(text) => {
              navigator.clipboard.writeText(text);
              showToast('Personalized message copied to clipboard!');
            }}
          />
        </div>
      ) : (
        <ExportCenterCard />
      )}
    </div>
  );
}
