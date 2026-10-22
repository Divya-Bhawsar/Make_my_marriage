'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PublicGalleryDTO } from '@/modules/photo/photo.service';
import { PhotoDTO } from '@/modules/photo/photo.model';
import { PhotoGrid } from './photo-grid';
import { PhotoLightbox } from './photo-lightbox';
import { UploadPhotoModal } from './upload-photo-modal';
import { Logo } from '@/components/landing/logo';

interface PublicGalleryViewProps {
  gallery: PublicGalleryDTO;
  token: string;
}

export function PublicGalleryView({ gallery, token }: PublicGalleryViewProps) {
  const [activeEventId, setActiveEventId] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoDTO[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (eventId: string, cursor: string | null = null, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (eventId) params.set('eventId', eventId);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '24');

      const res = await fetch(`/api/public/galleries/${token}/photos?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load photos');

      const json = await res.json();
      const data = json.data;

      if (append) {
        setPhotos((prev) => [...prev, ...data.photos]);
      } else {
        setPhotos(data.photos);
      }

      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch {
      // Graceful error state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPhotos(activeEventId, null, false);
  }, [activeEventId, fetchPhotos]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchPhotos(activeEventId, nextCursor, true);
    }
  };

  const handleGuestUpload = async (data: {
    files: File[];
    eventId: string | null;
    caption: string | null;
    uploaderName?: string | null;
  }) => {
    let successCount = 0;
    for (const file of data.files) {
      const formData = new FormData();
      formData.append('file', file);
      if (data.eventId) formData.append('eventId', data.eventId);
      if (data.caption) formData.append('caption', data.caption);
      if (data.uploaderName) formData.append('uploaderName', data.uploaderName);

      const res = await fetch(`/api/public/galleries/${token}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) successCount++;
    }

    if (successCount > 0) {
      setFeedback(`🎉 Dhanyavaad! ${successCount} candid memory photo${successCount > 1 ? 's' : ''} added to the wedding vault!`);
      fetchPhotos(activeEventId, null, false);
      setTimeout(() => setFeedback(null), 5000);
    } else {
      throw new Error('Upload failed. Please check file formats and try again.');
    }
  };

  const formattedDate = new Date(gallery.weddingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/95 via-yellow-50/60 to-orange-50/30 font-sans text-brand-charcoal">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-sand/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <div className="flex flex-col">
              <span className="font-serif font-extrabold text-sm sm:text-base tracking-tight text-brand-crimson">
                {gallery.groomName} &amp; {gallery.brideName}
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-brand-gold">
                Private Wedding Vault
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/w/${gallery.slug}`}
              className="text-xs font-semibold text-brand-charcoal/70 hover:text-brand-crimson transition-colors hidden sm:inline"
            >
              Wedding Website &rarr;
            </Link>

            {gallery.guestUploadsEnabled && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <span>📸</span>
                <span>Upload Photos</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="py-10 sm:py-14 text-center px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold font-serif block">
            ॥ श्री गणेशाय नमः ॥
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight text-amber-950">
            {gallery.groomName} &amp; {gallery.brideName}&apos;s Memories
          </h1>
          <p className="text-xs sm:text-sm text-brand-charcoal/80 font-serif italic max-w-lg mx-auto">
            A shared sacred album capturing every candid smile, ritual blessing, and celebratory dance from family &amp; friends.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs font-semibold text-brand-charcoal/70">
            <span>📅 {formattedDate}</span>
            {gallery.location && (
              <>
                <span>•</span>
                <span>📍 {gallery.location}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pb-20 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 shadow-sm flex items-center justify-between animate-fade-in">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Ceremony Album Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-sand/50">
          <button
            type="button"
            onClick={() => setActiveEventId('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeEventId === ''
                ? 'bg-amber-900 text-amber-50 shadow-xs'
                : 'bg-white hover:bg-stone-50 text-brand-charcoal/70 border border-brand-sand/60'
            }`}
          >
            ✨ All Memories
          </button>

          {gallery.events.map((evt) => (
            <button
              key={evt.id}
              type="button"
              onClick={() => setActiveEventId(evt.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeEventId === evt.id
                  ? 'bg-brand-crimson text-white shadow-xs'
                  : 'bg-white hover:bg-stone-50 text-brand-charcoal/70 border border-brand-sand/60'
              }`}
            >
              🪔 {evt.name}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <PhotoGrid
          photos={photos}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onSelectPhoto={(_photo, index) => setSelectedPhotoIndex(index)}
          isOrganizer={false}
          onOpenUpload={gallery.guestUploadsEnabled ? () => setIsUploadOpen(true) : undefined}
        />
      </main>

      {/* Floating Upload FAB on Mobile */}
      {gallery.guestUploadsEnabled && (
        <div className="fixed bottom-6 right-6 sm:hidden z-30">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-3.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-full shadow-2xl flex items-center gap-2"
          >
            <span className="text-base">📸</span>
            <span>Upload Memories</span>
          </button>
        </div>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photo={currentPhoto}
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrev={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1}
        onPrev={() => setSelectedPhotoIndex((prev) => (prev !== null ? prev - 1 : null))}
        onNext={() => setSelectedPhotoIndex((prev) => (prev !== null ? prev + 1 : null))}
        isOrganizer={false}
      />

      {/* Guest Upload Modal */}
      {gallery.guestUploadsEnabled && (
        <UploadPhotoModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          ceremonies={gallery.events}
          onUpload={handleGuestUpload}
          isGuestMode={true}
        />
      )}
    </div>
  );
}
