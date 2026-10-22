import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getVendors, POST as postVendor } from './route';
import { GET as getSummary } from './summary/route';
import { POST as postFromPlace } from './from-place/route';
import {
  GET as getSingleVendor,
  PATCH as patchVendor,
  DELETE as deleteVendor,
} from './[vendorId]/route';
import { GET as searchDiscovery } from '../vendor-discovery/search/route';
import { VendorService } from '@/modules/vendor/vendor.service';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Vendor API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMemberContext = {
    user: { id: 'u1', name: 'Divya', email: 'divya@example.com' },
    session: {} as any,
    membership: {
      _id: 'm1' as any,
      userId: 'u1' as any,
      weddingId: 'w1' as any,
      role: USER_ROLES.ADMIN,
      joinedAt: new Date(),
    } as any,
    wedding: {
      id: 'w1',
      brideName: 'Eisha',
      groomName: 'Vivek',
      weddingDate: '2026-10-20',
      timeZone: 'Asia/Kolkata',
      website: { slug: 'eisha-vivek-20102026' },
      location: { city: 'Indore', formattedAddress: 'Indore, MP' },
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  const mockVendorDTO = {
    id: 'v1',
    weddingId: 'w1',
    name: 'The Wedding Filmer Central',
    category: 'PHOTOGRAPHER' as const,
    contactPerson: 'Rohit Sharma',
    phone: '+91 98260 11223',
    email: 'rohit@filmer.in',
    address: 'Saket Nagar, Indore',
    website: 'https://weddingfilmer.in',
    totalAgreedCostPaise: 25000000,
    eventIds: [],
    events: [],
    notes: 'Drone coverage included',
    source: 'MANUAL' as const,
    googlePlaceId: null,
    rating: null,
    userRatingsTotal: null,
    archivedAt: null,
    totalPaidPaise: 5000000,
    totalExpensesPaise: 25000000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('GET /api/vendors', () => {
    it('returns 200 and list of vendors', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'listVendors').mockResolvedValue({
        vendors: [mockVendorDTO],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const req = new NextRequest('http://localhost:3000/api/vendors?category=PHOTOGRAPHER');
      const res = await getVendors(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.length).toBe(1);
      expect(json.data[0].name).toBe('The Wedding Filmer Central');
    });
  });

  describe('POST /api/vendors', () => {
    it('creates a new vendor and returns 201', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'createVendor').mockResolvedValue(mockVendorDTO);

      const req = new NextRequest('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'The Wedding Filmer Central',
          category: 'PHOTOGRAPHER',
          totalAgreedCost: 250000,
          notes: 'Drone coverage included',
        }),
      });

      const res = await postVendor(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.id).toBe('v1');
    });
  });

  describe('GET /api/vendors/summary', () => {
    it('returns summary metrics with 200', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'getVendorSummary').mockResolvedValue({
        totalVendors: 1,
        totalAgreedPaise: 25000000,
        totalPaidPaise: 5000000,
        pendingBalancePaise: 20000000,
        categoriesCount: 1,
        archivedCount: 0,
        categoryBreakdown: { PHOTOGRAPHER: { count: 1, totalPaise: 25000000 } },
      });

      const req = new NextRequest('http://localhost:3000/api/vendors/summary');
      const res = await getSummary(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.totalVendors).toBe(1);
      expect(json.data.totalAgreedPaise).toBe(25000000);
    });
  });

  describe('POST /api/vendors/from-place', () => {
    it('adds vendor from Google Place and returns 201', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'createVendorFromPlace').mockResolvedValue({
        ...mockVendorDTO,
        source: 'GOOGLE_PLACES',
        googlePlaceId: 'indore_venue_brilliant',
      });

      const req = new NextRequest('http://localhost:3000/api/vendors/from-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googlePlaceId: 'indore_venue_brilliant',
          name: 'Brilliant Convention Centre',
        }),
      });

      const res = await postFromPlace(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.source).toBe('GOOGLE_PLACES');
    });
  });

  describe('GET /api/vendors/[vendorId]', () => {
    it('returns vendor details by ID', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'getVendorById').mockResolvedValue(mockVendorDTO);

      const req = new NextRequest('http://localhost:3000/api/vendors/v1');
      const res = await getSingleVendor(req, { params: Promise.resolve({ vendorId: 'v1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.id).toBe('v1');
    });
  });

  describe('PATCH /api/vendors/[vendorId]', () => {
    it('updates vendor and returns updated DTO', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'updateVendor').mockResolvedValue({
        ...mockVendorDTO,
        notes: 'Updated contract notes',
      });

      const req = new NextRequest('http://localhost:3000/api/vendors/v1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Updated contract notes' }),
      });

      const res = await patchVendor(req, { params: Promise.resolve({ vendorId: 'v1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.notes).toBe('Updated contract notes');
    });
  });

  describe('DELETE /api/vendors/[vendorId]', () => {
    it('soft archives vendor by default', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'archiveVendor').mockResolvedValue({
        ...mockVendorDTO,
        archivedAt: new Date().toISOString(),
      });

      const req = new NextRequest('http://localhost:3000/api/vendors/v1', {
        method: 'DELETE',
      });

      const res = await deleteVendor(req, { params: Promise.resolve({ vendorId: 'v1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.archivedAt).toBeTruthy();
    });

    it('hard deletes vendor when permanent=true', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'deleteVendor').mockResolvedValue({ deleted: true });

      const req = new NextRequest('http://localhost:3000/api/vendors/v1?permanent=true', {
        method: 'DELETE',
      });

      const res = await deleteVendor(req, { params: Promise.resolve({ vendorId: 'v1' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.permanent).toBe(true);
    });
  });

  describe('GET /api/vendor-discovery/search', () => {
    it('returns discovered nearby vendors and city', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext as any);
      vi.spyOn(VendorService, 'searchNearbyVendors').mockResolvedValue({
        results: [
          {
            googlePlaceId: 'indore_venue_brilliant',
            name: 'Brilliant Convention Centre',
            category: 'VENUE',
            rating: 4.9,
            userRatingsTotal: 412,
            address: 'Vijay Nagar, Indore',
            phone: '+91 731 478 9000',
            website: 'https://brilliantconvention.com',
            latitude: 22.7667,
            longitude: 75.8978,
            isAdded: false,
            addedVendorId: null,
          },
        ],
        city: 'Indore',
      });

      const req = new NextRequest('http://localhost:3000/api/vendor-discovery/search?category=VENUE');
      const res = await searchDiscovery(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.city).toBe('Indore');
      expect(json.data.length).toBe(1);
      expect(json.data[0].googlePlaceId).toBe('indore_venue_brilliant');
    });
  });
});
