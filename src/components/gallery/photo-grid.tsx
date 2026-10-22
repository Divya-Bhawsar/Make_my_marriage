'use client';

import React from 'react';
import { PhotoDTO } from '@/modules/photo/photo.model';

interface PhotoGridProps {
  photos: PhotoDTO[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectPhoto: (photo: PhotoDTO, index: number) => void;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  isOrganizer?: boolean;
  onOpenUpload?: () => void;
  onOpenQR?: () => void;
}

export function PhotoGrid({
  photos,
  loading,
  hasMore,
  onLoadMore,
  onSelectPhoto,
  onDeletePhoto,
  isOrganizer = false,
  onOpenUpload,
  onOpenQR,
}: PhotoGridProps) {
  if (loading && photos.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-stone-200/80 rounded-2xl border border-brand-sand/40"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white/80 border border-brand-sand rounded-3xl p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
        <span className="text-5xl block animate-bounce">📸</span>
        <h4 className="text-lg sm:text-xl font-bold font-serif text-brand-charcoal">
          No Photos in this Ceremony Album Yet
        </h4>
        <p className="text-xs sm:text-sm text-brand-charcoal/70 leading-relaxed">
          Be the first to upload candid moments or print the table QR standee so guests can contribute photos from their dinner tables!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-5 py-2.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105"
            >
              ➕ Upload First Photo
            </button>
          )}
          {onOpenQR && (
            <button
              type="button"
              onClick={onOpenQR}
              className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 transition-colors"
            >
              📱 Show Table QR Standee
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => onSelectPhoto(photo, index)}
            className="group relative aspect-square bg-stone-100 rounded-2xl overflow-hidden border border-brand-sand/60 shadow-xs cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageUrl}
              alt={photo.caption || photo.filename}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-black/50 text-[10px] font-semibold text-white backdrop-blur-xs">
                  {photo.uploaderType === 'GUEST'
                    ? `🤳 ${photo.uploaderName || 'Guest'}`
                    : '👨‍👩‍👦 Couple'}
                </span>

                {isOrganizer && onDeletePhoto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this photo from the gallery?')) {
                        onDeletePhoto(photo.id);
                      }
                    }}
                    className="h-6 w-6 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center text-xs transition-colors"
                    title="Delete photo"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {photo.caption && (
                <p className="text-[11px] text-white/90 line-clamp-2 italic">
                  &ldquo;{photo.caption}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Pagination */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-white hover:bg-stone-50 border border-brand-sand text-brand-charcoal font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : '↓ Load More Photos'}
          </button>
        </div>
      )}
    </div>
  );
}
