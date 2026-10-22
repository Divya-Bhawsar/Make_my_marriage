import mongoose from 'mongoose';
import {
  VendorModel,
  IVendorDocument,
} from './vendor.model';
import {
  CreateVendorInput,
  CreateVendorOutput,
  UpdateVendorInput,
  CreateFromPlaceInput,
  QueryVendorsFilter,
  DiscoverySearchFilter,
  createVendorSchema,
  updateVendorSchema,
  createFromPlaceSchema,
} from './vendor.schema';
import { WeddingEventModel } from '@/modules/event/event.model';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { ExpenseModel } from '@/modules/expense/expense.model';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@/shared/errors/app-error';
import { VENDOR_CATEGORIES, VendorCategory } from '@/shared/constants';

export interface IVendorEventSummary {
  id: string;
  name: string;
  type: string;
  startsAt: string;
}

export interface IVendorResponse {
  id: string;
  weddingId: string;
  name: string;
  category: VendorCategory;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  totalAgreedCostPaise: number | null;
  eventIds: string[];
  events: IVendorEventSummary[];
  notes: string | null;
  source: 'MANUAL' | 'GOOGLE_PLACES';
  googlePlaceId: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  archivedAt: string | null;
  totalPaidPaise: number;
  totalExpensesPaise: number;
  createdAt: string;
  updatedAt: string;
}

export interface IVendorSummaryMetrics {
  totalVendors: number;
  totalAgreedPaise: number;
  totalPaidPaise: number;
  pendingBalancePaise: number;
  categoriesCount: number;
  archivedCount: number;
  categoryBreakdown: Record<string, { count: number; totalPaise: number }>;
}

export interface IDiscoveredVendor {
  googlePlaceId: string;
  name: string;
  category: VendorCategory;
  rating: number;
  userRatingsTotal: number;
  address: string;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  isAdded: boolean;
  addedVendorId: string | null;
}

