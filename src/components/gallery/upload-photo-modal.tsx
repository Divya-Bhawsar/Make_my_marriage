'use client';

import React, { useState } from 'react';

export interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ceremonies: CeremonyOption[];
  onUpload: (data: {
    files: File[];
    eventId: string | null;
    caption: string | null;
    uploaderName?: string | null;
  }) => Promise<void>;
  isGuestMode?: boolean;
}

export function UploadPhotoModal({
  isOpen,
  onClose,
  ceremonies,
  onUpload,
  isGuestMode = false,
}: UploadPhotoModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    // Validate each file
    const validFiles: File[] = [];
    for (const f of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setErrorMessage(`"${f.name}" is not a supported image format. Please select JPEG, PNG, or WebP.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${f.name}" exceeds the 10 MB limit.`);
        return;
      }
      validFiles.push(f);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 20)); // Limit to max 20 per batch
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least one photo to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      await onUpload({
        files: selectedFiles,
        eventId: selectedEventId ? selectedEventId : null,
        caption: caption.trim() || null,
        uploaderName: isGuestMode ? guestName.trim() || 'Wedding Guest' : null,
      });

      // Reset on success
      setSelectedFiles([]);
      setCaption('');
      setGuestName('');
      setSelectedEventId('');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-sand overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-sand/60 bg-linear-to-r from-amber-50/70 to-yellow-50/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📸</span>
            <div>
              <h3 className="text-base font-bold font-serif text-brand-charcoal">
                {isGuestMode ? 'Contribute Wedding Memories' : 'Upload Photos to Vault'}
              </h3>
              <p className="text-[11px] text-brand-charcoal/60">
                {isGuestMode
                  ? 'Your photos will be shared with the couple & family album'
                  : 'Add official or candid wedding photos to ceremony albums'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guest Name Input */}
          {isGuestMode && (
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Your Name or Family / Table (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Uncle, Sharma Family, Table 4"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold"
              />
            </div>
          )}

          {/* Ceremony Album Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-brand-charcoal mb-1">
              Ceremony Album (Optional)
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold"
            >
              <option value="">✨ General Wedding Memories (All Ceremonies)</option>
              {ceremonies.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} ({evt.type})
                </option>
              ))}
            </select>
          </div>

          {/* File Picker / Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-brand-charcoal mb-1">
              Select Photos (JPEG, PNG, WebP up to 10 MB each)
            </label>
            <div className="relative border-2 border-dashed border-brand-gold/60 hover:border-brand-crimson rounded-2xl p-6 text-center bg-amber-50/30 transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-1 pointer-events-none">
                <span className="text-3xl block">🖼️</span>
                <span className="text-xs font-bold text-brand-charcoal block">
                  Click or Drag &amp; Drop Photos Here
                </span>
                <span className="text-[11px] text-brand-charcoal/60 block">
                  Select up to 20 candid photos from your device
                </span>
              </div>
            </div>
          </div>

          {/* Selected Files Preview Thumbnails */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-brand-charcoal font-semibold">
                <span>Selected Photos ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 bg-stone-50 rounded-xl border border-brand-sand/50">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="relative group bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-[11px] flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-stone-400 hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-semibold text-brand-charcoal mb-1">
              Add a Caption or Blessing (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Auspicious varmala moments! Best wishes to the couple ❤️"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              className="w-full px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-sand/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-brand-charcoal/80 hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="px-5 py-2.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-1.5"
            >
              <span>{isUploading ? '⏳' : '🚀'}</span>
              <span>
                {isUploading
                  ? `Uploading ${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}...`
                  : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
