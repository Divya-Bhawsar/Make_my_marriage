import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { WeddingWebsiteView } from '@/components/website/wedding-website-view';
import { WebsiteManager } from '@/components/website/website-manager';
import {
  extractYouTubeVideoId,
  extractGoogleMeetCode,
  normalizeGoogleMeetUrl,
  getScheduledCallStatus,
  getThemeConfig,
  WEBSITE_THEMES,
} from '@/components/website/website-theme-styles';
import WebsiteSettingsPage from '@/app/(dashboard)/app/website/page';
import { PublicWeddingDTO } from '@/modules/wedding/wedding.service';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/website',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Wedding Website & Livestream Components', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts video ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts video ID from youtu.be short URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from youtube live URL', () => {
      expect(extractYouTubeVideoId('https://youtube.com/live/dQw4w9WgXcQ?feature=share')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('returns null for invalid or null URLs', () => {
      expect(extractYouTubeVideoId(null)).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(extractYouTubeVideoId('https://google.com')).toBeNull();
    });
  });

  describe('extractGoogleMeetCode', () => {
    it('extracts meet code from standard URL', () => {
      expect(extractGoogleMeetCode('https://meet.google.com/abc-defg-hij')).toBe('abc-defg-hij');
    });

    it('extracts meet code from raw code', () => {
      expect(extractGoogleMeetCode('abc-defg-hij')).toBe('abc-defg-hij');
    });

    it('returns null for null or invalid codes', () => {
      expect(extractGoogleMeetCode(null)).toBeNull();
      expect(extractGoogleMeetCode('')).toBeNull();
    });
  });

  describe('normalizeGoogleMeetUrl', () => {
    it('normalizes meeting code into full https URL', () => {
      expect(normalizeGoogleMeetUrl('abc-defg-hij')).toBe('https://meet.google.com/abc-defg-hij');
    });

    it('preserves full meet URL', () => {
      expect(normalizeGoogleMeetUrl('https://meet.google.com/abc-defg-hij')).toBe(
        'https://meet.google.com/abc-defg-hij'
      );
    });

    it('returns null for null input', () => {
      expect(normalizeGoogleMeetUrl(null)).toBeNull();
    });
  });

  describe('getScheduledCallStatus', () => {
    it('returns null for null or invalid dates', () => {
      expect(getScheduledCallStatus(null)).toBeNull();
      expect(getScheduledCallStatus('')).toBeNull();
      expect(getScheduledCallStatus('invalid-date')).toBeNull();
    });

    it('returns upcoming countdown status when start time is in the future', () => {
      const futureDate = new Date('2026-10-20T18:30:00Z');
      const now = new Date('2026-10-20T15:00:00Z');
      const status = getScheduledCallStatus(futureDate.toISOString(), 'Asia/Kolkata', now);

      expect(status).not.toBeNull();
      expect(status?.isUpcoming).toBe(true);
      expect(status?.isLive).toBe(false);
      expect(status?.countdownText).toContain('Starts in 3h 30m');
    });

    it('returns live status when start time is happening now (within 3h)', () => {
      const liveDate = new Date('2026-10-20T18:30:00Z');
      const now = new Date('2026-10-20T19:00:00Z');
      const status = getScheduledCallStatus(liveDate.toISOString(), 'Asia/Kolkata', now);

      expect(status).not.toBeNull();
      expect(status?.isLive).toBe(true);
      expect(status?.isUpcoming).toBe(false);
      expect(status?.countdownText).toBe('Happening Now! 🔴');
    });

    it('returns concluded status when start time was more than 3 hours ago', () => {
      const pastDate = new Date('2026-10-20T12:00:00Z');
      const now = new Date('2026-10-20T18:00:00Z');
      const status = getScheduledCallStatus(pastDate.toISOString(), 'Asia/Kolkata', now);

      expect(status).not.toBeNull();
      expect(status?.isLive).toBe(false);
      expect(status?.isUpcoming).toBe(false);
      expect(status?.countdownText).toBe('Ceremony Concluded');
    });
  });

  describe('getThemeConfig', () => {
    it('returns theme config for crimson, marigold, emerald, and gulabi', () => {
      expect(getThemeConfig('crimson').id).toBe('crimson');
      expect(getThemeConfig('marigold').id).toBe('marigold');
      expect(getThemeConfig('emerald').id).toBe('emerald');
      expect(getThemeConfig('gulabi').id).toBe('gulabi');
    });

    it('defaults to crimson for unknown themes', () => {
      expect(getThemeConfig('unknown').id).toBe('crimson');
      expect(getThemeConfig(null).id).toBe('crimson');
    });
  });

  describe('WeddingWebsiteView', () => {
    const mockWedding: PublicWeddingDTO = {
      brideName: 'Eisha',
      groomName: 'Vivek',
      title: 'Vivek & Eisha',
      description: 'Join our grand celebration in the historic city of Indore.',
      weddingDate: '2026-10-20',
      timeZone: 'Asia/Kolkata',
      location: {
        city: 'Indore',
        state: 'Madhya Pradesh',
        formattedAddress: 'Indore, MP',
      },
      coverImageObjectKey: null,
      theme: 'crimson',
      isPublished: true,
      welcomeMessage: 'We would love to celebrate our Shubh Vivah with you.',
      slug: 'eisha-vivek-20102026',
      events: [
        {
          id: 'e1',
          name: 'Haldi Phoolon Ki Holi',
          type: 'HALDI',
          startsAt: '2026-10-19T10:00:00Z',
          endsAt: '2026-10-19T13:00:00Z',
          venueName: 'Sayaji Lawns',
          address: 'Vijay Nagar, Indore',
          dressCode: 'Yellow Floral Attire',
          description: 'Auspicious turmeric ceremony with marigold petals',
        },
      ],
      gallery: { isEnabled: true },
      livestream: {
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isEnabled: true,
      },
    };

    it('renders couple names, Ganesh shloka, date, ceremonies, and WhatsApp RSVP button', () => {
      const html = normalizeHtml(renderToString(<WeddingWebsiteView wedding={mockWedding} />));

      expect(html).toContain('Vivek');
      expect(html).toContain('Eisha');
      expect(html).toContain('॥ श्री गणेशाय नमः ॥');
      expect(html).toContain('Indore');
      expect(html).toContain('We would love to celebrate our Shubh Vivah with you.');
      expect(html).toContain('Haldi Phoolon Ki Holi');
      expect(html).toContain('Sayaji Lawns');
      expect(html).toContain('Yellow Floral Attire');
      expect(html).toContain('Get Directions');
      expect(html).toContain('Wedding Live Streaming');
      expect(html).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(html).toContain('RSVP on WhatsApp');
    });

    it('renders preview banner when isPreview is true', () => {
      const html = normalizeHtml(
        renderToString(<WeddingWebsiteView wedding={mockWedding} isPreview={true} />)
      );

      expect(html).toContain('Preview Mode');
      expect(html).toContain('This website is currently unpublished');
    });

    it('renders Google Meet Virtual Room when provider is GOOGLE_MEET', () => {
      const googleMeetWedding: PublicWeddingDTO = {
        ...mockWedding,
        livestream: {
          provider: 'GOOGLE_MEET',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          instructions: 'Please keep mics muted during the ceremony',
          isEnabled: true,
        },
      };

      const html = normalizeHtml(
        renderToString(<WeddingWebsiteView wedding={googleMeetWedding} />)
      );

      expect(html).toContain('Virtual Wedding Ceremony Room');
      expect(html).toContain('Virtual Baithak & Live Room');
      expect(html).toContain('Join Google Meet Room');
      expect(html).toContain('https://meet.google.com/abc-defg-hij');
      expect(html).toContain('Please keep mics muted during the ceremony');
    });

    it('renders scheduled call time badge when scheduledStartTime is set', () => {
      const scheduledWedding: PublicWeddingDTO = {
        ...mockWedding,
        livestream: {
          provider: 'GOOGLE_MEET',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          scheduledStartTime: '2026-10-20T18:30:00Z',
          isEnabled: true,
        },
      };

      const html = normalizeHtml(
        renderToString(<WeddingWebsiteView wedding={scheduledWedding} />)
      );

      expect(html).toContain('🕒');
      expect(html).toContain('⏳');
    });
  });

  describe('WebsiteSettingsPage', () => {
    it('renders page layout with DashboardNav and manager heading', () => {
      const html = normalizeHtml(renderToString(<WebsiteSettingsPage />));

      expect(html).toContain('Make My Marriage');
      expect(html).toContain('Website');
    });
  });
});
