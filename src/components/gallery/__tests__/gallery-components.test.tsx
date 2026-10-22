import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { generateQRSVG, generateQRMatrix } from '@/shared/utils/qr-code';
import jsQR from 'jsqr';
import { GalleryMetricStrip } from '../gallery-metric-strip';
import { TableQRCardModal } from '../table-qr-card-modal';
import { PhotoGrid } from '../photo-grid';
import { UploadPhotoModal } from '../upload-photo-modal';
import { PhotoLightbox } from '../photo-lightbox';
import { PublicGalleryView } from '../public-gallery-view';
import { PhotoDTO } from '@/modules/photo/photo.model';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/gallery',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Gallery & Table QR Components & Utilities', () => {
  describe('QR Code Generator (Pure TypeScript)', () => {
    it('generates a 2D matrix of modules for a URL', () => {
      const matrix = generateQRMatrix('https://makemymarriage.com/gallery/test-token-1234');
      expect(matrix.length).toBeGreaterThanOrEqual(21);
      expect(matrix[0].length).toBe(matrix.length);
      // Top-left finder center should be dark
      expect(matrix[3][3]).toBe(true);
    });

    it('generates valid SVG markup with path and dimensions', () => {
      const svg = generateQRSVG('https://makemymarriage.com/gallery/test-token-1234', 200, '#1c1917');
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 200 200"');
      expect(svg).toContain('<path');
      expect(svg).toContain('fill="#1c1917"');
    });

    it('is decodable by standard camera barcode readers (jsQR)', () => {
      const targetUrl =
        'https://counting-old-mankind.ngrok-free.dev/gallery/b7000ef2978670bd8e8a3d21eb91e971affbcd4bd7ad0134';
      const matrix = generateQRMatrix(targetUrl);
      const count = matrix.length;
      const padding = 4;
      const totalUnits = count + padding * 2;
      const scale = 8;
      const width = totalUnits * scale;
      const height = totalUnits * scale;
      const rgba = new Uint8ClampedArray(width * height * 4);
      rgba.fill(255);

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (matrix[r][c]) {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                const px = (c + padding) * scale + dx;
                const py = (r + padding) * scale + dy;
                const idx = (py * width + px) * 4;
                rgba[idx] = 0;
                rgba[idx + 1] = 0;
                rgba[idx + 2] = 0;
                rgba[idx + 3] = 255;
              }
            }
          }
        }
      }

      const decoded = jsQR(rgba, width, height);
      expect(decoded).not.toBeNull();
      expect(decoded?.data).toBe(targetUrl);
    });
  });

  describe('GalleryMetricStrip', () => {
    it('renders metrics properly with formatted numbers and storage', () => {
      const html = renderToString(
        <GalleryMetricStrip
          totalCount={42}
          guestCount={30}
          memberCount={12}
          totalSizeBytes={52428800} // 50 MB
          isGuestUploadsEnabled={true}
          onOpenQR={vi.fn()}
          onOpenUpload={vi.fn()}
        />
      );

      expect(html).toContain('42');
      expect(html).toContain('30');
      expect(html).toContain('12');
      expect(html).toContain('50.0 MB');
      expect(html).toContain('Guest uploads active');
      expect(html).toContain('Table QR Standee');
    });
  });

  describe('TableQRCardModal', () => {
    it('renders modal with couple names, QR code, and print action', () => {
      const html = renderToString(
        <TableQRCardModal
          isOpen={true}
          onClose={vi.fn()}
          token="test-token-abc"
          brideName="Eisha"
          groomName="Vivek"
          weddingDate="2026-10-20"
          isEnabled={true}
          guestUploadsEnabled={true}
          onUpdateSettings={vi.fn()}
        />
      );

      const normalized = normalizeHtml(html);
      expect(normalized).toContain('Vivek & Eisha');
      expect(normalized).toContain('Share the Memories 📸');
      expect(normalized).toContain('Print Table Standee');
      expect(normalized).toContain('Copy Guest Link');
      expect(normalized).toContain('Share on WhatsApp');
      expect(normalized).toContain('Rotate Secret Token');
    });

    it('returns null when isOpen is false', () => {
      const html = renderToString(
        <TableQRCardModal
          isOpen={false}
          onClose={vi.fn()}
          token="test-token-abc"
          brideName="Eisha"
          groomName="Vivek"
          weddingDate="2026-10-20"
          isEnabled={true}
          guestUploadsEnabled={true}
          onUpdateSettings={vi.fn()}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('PhotoGrid', () => {
    const mockPhotos: PhotoDTO[] = [
      {
        id: 'p1',
        weddingId: 'w1',
        eventId: null,
        uploaderType: 'GUEST',
        uploaderName: 'Sharma Family',
        uploadedByUserId: null,
        objectKey: 'test.jpg',
        imageUrl: '/uploads/test.jpg',
        thumbnailUrl: null,
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        width: null,
        height: null,
        caption: 'Such an auspicious day!',
        status: 'READY',
        createdAt: '2026-10-17T12:00:00Z',
      },
    ];

    it('renders photos with guest badge and caption', () => {
      const html = renderToString(
        <PhotoGrid
          photos={mockPhotos}
          loading={false}
          hasMore={false}
          onLoadMore={vi.fn()}
          onSelectPhoto={vi.fn()}
        />
      );

      expect(html).toContain('/uploads/test.jpg');
      expect(html).toContain('Sharma Family');
      expect(html).toContain('Such an auspicious day!');
    });

    it('renders friendly empty state when no photos exist', () => {
      const html = renderToString(
        <PhotoGrid
          photos={[]}
          loading={false}
          hasMore={false}
          onLoadMore={vi.fn()}
          onSelectPhoto={vi.fn()}
        />
      );

      expect(html).toContain('No Photos in this Ceremony Album Yet');
    });
  });

  describe('UploadPhotoModal', () => {
    it('renders ceremony dropdown and file select button', () => {
      const html = renderToString(
        <UploadPhotoModal
          isOpen={true}
          onClose={vi.fn()}
          ceremonies={[{ id: 'e1', name: 'Haldi', type: 'HALDI' }]}
          onUpload={vi.fn()}
          isGuestMode={false}
        />
      );

      const normalized = normalizeHtml(html);
      expect(normalized).toContain('Upload Photos to Vault');
      expect(normalized).toContain('Haldi (HALDI)');
      expect(normalized).toContain('Select Photos');
    });

    it('renders guest name field when isGuestMode is true', () => {
      const html = renderToString(
        <UploadPhotoModal
          isOpen={true}
          onClose={vi.fn()}
          ceremonies={[]}
          onUpload={vi.fn()}
          isGuestMode={true}
        />
      );

      expect(html).toContain('Contribute Wedding Memories');
      expect(html).toContain('Your Name or Family / Table');
    });
  });

  describe('PhotoLightbox', () => {
    it('renders fullscreen photo view with uploader info', () => {
      const photo: PhotoDTO = {
        id: 'p1',
        weddingId: 'w1',
        eventId: null,
        uploaderType: 'GUEST',
        uploaderName: 'Ramesh Uncle',
        uploadedByUserId: null,
        objectKey: 'img.jpg',
        imageUrl: '/uploads/img.jpg',
        thumbnailUrl: null,
        filename: 'img.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2000,
        width: null,
        height: null,
        caption: 'Beautiful Varmala!',
        status: 'READY',
        createdAt: '2026-10-17T15:30:00Z',
      };

      const html = renderToString(
        <PhotoLightbox
          photo={photo}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          isOrganizer={true}
        />
      );

      expect(html).toContain('/uploads/img.jpg');
      expect(html).toContain('Ramesh Uncle');
      expect(html).toContain('Beautiful Varmala!');
      expect(html).toContain('Download High-Res');
      expect(html).toContain('Delete');
    });
  });

  describe('PublicGalleryView', () => {
    it('renders public guest view with couple names and ceremonies', () => {
      const html = renderToString(
        <PublicGalleryView
          gallery={{
            weddingId: 'w1',
            brideName: 'Eisha',
            groomName: 'Vivek',
            title: null,
            weddingDate: '2026-10-20',
            location: 'Indore',
            theme: 'crimson',
            slug: 'eisha-vivek-20102026',
            guestUploadsEnabled: true,
            events: [{ id: 'e1', name: 'Mehendi Fest', type: 'MEHENDI', startsAt: '2026-10-18T10:00:00Z' }],
          }}
          token="test-token"
        />
      );

      const normalized = normalizeHtml(html);
      expect(normalized).toContain("Vivek & Eisha's Memories");
      expect(normalized).toContain('Mehendi Fest');
      expect(normalized).toContain('Upload Photos');
    });
  });
});
