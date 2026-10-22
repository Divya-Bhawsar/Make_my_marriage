'use client';

import React, { useEffect, useCallback } from 'react';
import { PhotoDTO } from '@/modules/photo/photo.model';

interface PhotoLightboxProps {
  photo: PhotoDTO | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onDelete?: (photoId: string) => Promise<void>;
  isOrganizer?: boolean;
}

export function PhotoLightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  onDelete,
  isOrganizer = false,
}: PhotoLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    if (photo) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [photo, handleKeyDown]);

  if (!photo) return null;

  const formattedDate = new Date(photo.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this photo from the wedding album?')) {
      return;
    }
    if (onDelete) {
      await onDelete(photo.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
            {photo.uploaderType === 'GUEST'
              ? `🤳 Guest: ${photo.uploaderName || 'Attendee'}`
              : '👨‍👩‍👦 Couple & Family'}
          </span>
          <span className="text-xs text-white/70 hidden sm:inline">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={photo.imageUrl}
            download={photo.filename}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition-colors flex items-center gap-1.5 backdrop-blur-xs"
          >
            <span>⬇️</span>
            <span className="hidden sm:inline">Download High-Res</span>
          </a>

          {isOrganizer && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-xs font-bold text-white transition-colors flex items-center gap-1"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Prev / Next Navigation Arrows */}
      {hasPrev && onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold transition-colors z-10 backdrop-blur-xs"
        >
          ‹
        </button>
      )}

      {hasNext && onNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold transition-colors z-10 backdrop-blur-xs"
        >
          ›
        </button>
      )}

      {/* Main Image Container */}
      <div className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={photo.caption || photo.filename}
          className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
        />

        {photo.caption && (
          <div className="mt-3 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs sm:text-sm text-center max-w-xl italic">
            &ldquo;{photo.caption}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
