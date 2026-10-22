'use client';

import React, { useState, useMemo } from 'react';
import { generateQRSVG, generateQRDataURL } from '@/shared/utils/qr-code';
import { Logo } from '@/components/landing/logo';

interface TableQRCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  isEnabled: boolean;
  guestUploadsEnabled: boolean;
  onUpdateSettings: (settings: { isEnabled?: boolean; guestUploadsEnabled?: boolean; regenerateToken?: boolean }) => Promise<void>;
}

export function TableQRCardModal({
  isOpen,
  onClose,
  token,
  brideName,
  groomName,
  weddingDate,
  isEnabled,
  guestUploadsEnabled,
  onUpdateSettings,
}: TableQRCardModalProps) {
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  const publicGalleryUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (
        isLocal &&
        configuredAppUrl &&
        !configuredAppUrl.includes('localhost') &&
        !configuredAppUrl.includes('127.0.0.1')
      ) {
        return `${configuredAppUrl.replace(/\/$/, '')}/gallery/${token}`;
      }
      return `${window.location.origin}/gallery/${token}`;
    }
    return configuredAppUrl
      ? `${configuredAppUrl.replace(/\/$/, '')}/gallery/${token}`
      : `/gallery/${token}`;
  }, [token, configuredAppUrl]);

  const isUsingPublicTunnel = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return (
      isLocal &&
      !!configuredAppUrl &&
      !configuredAppUrl.includes('localhost') &&
      !configuredAppUrl.includes('127.0.0.1')
    );
  }, [configuredAppUrl]);

  const qrSvg = useMemo(() => {
    return generateQRSVG(publicGalleryUrl, 260, '#1c1917');
  }, [publicGalleryUrl]);

  const formattedDate = useMemo(() => {
    try {
      return new Date(weddingDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return weddingDate;
    }
  }, [weddingDate]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicGalleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleGuestUploads = async () => {
    setUpdating(true);
    try {
      await onUpdateSettings({ guestUploadsEnabled: !guestUploadsEnabled });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleGalleryEnabled = async () => {
    setUpdating(true);
    try {
      await onUpdateSettings({ isEnabled: !isEnabled });
    } finally {
      setUpdating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating this QR code will invalidate any previously printed table cards. Are you sure?')) {
      return;
    }
    setRegenerating(true);
    try {
      await onUpdateSettings({ regenerateToken: true });
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    try {
      const dataUrl = await generateQRDataURL(publicGalleryUrl, 1024);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${groomName}-${brideName}-table-qr.png`;
      a.click();
    } catch (err) {
      console.error('Failed to download QR code image', err);
    }
  };

  const whatsAppShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Namaste! We've set up a private digital photo gallery for ${groomName} & ${brideName}'s wedding celebrations! 📸\n\nClick here to view or upload your candid photos: ${publicGalleryUrl}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-table-card,
          #printable-table-card * {
            visibility: visible;
          }
          #printable-table-card {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 5in;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: 2px solid #b45309 !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-sand overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-sand/60 bg-linear-to-r from-amber-50/70 to-yellow-50/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📸</span>
            <div>
              <h3 className="text-base font-bold font-serif text-brand-charcoal">
                Table QR Standee &amp; Photo Vault Link
              </h3>
              <p className="text-[11px] text-brand-charcoal/60">
                Print for dinner banquet tables or share directly on WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Printable Standee Card Preview */}
          <div className="flex justify-center">
            <div
              id="printable-table-card"
              className="w-full max-w-sm bg-gradient-to-b from-amber-50/90 via-yellow-50/40 to-orange-50/60 border-2 border-amber-600/60 rounded-3xl p-6 sm:p-7 text-center shadow-lg relative overflow-hidden space-y-4"
            >
              {/* Corner Floral Ornaments */}
              <div className="absolute top-2 left-2 text-amber-600/40 text-xs select-none">⚜️</div>
              <div className="absolute top-2 right-2 text-amber-600/40 text-xs select-none">⚜️</div>
              <div className="absolute bottom-2 left-2 text-amber-600/40 text-xs select-none">⚜️</div>
              <div className="absolute bottom-2 right-2 text-amber-600/40 text-xs select-none">⚜️</div>

              {/* Shloka & Insignia */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-serif tracking-widest text-amber-800 font-bold block">
                  ॥ श्री गणेशाय नमः ॥
                </span>
                <div className="flex justify-center pt-0.5">
                  <Logo size="sm" />
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold font-serif text-amber-950">
                  Share the Memories 📸
                </h4>
                <p className="text-[11px] text-brand-charcoal/80 italic font-serif">
                  Help us capture every candid smile, dance step &amp; sacred blessing!
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex justify-center py-1">
                <div
                  className="p-3 bg-white border border-amber-300 rounded-2xl shadow-sm inline-block"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              </div>

              {/* Couple Info & Instructions */}
              <div className="space-y-1.5 border-t border-amber-300/60 pt-3">
                <div className="font-serif font-extrabold text-sm sm:text-base text-amber-900 tracking-tight">
                  {groomName} &amp; {brideName}
                </div>
                <div className="text-[10px] text-amber-800 font-semibold">
                  📅 {formattedDate}
                </div>
                <div className="inline-block px-3 py-1 bg-amber-100/90 border border-amber-300/80 rounded-full text-[10px] font-bold text-amber-950">
                  ✨ Point your phone camera to scan • No app required
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <span>🖨️</span>
              <span>Print Table Standee</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-brand-sand text-brand-charcoal font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download high-resolution QR image for printing or sharing"
            >
              <span>📥</span>
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-brand-sand text-brand-charcoal font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Link Copied!' : 'Copy Guest Link'}</span>
            </button>

            <a
              href={whatsAppShareUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>Share on WhatsApp</span>
            </a>

            <a
              href={publicGalleryUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-brand-crimson/10 hover:bg-brand-crimson/20 text-brand-crimson font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              title="Open public gallery page in a new tab"
            >
              <span>🌐</span>
              <span>Test Page ↗</span>
            </a>
          </div>

          {/* Scanner Guidance & Localhost Troubleshooting */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <span>📱</span>
              <span>How to Scan Table QR:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Open your phone&apos;s standard camera app (iOS Camera, Android Google Lens, or WhatsApp Camera) and aim at the QR code. Tap the yellow banner that appears to open the photo vault.
            </p>
            {isUsingPublicTunnel ? (
              <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                <span className="shrink-0">🚀</span>
                <span>
                  <strong>Mobile Tunnel Active:</strong> QR is generated with your public tunnel link so any smartphone camera can scan and open it immediately.
                </span>
              </div>
            ) : (
              typeof window !== 'undefined' &&
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-amber-950 flex items-start gap-1.5">
                  <span className="shrink-0">⚠️</span>
                  <span>
                    <strong>Testing on localhost?</strong> Mobile phones cannot connect directly to <code className="bg-amber-100 px-1 py-0.5 rounded">localhost:3000</code>. Use your ngrok tunnel or click <strong>Test Page ↗</strong> above.
                  </span>
                </div>
              )
            )}
          </div>

          {/* Settings & Privacy Controls */}
          <div className="bg-stone-50 border border-brand-sand/70 rounded-2xl p-4 space-y-3.5 text-xs">
            <span className="font-bold text-brand-charcoal uppercase tracking-wider text-[11px] block">
              ⚙️ Gallery Access &amp; Privacy Controls
            </span>

            <div className="flex items-center justify-between gap-4 py-1 border-b border-brand-sand/50">
              <div>
                <span className="font-semibold text-brand-charcoal block">
                  Allow Guests to Upload Photos
                </span>
                <span className="text-[11px] text-brand-charcoal/60">
                  When enabled, guests can upload candid photos from dinner tables without logging in.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleGuestUploads}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  guestUploadsEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    guestUploadsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-1 border-b border-brand-sand/50">
              <div>
                <span className="font-semibold text-brand-charcoal block">
                  Public Gallery Visibility
                </span>
                <span className="text-[11px] text-brand-charcoal/60">
                  Allow guests with the secret link or QR to view the wedding album.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleGalleryEnabled}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div>
                <span className="font-semibold text-brand-charcoal block">
                  Rotate Secret Token
                </span>
                <span className="text-[11px] text-brand-charcoal/60">
                  Generate a brand-new QR code link and invalidate the old one if needed.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg text-xs transition-colors shrink-0"
              >
                {regenerating ? 'Rotating...' : '🔄 Rotate Token'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