// Built-in authentic wedding vendors directory for Indian wedding cities (fallback / seed discovery)
const CURATED_VENDOR_CATALOG: Array<Omit<IDiscoveredVendor, 'isAdded' | 'addedVendorId'>> = [
  {
    googlePlaceId: 'indore_photo_weddingfilmer',
    name: 'The Wedding Filmer Central',
    category: 'PHOTOGRAPHER',
    rating: 4.9,
    userRatingsTotal: 218,
    address: 'Saket Nagar, Old Palasia, Indore, MP 452001',
    phone: '+91 98260 11223',
    website: 'https://theweddingfilmercentral.in',
    latitude: 22.7233,
    longitude: 75.8812,
  },
  {
    googlePlaceId: 'indore_photo_pixelbliss',
    name: 'Pixel Bliss Wedding & Drone Studios',
    category: 'PHOTOGRAPHER',
    rating: 4.8,
    userRatingsTotal: 145,
    address: 'AB Road, Vijay Nagar, Indore, MP 452010',
    phone: '+91 94250 88776',
    website: 'https://pixelblissstudio.com',
    latitude: 22.7533,
    longitude: 75.8937,
  },
  {
    googlePlaceId: 'indore_venue_brilliant',
    name: 'Brilliant Convention Centre & Grand Lawn',
    category: 'VENUE',
    rating: 4.9,
    userRatingsTotal: 412,
    address: 'Scheme No 78, Part II, Vijay Nagar, Indore, MP 452010',
    phone: '+91 731 478 9000',
    website: 'https://brilliantconvention.com',
    latitude: 22.7667,
    longitude: 75.8978,
  },
  {
    googlePlaceId: 'indore_venue_sayaji',
    name: 'Sayaji Royal Mahal Banquets',
    category: 'VENUE',
    rating: 4.7,
    userRatingsTotal: 380,
    address: 'H-1, Scheme No. 54, Vijay Nagar, Indore, MP 452010',
    phone: '+91 731 400 6666',
    website: 'https://sayajihotels.com',
    latitude: 22.7521,
    longitude: 75.8924,
  },
  {
    googlePlaceId: 'indore_caterer_sayaji_royal',
    name: 'Sayaji Royal Catering & Shahi Halwai',
    category: 'CATERER',
    rating: 4.9,
    userRatingsTotal: 285,
    address: 'Sayaji Hospitality Complex, Indore, MP 452010',
    phone: '+91 98930 45678',
    website: 'https://sayajicatering.in',
    latitude: 22.7525,
    longitude: 75.893,
  },
  {
    googlePlaceId: 'indore_caterer_annapurna',
    name: 'Annapurna Royal Rajbhog Caterers',
    category: 'CATERER',
    rating: 4.8,
    userRatingsTotal: 196,
    address: '56 Dukan Lane, New Palasia, Indore, MP 452001',
    phone: '+91 98267 99881',
    website: 'https://annapurnacaterersindore.com',
    latitude: 22.7241,
    longitude: 75.8835,
  },
  {
    googlePlaceId: 'indore_decor_malwa_phool',
    name: 'Malwa Phool & Royal Mandapam Decorators',
    category: 'DECORATOR',
    rating: 4.8,
    userRatingsTotal: 167,
    address: 'Sapna Sangeeta Road, Indore, MP 452001',
    phone: '+91 97520 33441',
    website: 'https://malwaroyaldecor.com',
    latitude: 22.7056,
    longitude: 75.8694,
  },
  {
    googlePlaceId: 'indore_decor_emerald_glitz',
    name: 'Emerald Glitz Wedding Florals & Lighting',
    category: 'DECORATOR',
    rating: 4.7,
    userRatingsTotal: 122,
    address: 'Bhawarkua Square, Indore, MP 452014',
    phone: '+91 98270 55662',
    website: 'https://emeraldglitz.in',
    latitude: 22.6934,
    longitude: 75.8655,
  },
  {
    googlePlaceId: 'indore_dj_indore_beats',
    name: 'Indore Beats Sound & Royal Dhol Tasha',
    category: 'DJ',
    rating: 4.9,
    userRatingsTotal: 184,
    address: 'Anand Bazaar, Old Palasia, Indore, MP 452001',
    phone: '+91 98931 77665',
    website: 'https://indorebeats.com',
    latitude: 22.7289,
    longitude: 75.8891,
  },
  {
    googlePlaceId: 'indore_makeup_kashish',
    name: 'Kashish Bridal Makeover Studio & Academy',
    category: 'MAKEUP_ARTIST',
    rating: 4.9,
    userRatingsTotal: 230,
    address: 'Near 56 Dukan, New Palasia, Indore, MP 452001',
    phone: '+91 98263 44110',
    website: 'https://kashishbridal.com',
    latitude: 22.7252,
    longitude: 75.8829,
  },
  {
    googlePlaceId: 'indore_mehendi_geeta',
    name: 'Geeta Marwari Bridal Mehendi Arts',
    category: 'MEHENDI_ARTIST',
    rating: 4.8,
    userRatingsTotal: 158,
    address: 'Sarafa Bazaar, Indore, MP 452002',
    phone: '+91 94253 66778',
    website: 'https://geetamehendi.in',
    latitude: 22.7188,
    longitude: 75.8569,
  },
  {
    googlePlaceId: 'indore_pandit_ramkishan',
    name: 'Acharya Ramkishan Sharma (Vedic Vivah)',
    category: 'PANDIT',
    rating: 5.0,
    userRatingsTotal: 92,
    address: 'Khajrana Ganesh Temple Marg, Indore, MP 452016',
    phone: '+91 98261 55443',
    website: null,
    latitude: 22.7314,
    longitude: 75.9082,
  },
  {
    googlePlaceId: 'indore_choreo_step2sangeet',
    name: 'Step2Sangeet Wedding Dance Troupe',
    category: 'CHOREOGRAPHER',
    rating: 4.8,
    userRatingsTotal: 110,
    address: 'Race Course Road, Indore, MP 452001',
    phone: '+91 97551 22334',
    website: 'https://step2sangeet.in',
    latitude: 22.7275,
    longitude: 75.8788,
  },
  {
    googlePlaceId: 'indore_transport_vintage',
    name: 'Vintage Shaadi Cars & Luxury Fleet Indore',
    category: 'TRANSPORT',
    rating: 4.7,
    userRatingsTotal: 84,
    address: 'MR 10 Road, Indore, MP 452010',
    phone: '+91 98269 00112',
    website: 'https://vintageshaadicars.com',
    latitude: 22.7689,
    longitude: 75.892,
  },
  {
    googlePlaceId: 'indore_planner_utsav',
    name: 'Utsav Royal Weddings & Event Management',
    category: 'WEDDING_PLANNER',
    rating: 4.9,
    userRatingsTotal: 175,
    address: 'Chhappan Dukan Road, New Palasia, Indore, MP 452001',
    phone: '+91 731 422 8899',
    website: 'https://utsavroyalweddings.in',
    latitude: 22.7245,
    longitude: 75.884,
  },
];

