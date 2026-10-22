'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PhotoDTO } from '@/modules/photo/photo.model';
import { GalleryMetricStrip } from './gallery-metric-strip';
import { TableQRCardModal } from './table-qr-card-modal';
import { UploadPhotoModal, CeremonyOption } from './upload-photo-modal';
import { PhotoGrid } from './photo-grid';
import { PhotoLightbox } from './photo-lightbox';

interface GallerySettings {
  isEnabled: boolean;
  guestUploadsEnabled: boolean;
  token: string;
  gallerySlug: string;
}

interface WeddingBasicInfo {
  brideName: string;
  groomName: string;
  weddingDate: string;
}

export function GalleryManager() {
  const [settings, setSettings] = useState<GallerySettings | null>(null);
  const [weddingInfo, setWeddingInfo] = useState<WeddingBasicInfo>({
    brideName: 'Bride',
    groomName: 'Groom',
    weddingDate: '2026-10-20',
  });
  const [ceremonies, setCeremonies] = useState<CeremonyOption[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>(''); // '' means All Photos
  const [photos, setPhotos] = useState<PhotoDTO[]>([]);
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    guestCount: 0,
    memberCount: 0,
    totalSizeBytes: 0,
  });
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load: settings, ceremonies, and wedding info
  const loadInitialData = useCallback(async () => {
    try {
      const [settingsRes, eventsRes, weddingRes] = await Promise.all([
        fetch('/api/gallery/settings'),
        fetch('/api/events'),
        fetch('/api/wedding'),
      ]);

      if (settingsRes.ok) {
        const json = await settingsRes.json();
        setSettings(json.data);
      }

      if (eventsRes.ok) {
        const json = await eventsRes.json();
        setCeremonies(
          json.data.map((e: { id: string; name: string; type: string }) => ({
            id: e.id,
            name: e.name,
            type: e.type,
          }))
        );
      }

      if (weddingRes.ok) {
        const json = await weddingRes.json();
        setWeddingInfo({
          brideName: json.data.brideName,
          groomName: json.data.groomName,
          weddingDate: json.data.weddingDate,
        });
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Fetch photos by event filter
  const fetchPhotos = useCallback(async (eventId: string, cursor: string | null = null, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (eventId) params.set('eventId', eventId);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '24');

      const res = await fetch(`/api/photos?${params.toString()}`);
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
      setMetrics(data.metrics);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error loading photos',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    fetchPhotos(activeEventId, null, false);
  }, [activeEventId, fetchPhotos]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchPhotos(activeEventId, nextCursor, true);
    }
  };

  const handleUpdateSettings = async (newSettings: {
    isEnabled?: boolean;
    guestUploadsEnabled?: boolean;
    regenerateToken?: boolean;
  }) => {
    try {
      const res = await fetch('/api/gallery/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error('Failed to update gallery settings');

      const json = await res.json();
      setSettings(json.data);
      setFeedback({ type: 'success', text: '✓ Gallery settings updated successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update settings',
      });
    }
  };

  const handleUploadPhotos = async (data: {
    files: File[];
    eventId: string | null;
    caption: string | null;
  }) => {
    let successCount = 0;
    for (const file of data.files) {
      const formData = new FormData();
      formData.append('file', file);
      if (data.eventId) formData.append('eventId', data.eventId);
      if (data.caption) formData.append('caption', data.caption);

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) successCount++;
    }

    if (successCount > 0) {
      setFeedback({
        type: 'success',
        text: `✓ Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}!`,
      });
      fetchPhotos(activeEventId, null, false);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      throw new Error('Upload failed for the selected photos.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete photo');

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setMetrics((prev) => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - 1),
      }));
      setFeedback({ type: 'success', text: '✓ Photo removed from wedding vault.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete photo',
      });
    }
  };

  const currentPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-sand/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">📸</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-charcoal">
              Private Photo Vault &amp; Table QR Code
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-charcoal/70 mt-1 max-w-2xl">
            Collect uncompressed candid moments from guests, organize ceremony albums, and print table standee cards for wedding tables.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-2"
          >
            <span>📱</span>
            <span>Table QR Standee</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-2"
          >
            <span>➕</span>
            <span>Upload Photos</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Strip */}
      <GalleryMetricStrip
        totalCount={metrics.totalCount}
        guestCount={metrics.guestCount}
        memberCount={metrics.memberCount}
        totalSizeBytes={metrics.totalSizeBytes}
        isGuestUploadsEnabled={settings?.guestUploadsEnabled ?? true}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Ceremony Album Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-sand/50">
        <button
          type="button"
          onClick={() => setActiveEventId('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeEventId === ''
              ? 'bg-brand-charcoal text-white shadow-xs'
              : 'bg-white hover:bg-stone-50 text-brand-charcoal/70 border border-brand-sand/60'
          }`}
        >
          ✨ All Wedding Photos ({metrics.totalCount})
        </button>

        {ceremonies.map((evt) => (
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

      {/* Photo Grid */}
      <PhotoGrid
        photos={photos}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onSelectPhoto={(_photo, index) => setSelectedPhotoIndex(index)}
        onDeletePhoto={handleDeletePhoto}
        isOrganizer={true}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      {/* Lightbox Modal */}
      <PhotoLightbox
        photo={currentPhoto}
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrev={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1}
        onPrev={() => setSelectedPhotoIndex((prev) => (prev !== null ? prev - 1 : null))}
        onNext={() => setSelectedPhotoIndex((prev) => (prev !== null ? prev + 1 : null))}
        onDelete={handleDeletePhoto}
        isOrganizer={true}
      />

      {/* Upload Photos Modal */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        ceremonies={ceremonies}
        onUpload={handleUploadPhotos}
        isGuestMode={false}
      />

      {/* Table QR Standee Card Modal */}
      {settings && (
        <TableQRCardModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          token={settings.token}
          brideName={weddingInfo.brideName}
          groomName={weddingInfo.groomName}
          weddingDate={weddingInfo.weddingDate}
          isEnabled={settings.isEnabled}
          guestUploadsEnabled={settings.guestUploadsEnabled}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
    </div>
  );
}
