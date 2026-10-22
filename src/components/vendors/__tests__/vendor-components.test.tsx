import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { VendorMetricStrip } from '@/components/vendors/vendor-metric-strip';
import { VendorCard } from '@/components/vendors/vendor-card';
import { VendorModal } from '@/components/vendors/vendor-modal';
import { VendorDiscovery } from '@/components/vendors/vendor-discovery';
import VendorsPage from '@/app/(dashboard)/app/vendors/page';
import {
  IVendorResponse,
  IVendorSummaryMetrics,
} from '@/modules/vendor/vendor.service';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/vendors',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Vendor UI Components', () => {
  const mockMetrics: IVendorSummaryMetrics = {
    totalVendors: 6,
    totalAgreedPaise: 185000000, // ₹18,50,000
    totalPaidPaise: 67500000, // ₹6,75,000
    pendingBalancePaise: 117500000, // ₹11,75,000
    categoriesCount: 5,
    archivedCount: 1,
    categoryBreakdown: {
      PHOTOGRAPHER: { count: 1, totalPaise: 25000000 },
      CATERER: { count: 1, totalPaise: 45000000 },
      VENUE: { count: 1, totalPaise: 65000000 },
      DECORATOR: { count: 1, totalPaise: 35000000 },
      DJ: { count: 1, totalPaise: 15000000 },
    },
  };

  const mockVendor: IVendorResponse = {
    id: 'v1',
    weddingId: 'w1',
    name: 'The Wedding Filmer Central',
    category: 'PHOTOGRAPHER',
    contactPerson: 'Rohit Sharma',
    phone: '+91 98260 11223',
    email: 'rohit@filmer.in',
    address: 'Saket Nagar, Indore',
    website: 'https://weddingfilmer.in',
    totalAgreedCostPaise: 25000000,
    eventIds: ['e1'],
    events: [
      {
        id: 'e1',
        name: 'Sangeet & Cocktail Night',
        type: 'SANGEET',
        startsAt: '2026-10-19T19:00:00Z',
      },
    ],
    notes: '2 Cinematic cameras + 1 Drone camera included',
    source: 'GOOGLE_PLACES',
    googlePlaceId: 'indore_photo_weddingfilmer',
    rating: 4.9,
    userRatingsTotal: 218,
    archivedAt: null,
    totalPaidPaise: 5000000,
    totalExpensesPaise: 25000000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('VendorMetricStrip', () => {
    it('renders contracted budget, paid disbursements, and categories covered', () => {
      const html = normalizeHtml(renderToString(<VendorMetricStrip metrics={mockMetrics} />));

      expect(html).toContain('Booked Vendors');
      expect(html).toContain('Total Contracted');
      expect(html).toContain('Paid from Ledger');
      expect(html).toContain('Pending Balance');
      expect(html).toContain('₹18.5 L');
      expect(html).toContain('₹6.75 L');
      expect(html).toContain('5 of 14 categories');
      expect(html).toContain('Photography');
      expect(html).toContain('Catering & Halwai');
    });

    it('renders skeleton pulse when loading', () => {
      const html = renderToString(<VendorMetricStrip metrics={null} loading={true} />);
      expect(html).toContain('animate-pulse');
    });
  });

  describe('VendorCard', () => {
    it('renders vendor name, rating, contact links, agreed cost, and ceremony badges', () => {
      const html = normalizeHtml(
        renderToString(
          <VendorCard
            vendor={mockVendor}
            onEdit={vi.fn()}
            onArchiveToggle={vi.fn()}
            onDeletePermanent={vi.fn()}
          />
        )
      );

      expect(html).toContain('The Wedding Filmer Central');
      expect(html).toContain('Photography');
      expect(html).toContain('Rohit Sharma');
      expect(html).toContain('+91 98260 11223');
      expect(html).toContain('tel:+91 98260 11223');
      expect(html).toContain('Saket Nagar, Indore');
      expect(html).toContain('Google Verified');
      expect(html).toContain('4.9');
      expect(html).toContain('218 Google reviews');
      expect(html).toContain('₹2,50,000');
      expect(html).toContain('Sangeet & Cocktail Night');
      expect(html).toContain('2 Cinematic cameras + 1 Drone camera included');
      expect(html).toContain('Edit');
      expect(html).toContain('Call');
      expect(html).toContain('Archive');
    });
  });

  describe('VendorModal', () => {
    it('renders input fields with prefilled values when editing a vendor', () => {
      const html = normalizeHtml(
        renderToString(
          <VendorModal
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
            vendorToEdit={mockVendor}
            ceremonies={[
              { id: 'e1', name: 'Sangeet & Cocktail', type: 'SANGEET' },
              { id: 'e2', name: 'Pheras & Shubh Vivah', type: 'WEDDING' },
            ]}
          />
        )
      );

      expect(html).toContain('Edit Booked Vendor');
      expect(html).toContain('The Wedding Filmer Central');
      expect(html).toContain('Rohit Sharma');
      expect(html).toContain('+91 98260 11223');
      expect(html).toContain('250000');
      expect(html).toContain('Update Vendor');
    });

    it('returns null when modal is closed', () => {
      const html = renderToString(
        <VendorModal
          isOpen={false}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          ceremonies={[]}
        />
      );
      expect(html).toBe('');
    });
  });

  describe('VendorDiscovery', () => {
    it('renders marketplace search input and category pills', () => {
      const html = normalizeHtml(
        renderToString(<VendorDiscovery onVendorAdded={vi.fn()} />)
      );

      expect(html).toContain('Nearby Wedding Marketplace');
      expect(html).toContain('Discover Wedding Vendors near');
      expect(html).toContain('All Categories');
      expect(html).toContain('Search vendor name or area...');
    });
  });

  describe('VendorsPage', () => {
    it('renders the complete vendors page structure with DashboardNav', () => {
      const html = normalizeHtml(renderToString(<VendorsPage />));
      expect(html).toContain('Make My Marriage');
      expect(html).toContain('Vendor Notebook');
      expect(html).toContain('Vendors');
    });
  });
});