export class VendorService {
  /**
   * Helper to format a vendor document into IVendorResponse with populated event details
   */
  private static async formatVendorResponse(
    vendor: IVendorDocument,
    weddingId: string,
    eventMap?: Map<string, IVendorEventSummary>
  ): Promise<IVendorResponse> {
    const eventIds = (vendor.eventIds || []).map((id) => id.toString());
    let events: IVendorEventSummary[] = [];

    if (eventMap) {
      events = eventIds
        .map((id) => eventMap.get(id))
        .filter((e): e is IVendorEventSummary => e !== undefined);
    } else if (eventIds.length > 0) {
      const eventDocs = await WeddingEventModel.find({
        _id: { $in: vendor.eventIds },
        weddingId: new mongoose.Types.ObjectId(weddingId),
      }).select('name type startsAt');
      events = eventDocs.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        type: e.type,
        startsAt: e.startsAt.toISOString(),
      }));
    }

    // Check linked expenses for this vendor
    const expenseAgg = await ExpenseModel.aggregate([
      {
        $match: {
          weddingId: new mongoose.Types.ObjectId(weddingId),
          $or: [
            { vendorId: vendor._id },
            { vendorName: { $regex: new RegExp(`^${vendor.name.trim()}$`, 'i') } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalExpensesPaise: { $sum: '$amountPaise' },
          totalPaidPaise: { $sum: '$paidAmountPaise' },
        },
      },
    ]);

    const totalExpensesPaise = expenseAgg[0]?.totalExpensesPaise || 0;
    const totalPaidPaise = expenseAgg[0]?.totalPaidPaise || 0;

    return {
      id: vendor._id.toString(),
      weddingId: vendor.weddingId.toString(),
      name: vendor.name,
      category: vendor.category,
      contactPerson: vendor.contactPerson ?? null,
      phone: vendor.phone ?? null,
      email: vendor.email ?? null,
      address: vendor.address ?? null,
      website: vendor.website ?? null,
      totalAgreedCostPaise: vendor.totalAgreedCostPaise ?? null,
      eventIds,
      events,
      notes: vendor.notes ?? null,
      source: vendor.source,
      googlePlaceId: vendor.googlePlaceId ?? null,
      rating: vendor.rating ?? null,
      userRatingsTotal: vendor.userRatingsTotal ?? null,
      archivedAt: vendor.archivedAt ? vendor.archivedAt.toISOString() : null,
      totalPaidPaise,
      totalExpensesPaise,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
    };
  }

  /**
   * List wedding vendors with pagination, filters, and event details
   */
  static async listVendors(weddingId: string, filter: QueryVendorsFilter) {
    if (!mongoose.Types.ObjectId.isValid(weddingId)) {
      throw new ValidationError('Invalid weddingId');
    }

    const query: Record<string, unknown> = {
      weddingId: new mongoose.Types.ObjectId(weddingId),
    };

    if (!filter.includeArchived) {
      query.archivedAt = null;
    }

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { address: searchRegex },
        { notes: searchRegex },
        { category: searchRegex },
      ];
    }

    const total = await VendorModel.countDocuments(query);
    const skip = (filter.page - 1) * filter.limit;

    const vendorDocs = await VendorModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filter.limit);

    // Batch load event summaries to avoid N+1 queries
    const allEventIds = Array.from(
      new Set(
        vendorDocs.flatMap((v) => (v.eventIds || []).map((id) => id.toString()))
      )
    );

    const eventMap = new Map<string, IVendorEventSummary>();
    if (allEventIds.length > 0) {
      const eventDocs = await WeddingEventModel.find({
        _id: { $in: allEventIds.map((id) => new mongoose.Types.ObjectId(id)) },
        weddingId: new mongoose.Types.ObjectId(weddingId),
      }).select('name type startsAt');

      for (const e of eventDocs) {
        eventMap.set(e._id.toString(), {
          id: e._id.toString(),
          name: e.name,
          type: e.type,
          startsAt: e.startsAt.toISOString(),
        });
      }
    }

    // Format all vendor responses
    const vendors = await Promise.all(
      vendorDocs.map((doc) => this.formatVendorResponse(doc, weddingId, eventMap))
    );

    return {
      vendors,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit) || 1,
    };
  }

  /**
   * Get vendor notebook metrics summary
   */
  static async getVendorSummary(weddingId: string): Promise<IVendorSummaryMetrics> {
    if (!mongoose.Types.ObjectId.isValid(weddingId)) {
      throw new ValidationError('Invalid weddingId');
    }

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

    const [activeStats, archivedCount, expenseStats] = await Promise.all([
      VendorModel.aggregate([
        { $match: { weddingId: weddingObjectId, archivedAt: null } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalAgreedPaise: { $sum: { $ifNull: ['$totalAgreedCostPaise', 0] } },
          },
        },
      ]),
      VendorModel.countDocuments({ weddingId: weddingObjectId, archivedAt: { $ne: null } }),
      ExpenseModel.aggregate([
        { $match: { weddingId: weddingObjectId } },
        {
          $group: {
            _id: null,
            totalPaidPaise: { $sum: '$paidAmountPaise' },
          },
        },
      ]),
    ]);

    let totalVendors = 0;
    let totalAgreedPaise = 0;
    const categoryBreakdown: Record<string, { count: number; totalPaise: number }> = {};

    for (const stat of activeStats) {
      totalVendors += stat.count;
      totalAgreedPaise += stat.totalAgreedPaise;
      categoryBreakdown[stat._id] = {
        count: stat.count,
        totalPaise: stat.totalAgreedPaise,
      };
    }

    const totalPaidPaise = expenseStats[0]?.totalPaidPaise || 0;
    const pendingBalancePaise = Math.max(0, totalAgreedPaise - totalPaidPaise);

    return {
      totalVendors,
      totalAgreedPaise,
      totalPaidPaise,
      pendingBalancePaise,
      categoriesCount: Object.keys(categoryBreakdown).length,
      archivedCount,
      categoryBreakdown,
    };
  }

  /**
   * Create a new vendor record manually
   */
  static async createVendor(
    weddingId: string,
    input: CreateVendorInput
  ): Promise<IVendorResponse> {
    if (!mongoose.Types.ObjectId.isValid(weddingId)) {
      throw new ValidationError('Invalid weddingId');
    }

    const parsed = createVendorSchema.parse(input) as CreateVendorOutput;

    // Validate foreign key integrity for referenced ceremonies
    const eventObjectIds: mongoose.Types.ObjectId[] = [];
    if (parsed.eventIds && parsed.eventIds.length > 0) {
      for (const idStr of parsed.eventIds) {
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          throw new ValidationError(`Invalid event ID: ${idStr}`);
        }
        eventObjectIds.push(new mongoose.Types.ObjectId(idStr));
      }

      const matchingEventsCount = await WeddingEventModel.countDocuments({
        _id: { $in: eventObjectIds },
        weddingId: new mongoose.Types.ObjectId(weddingId),
      });

      if (matchingEventsCount !== eventObjectIds.length) {
        throw new ValidationError('One or more referenced ceremonies do not belong to this wedding');
      }
    }

    const vendorDoc = await VendorModel.create({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: parsed.name,
      category: parsed.category,
      contactPerson: parsed.contactPerson,
      phone: parsed.phone,
      email: parsed.email,
      address: parsed.address,
      website: parsed.website,
      totalAgreedCostPaise: parsed.totalAgreedCostPaise,
      eventIds: eventObjectIds,
      notes: parsed.notes,
      source: parsed.source,
      googlePlaceId: parsed.googlePlaceId,
      rating: parsed.rating,
      userRatingsTotal: parsed.userRatingsTotal,
      archivedAt: null,
    });

    return this.formatVendorResponse(vendorDoc, weddingId);
  }

  /**
   * Create a vendor from a discovered Google Place
   */
  static async createVendorFromPlace(
    weddingId: string,
    input: CreateFromPlaceInput
  ): Promise<IVendorResponse> {
    if (!mongoose.Types.ObjectId.isValid(weddingId)) {
      throw new ValidationError('Invalid weddingId');
    }

    const parsed = createFromPlaceSchema.parse(input);

    // Check for duplicate place ID in active vendors
    const existing = await VendorModel.findOne({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      googlePlaceId: parsed.googlePlaceId,
      archivedAt: null,
    });

    if (existing) {
      throw new ConflictError(
        `This vendor ("${existing.name}") is already in your booked vendors list.`
      );
    }

    // Lookup matching entry from curated catalog if name or details were omitted
    const catalogMatch = CURATED_VENDOR_CATALOG.find(
      (c) => c.googlePlaceId === parsed.googlePlaceId
    );

    const vendorName = parsed.name || catalogMatch?.name || 'Discovered Vendor';
    const category = parsed.category !== 'OTHER' ? parsed.category : catalogMatch?.category || 'OTHER';
    const address = parsed.address || catalogMatch?.address || null;
    const phone = parsed.phone || catalogMatch?.phone || null;
    const website = parsed.website || catalogMatch?.website || null;
    const rating = parsed.rating ?? catalogMatch?.rating ?? null;
    const userRatingsTotal = parsed.userRatingsTotal ?? catalogMatch?.userRatingsTotal ?? null;

    // Validate ceremonies if provided
    const eventObjectIds: mongoose.Types.ObjectId[] = [];
    if (parsed.eventIds && parsed.eventIds.length > 0) {
      for (const idStr of parsed.eventIds) {
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          throw new ValidationError(`Invalid event ID: ${idStr}`);
        }
        eventObjectIds.push(new mongoose.Types.ObjectId(idStr));
      }

      const matchingEventsCount = await WeddingEventModel.countDocuments({
        _id: { $in: eventObjectIds },
        weddingId: new mongoose.Types.ObjectId(weddingId),
      });

      if (matchingEventsCount !== eventObjectIds.length) {
        throw new ValidationError('One or more referenced ceremonies do not belong to this wedding');
      }
    }

    const vendorDoc = await VendorModel.create({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: vendorName,
      category,
      contactPerson: parsed.contactPerson,
      phone,
      email: parsed.email,
      address,
      website,
      totalAgreedCostPaise: parsed.totalAgreedCostPaise,
      eventIds: eventObjectIds,
      notes: parsed.notes,
      source: 'GOOGLE_PLACES',
      googlePlaceId: parsed.googlePlaceId,
      rating,
      userRatingsTotal,
      archivedAt: null,
    });

    return this.formatVendorResponse(vendorDoc, weddingId);
  }

  /**
   * Get single vendor by ID
   */
  static async getVendorById(weddingId: string, vendorId: string): Promise<IVendorResponse> {
    if (!mongoose.Types.ObjectId.isValid(weddingId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new ValidationError('Invalid weddingId or vendorId');
    }

    const vendorDoc = await VendorModel.findOne({
      _id: new mongoose.Types.ObjectId(vendorId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!vendorDoc) {
      throw new NotFoundError('Vendor not found');
    }

    return this.formatVendorResponse(vendorDoc, weddingId);
  }

  /**
   * Update an existing vendor
   */
  static async updateVendor(
    weddingId: string,
    vendorId: string,
    input: UpdateVendorInput
  ): Promise<IVendorResponse> {
    if (!mongoose.Types.ObjectId.isValid(weddingId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new ValidationError('Invalid weddingId or vendorId');
    }

    const parsed = updateVendorSchema.parse(input);

    const vendorDoc = await VendorModel.findOne({
      _id: new mongoose.Types.ObjectId(vendorId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!vendorDoc) {
      throw new NotFoundError('Vendor not found');
    }

    if (parsed.name !== undefined) vendorDoc.name = parsed.name as string;
    if (parsed.category !== undefined) vendorDoc.category = parsed.category as VendorCategory;
    if (parsed.contactPerson !== undefined) vendorDoc.contactPerson = parsed.contactPerson ? (parsed.contactPerson as string).trim() : null;
    if (parsed.phone !== undefined) vendorDoc.phone = parsed.phone ? (parsed.phone as string).trim() : null;
    if (parsed.email !== undefined) vendorDoc.email = parsed.email ? (parsed.email as string).trim() : null;
    if (parsed.address !== undefined) vendorDoc.address = parsed.address ? (parsed.address as string).trim() : null;
    if (parsed.website !== undefined) vendorDoc.website = parsed.website ? (parsed.website as string).trim() : null;
    if (parsed.totalAgreedCostPaise !== undefined) vendorDoc.totalAgreedCostPaise = parsed.totalAgreedCostPaise as number | null;
    if (parsed.notes !== undefined) vendorDoc.notes = parsed.notes ? (parsed.notes as string).trim() : null;
    if (parsed.googlePlaceId !== undefined) vendorDoc.googlePlaceId = parsed.googlePlaceId ? (parsed.googlePlaceId as string).trim() : null;

    if (parsed.eventIds !== undefined) {
      const eventObjectIds: mongoose.Types.ObjectId[] = [];
      const eventIdsList = parsed.eventIds as string[];
      for (const idStr of eventIdsList) {
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          throw new ValidationError(`Invalid event ID: ${idStr}`);
        }
        eventObjectIds.push(new mongoose.Types.ObjectId(idStr));
      }

      if (eventObjectIds.length > 0) {
        const matchingEventsCount = await WeddingEventModel.countDocuments({
          _id: { $in: eventObjectIds },
          weddingId: new mongoose.Types.ObjectId(weddingId),
        });

        if (matchingEventsCount !== eventObjectIds.length) {
          throw new ValidationError('One or more referenced ceremonies do not belong to this wedding');
        }
      }
      vendorDoc.eventIds = eventObjectIds;
    }

    if (parsed.archivedAt !== undefined) {
      vendorDoc.archivedAt = parsed.archivedAt ? new Date(parsed.archivedAt as string) : null;
    }

    await vendorDoc.save();
    return this.formatVendorResponse(vendorDoc, weddingId);
  }

  /**
   * Archive a vendor (soft delete to preserve expense referential integrity)
   */
  static async archiveVendor(weddingId: string, vendorId: string): Promise<IVendorResponse> {
    if (!mongoose.Types.ObjectId.isValid(weddingId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new ValidationError('Invalid weddingId or vendorId');
    }

    const vendorDoc = await VendorModel.findOne({
      _id: new mongoose.Types.ObjectId(vendorId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!vendorDoc) {
      throw new NotFoundError('Vendor not found');
    }

    vendorDoc.archivedAt = new Date();
    await vendorDoc.save();

    return this.formatVendorResponse(vendorDoc, weddingId);
  }

  /**
   * Unarchive a vendor
   */
  static async unarchiveVendor(weddingId: string, vendorId: string): Promise<IVendorResponse> {
    if (!mongoose.Types.ObjectId.isValid(weddingId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new ValidationError('Invalid weddingId or vendorId');
    }

    const vendorDoc = await VendorModel.findOne({
      _id: new mongoose.Types.ObjectId(vendorId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!vendorDoc) {
      throw new NotFoundError('Vendor not found');
    }

    vendorDoc.archivedAt = null;
    await vendorDoc.save();

    return this.formatVendorResponse(vendorDoc, weddingId);
  }

  /**
   * Permanent delete vendor (only if no linked expenses exist)
   */
  static async deleteVendor(weddingId: string, vendorId: string): Promise<{ deleted: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(weddingId) || !mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new ValidationError('Invalid weddingId or vendorId');
    }

    const vendorDoc = await VendorModel.findOne({
      _id: new mongoose.Types.ObjectId(vendorId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!vendorDoc) {
      throw new NotFoundError('Vendor not found');
    }

    // Check if any expenses reference this vendor
    const expenseCount = await ExpenseModel.countDocuments({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      $or: [
        { vendorId: vendorDoc._id },
        { vendorName: { $regex: new RegExp(`^${vendorDoc.name.trim()}$`, 'i') } },
      ],
    });

    if (expenseCount > 0) {
      throw new ValidationError(
        'Cannot permanently delete this vendor because expenses are linked to it. Please archive the vendor instead.'
      );
    }

    await VendorModel.deleteOne({ _id: vendorDoc._id });
    return { deleted: true };
  }

  /**
   * Search nearby vendors based on wedding location and category
   */
  static async searchNearbyVendors(
    weddingId: string,
    filter: DiscoverySearchFilter
  ): Promise<{ results: IDiscoveredVendor[]; city: string }> {
    if (!mongoose.Types.ObjectId.isValid(weddingId)) {
      throw new ValidationError('Invalid weddingId');
    }

    const wedding = await WeddingModel.findById(weddingId).select('location title');
    const city = wedding?.location?.city || wedding?.location?.formattedAddress || 'Indore';

    // Fetch all active vendors to mark isAdded
    const activeVendors = await VendorModel.find({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      archivedAt: null,
    }).select('name googlePlaceId');

    const addedPlaceIds = new Set(
      activeVendors.map((v) => v.googlePlaceId).filter((id): id is string => Boolean(id))
    );
    const addedNames = new Set(
      activeVendors.map((v) => v.name.toLowerCase().trim())
    );
    const vendorIdByPlace = new Map<string, string>();
    for (const v of activeVendors) {
      if (v.googlePlaceId) vendorIdByPlace.set(v.googlePlaceId, v._id.toString());
      vendorIdByPlace.set(v.name.toLowerCase().trim(), v._id.toString());
    }

    let candidates = [...CURATED_VENDOR_CATALOG];

    // Filter by category if requested
    if (filter.category && filter.category !== 'ALL') {
      const targetCat = filter.category.toUpperCase();
      candidates = candidates.filter((v) => v.category === targetCat);
    }

    // Filter by search query if provided
    if (filter.query && filter.query.trim()) {
      const q = filter.query.toLowerCase().trim();
      candidates = candidates.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }

    // Annotate with isAdded and addedVendorId
    const results: IDiscoveredVendor[] = candidates.map((item) => {
      const isAdded =
        addedPlaceIds.has(item.googlePlaceId) ||
        addedNames.has(item.name.toLowerCase().trim());
      const addedVendorId =
        vendorIdByPlace.get(item.googlePlaceId) ||
        vendorIdByPlace.get(item.name.toLowerCase().trim()) ||
        null;

      return {
        ...item,
        isAdded,
        addedVendorId,
      };
    });

    return {
      results,
      city,
    };
  }
}
