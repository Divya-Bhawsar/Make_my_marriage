import mongoose from 'mongoose';
import { connectToDatabase } from '@/server/db/connection';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { GuestModel, IGuest } from '@/modules/guest/guest.model';
import { WeddingEventModel, IWeddingEvent } from '@/modules/event/event.model';
import { NotFoundError } from '@/shared/errors/app-error';
import {
  BROADCAST_TEMPLATES,
  BroadcastTemplateType,
  QueryRecipientsInput,
} from './broadcast.schema';
import { normalizeWhatsAppPhone, formatPhoneDisplay } from '@/shared/utils/phone';
import { buildCSV } from '@/shared/utils/csv';
import { RSVP_STATUS, DIETARY_PREFERENCE, GUEST_SIDE } from '@/shared/constants';

export interface BroadcastRecipientDTO {
  guestId: string;
  name: string;
  phone: string | null;
  phoneDisplay: string;
  hasPhone: boolean;
  side: string;
  rsvpStatus: string;
  maxGuests: number;
  attendingCount: number | null;
  dietary: string;
  personalInviteUrl: string;
  personalizedMessage: string;
  whatsappUrl: string;
}

export interface BroadcastPreviewResult {
  template: BroadcastTemplateType;
  templateMessage: string;
  recipients: BroadcastRecipientDTO[];
  summary: {
    totalRecipients: number;
    phoneReadyCount: number;
    pendingRsvpCount: number;
    attendingCount: number;
  };
}

export class BroadcastService {
  /**
   * Generates message templates and personalized recipient links for WhatsApp broadcast.
   */
  static async getBroadcastRecipients(
    weddingId: string,
    query: QueryRecipientsInput,
    baseUrl: string = ''
  ): Promise<BroadcastPreviewResult> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    const events = await WeddingEventModel.find({
      weddingId: weddingObjectId,
      archivedAt: null,
    }).sort({ startsAt: 1 });

    // Build filter query for guests
    const filterQuery: mongoose.FilterQuery<IGuest> = {
      weddingId: weddingObjectId,
    };

    if (query.rsvpStatus && query.rsvpStatus !== 'ALL') {
      filterQuery.rsvpStatus = query.rsvpStatus;
    }

    if (query.side && query.side !== 'ALL') {
      filterQuery.side = query.side;
    }

    if (query.eventId) {
      filterQuery.invitedEventIds = new mongoose.Types.ObjectId(query.eventId);
    }

    const guests = await GuestModel.find(filterQuery).sort({ name: 1 });

    const coupleNames =
      wedding.title || `${wedding.brideName} & ${wedding.groomName}`;
    const weddingDateFormatted = new Date(wedding.weddingDate).toLocaleDateString(
      'en-IN',
      { dateStyle: 'long' }
    );
    const ceremoniesScheduleText = events.length > 0
      ? events
          .map(
            (e) =>
              `• ${e.name} (${new Date(e.startsAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })} at ${new Date(e.startsAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })})${e.venueName ? ` — ${e.venueName}` : ''}${
                e.dressCode ? ` [Theme: ${e.dressCode}]` : ''
              }`
          )
          .join('\n')
      : '• Wedding Celebrations';

    const defaultTemplateText = this.getDefaultTemplate(
      query.template,
      coupleNames,
      weddingDateFormatted,
      ceremoniesScheduleText,
      query.customMessage
    );

    let phoneReadyCount = 0;
    let pendingRsvpCount = 0;
    let attendingHeadcount = 0;

    const recipients: BroadcastRecipientDTO[] = guests.map((guest) => {
      const cleanPhone = normalizeWhatsAppPhone(guest.phone);
      const hasPhone = Boolean(cleanPhone);
      if (hasPhone) phoneReadyCount++;
      if (guest.rsvpStatus === RSVP_STATUS.PENDING) pendingRsvpCount++;
      if (guest.rsvpStatus === RSVP_STATUS.ATTENDING) {
        attendingHeadcount += guest.attendingCount ?? guest.maxGuests ?? 1;
      }

      const personalInviteUrl = baseUrl
        ? `${baseUrl}/invite/${guest.invitationToken}`
        : `/invite/${guest.invitationToken}`;
      const galleryUrl = baseUrl && wedding.gallery?.token
        ? `${baseUrl}/gallery/${wedding.gallery.token}`
        : '';
      const websiteUrl = baseUrl && wedding.website?.slug
        ? `${baseUrl}/w/${wedding.website.slug}`
        : '';

      const personalizedMessage = this.substituteMessageVariables(
        defaultTemplateText,
        {
          guestName: guest.name,
          coupleNames,
          weddingDate: weddingDateFormatted,
          rsvpUrl: personalInviteUrl,
          galleryUrl,
          websiteUrl,
          ceremoniesList: ceremoniesScheduleText,
        }
      );

      const encodedMessage = encodeURIComponent(personalizedMessage);
      const whatsappUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?text=${encodedMessage}`;

      return {
        guestId: guest._id.toString(),
        name: guest.name,
        phone: cleanPhone,
        phoneDisplay: formatPhoneDisplay(guest.phone),
        hasPhone,
        side: guest.side,
        rsvpStatus: guest.rsvpStatus,
        maxGuests: guest.maxGuests,
        attendingCount: guest.attendingCount ?? null,
        dietary: guest.dietary,
        personalInviteUrl,
        personalizedMessage,
        whatsappUrl,
      };
    });

    return {
      template: query.template,
      templateMessage: defaultTemplateText,
      recipients,
      summary: {
        totalRecipients: guests.length,
        phoneReadyCount,
        pendingRsvpCount,
        attendingCount: attendingHeadcount,
      },
    };
  }

  /**
   * Generates a comprehensive Guest Manifest CSV for Excel & Sheets.
   */
  static async generateGuestManifestCSV(weddingId: string): Promise<string> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    const [guests, events] = await Promise.all([
      GuestModel.find({ weddingId: weddingObjectId }).sort({ name: 1 }),
      WeddingEventModel.find({ weddingId: weddingObjectId, archivedAt: null }).sort({ startsAt: 1 }),
    ]);

    const eventMap = new Map<string, string>();
    for (const e of events) {
      eventMap.set(e._id.toString(), e.name);
    }

    // Calculate Summary Aggregates
    let totalInvitedMax = 0;
    let totalConfirmedAttending = 0;
    let pendingCount = 0;
    let declinedCount = 0;
    let pureVegCount = 0;
    let jainCount = 0;
    let nonVegCount = 0;

    for (const g of guests) {
      totalInvitedMax += g.maxGuests || 1;
      if (g.rsvpStatus === RSVP_STATUS.ATTENDING) {
        const count = g.attendingCount ?? g.maxGuests ?? 1;
        totalConfirmedAttending += count;
        if (g.dietary === DIETARY_PREFERENCE.PURE_VEG) pureVegCount += count;
        else if (g.dietary === DIETARY_PREFERENCE.JAIN) jainCount += count;
        else if (g.dietary === DIETARY_PREFERENCE.NON_VEG) nonVegCount += count;
      } else if (g.rsvpStatus === RSVP_STATUS.PENDING) {
        pendingCount++;
      } else if (g.rsvpStatus === RSVP_STATUS.NOT_ATTENDING) {
        declinedCount++;
      }
    }

    const coupleNames = wedding.title || `${wedding.brideName} & ${wedding.groomName}`;

    const rows: (unknown[])[] = [
      ['Make My Marriage — Official Guest Manifest & RSVP Report'],
      ['Wedding Celebration', coupleNames],
      ['Wedding Date', new Date(wedding.weddingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })],
      ['Export Timestamp', new Date().toISOString()],
      [],
      ['SUMMARY METRICS'],
      ['Total Guest Parties', guests.length],
      ['Total Invited Headcount (Max)', totalInvitedMax],
      ['Confirmed Attending Headcount', totalConfirmedAttending],
      ['Pending Responses', pendingCount],
      ['Declined Count', declinedCount],
      ['Attending Pure Veg Plates', pureVegCount],
      ['Attending Jain Plates', jainCount],
      ['Attending Non-Veg Plates', nonVegCount],
      [],
      [
        'Guest Name',
        'Side',
        'Phone Number',
        'Email Address',
        'RSVP Status',
        'Allowed Headcount',
        'Confirmed Attending',
        'Dietary Preference',
        'Invited Ceremonies',
        'Special Wishes / Dietary Notes',
        'Organizers Internal Notes',
      ],
    ];

    for (const g of guests) {
      const invitedEventNames = (g.invitedEventIds || [])
        .map((id) => eventMap.get(id.toString()))
        .filter(Boolean)
        .join('; ');

      rows.push([
        g.name,
        g.side,
        g.phone || '',
        g.email || '',
        g.rsvpStatus,
        g.maxGuests,
        g.rsvpStatus === RSVP_STATUS.ATTENDING ? (g.attendingCount ?? g.maxGuests) : 0,
        g.dietary,
        invitedEventNames || 'All Ceremonies',
        g.wishes || '',
        g.notes || '',
      ]);
    }

    return buildCSV(rows);
  }

  /**
   * Generates a chronological Ceremony Schedule and Logistics Run-Sheet CSV.
   */
  static async generateItineraryCSV(weddingId: string): Promise<string> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    const events = await WeddingEventModel.find({
      weddingId: weddingObjectId,
      archivedAt: null,
    }).sort({ startsAt: 1 });

    const coupleNames = wedding.title || `${wedding.brideName} & ${wedding.groomName}`;

    const rows: (unknown[])[] = [
      ['Make My Marriage — Ceremony Schedule & Logistics Run-Sheet'],
      ['Wedding Celebration', coupleNames],
      ['Total Ceremonies', events.length],
      ['Export Timestamp', new Date().toISOString()],
      [],
      [
        'Ceremony Name',
        'Ceremony Type',
        'Date',
        'Start Time',
        'End Time',
        'Venue Name',
        'Address',
        'Dress Code / Color Theme',
        'Description & Ritual Notes',
      ],
    ];

    for (const e of events) {
      rows.push([
        e.name,
        e.type,
        new Date(e.startsAt).toLocaleDateString('en-IN', { dateStyle: 'full' }),
        new Date(e.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        e.endsAt
          ? new Date(e.endsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : 'Until finish',
        e.venueName || '',
        e.address || '',
        e.dressCode || '',
        e.description || '',
      ]);
    }

    return buildCSV(rows);
  }

  /**
   * Generates Halwai & Caterer Plate Order Breakdown CSV.
   */
  static async generateCateringSummaryCSV(weddingId: string): Promise<string> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    const [events, guests] = await Promise.all([
      WeddingEventModel.find({ weddingId: weddingObjectId, archivedAt: null }).sort({ startsAt: 1 }),
      GuestModel.find({ weddingId: weddingObjectId, rsvpStatus: RSVP_STATUS.ATTENDING }),
    ]);

    const coupleNames = wedding.title || `${wedding.brideName} & ${wedding.groomName}`;

    const rows: (unknown[])[] = [
      ['Make My Marriage — Halwai & Catering Plate Order Specification'],
      ['Wedding Celebration', coupleNames],
      ['Export Timestamp', new Date().toISOString()],
      [
        'Note',
        'Recommended buffer includes a standard +10% surplus for unannounced elder companions or extra servings.',
      ],
      [],
      [
        'Ceremony / Meal Service',
        'Date & Time',
        'Venue',
        'Pure Veg Plates',
        'Jain (No Onion/Garlic) Plates',
        'Non-Veg Plates',
        'Total Confirmed Plates',
        '+10% Buffer Plates',
        'Total Recommended Cook Count',
      ],
    ];

    for (const e of events) {
      let pureVeg = 0;
      let jain = 0;
      let nonVeg = 0;

      // Filter attending guests invited to this event
      for (const g of guests) {
        const isInvited =
          !g.invitedEventIds ||
          g.invitedEventIds.length === 0 ||
          g.invitedEventIds.some((id) => id.toString() === e._id.toString());

        if (isInvited) {
          const plates = g.attendingCount ?? g.maxGuests ?? 1;
          if (g.dietary === DIETARY_PREFERENCE.JAIN) jain += plates;
          else if (g.dietary === DIETARY_PREFERENCE.NON_VEG) nonVeg += plates;
          else pureVeg += plates; // Default pure veg for Indian celebrations
        }
      }

      const totalConfirmed = pureVeg + jain + nonVeg;
      const buffer = Math.ceil(totalConfirmed * 0.1);
      const totalToCook = totalConfirmed + buffer;

      rows.push([
        e.name,
        `${new Date(e.startsAt).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        })} ${new Date(e.startsAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        e.venueName || '',
        pureVeg,
        jain,
        nonVeg,
        totalConfirmed,
        buffer,
        totalToCook,
      ]);
    }

    return buildCSV(rows);
  }

  /**
   * Replaces template placeholder tokens with personalized values.
   */
  private static substituteMessageVariables(
    template: string,
    vars: {
      guestName: string;
      coupleNames: string;
      weddingDate: string;
      rsvpUrl: string;
      galleryUrl: string;
      websiteUrl: string;
      ceremoniesList: string;
    }
  ): string {
    return template
      .replace(/{{guestName}}/g, vars.guestName)
      .replace(/{{coupleNames}}/g, vars.coupleNames)
      .replace(/{{weddingDate}}/g, vars.weddingDate)
      .replace(/{{rsvpUrl}}/g, vars.rsvpUrl)
      .replace(/{{galleryUrl}}/g, vars.galleryUrl)
      .replace(/{{websiteUrl}}/g, vars.websiteUrl)
      .replace(/{{ceremoniesList}}/g, vars.ceremoniesList);
  }

  /**
   * Provides default Indian wedding message templates.
   */
  private static getDefaultTemplate(
    type: BroadcastTemplateType,
    coupleNames: string,
    weddingDate: string,
    ceremoniesScheduleText: string,
    customMessage?: string
  ): string {
    switch (type) {
      case BROADCAST_TEMPLATES.RSVP_REMINDER:
        return `Namaste {{guestName}} ji! 🙏\n\nWith the blessings of our elders, our families are joyfully preparing for the wedding of *{{coupleNames}}* on *{{weddingDate}}*.\n\nTo ensure comfortable seating and customized catering arrangements for you and your family, please take a moment to confirm your attendance and meal preferences:\n\n👉 *Your Digital Invitation & RSVP:* \n{{rsvpUrl}}\n\nWarm regards,\nFamily of {{coupleNames}}`;

      case BROADCAST_TEMPLATES.CEREMONY_ITINERARY:
        return `Namaste {{guestName}} ji! 🙏\n\nHere is the ceremony schedule and venue guide for the upcoming wedding festivities of *{{coupleNames}}*:\n\n📅 *Ceremony Schedule & Themes:*\n{{ceremoniesList}}\n\n👉 *View complete map directions and updates:* \n{{rsvpUrl}}\n\nWe look forward to celebrating together!\nWith love, {{coupleNames}}`;

      case BROADCAST_TEMPLATES.PHOTO_VAULT:
        return `Namaste {{guestName}} ji! 📸✨\n\nThank you for gracing the wedding celebrations of *{{coupleNames}}* with your presence and warm blessings!\n\nWe would love to collect all the beautiful candid memories and selfies clicked by you during the ceremonies. Please upload your photos to our private wedding vault here:\n\n👉 *Upload Wedding Photos:* \n{{galleryUrl}}\n\nWith gratitude,\n{{coupleNames}}`;

      case BROADCAST_TEMPLATES.VIRTUAL_LIVESTREAM:
        return `Namaste {{guestName}} ji! 🪔\n\nAlthough distances keep us apart, your blessings are deeply cherished! We are delighted to share the live virtual wedding broadcast of *{{coupleNames}}* with you and your family.\n\n👉 *Join Virtual Wedding Live Stream:* \n{{websiteUrl}}\n\nPlease join us online and shower your blessings on the couple!\nWarmest regards, {{coupleNames}}`;

      case BROADCAST_TEMPLATES.CUSTOM:
      default:
        return customMessage ||
          `Namaste {{guestName}} ji! 🙏\n\nImportant wedding update regarding *{{coupleNames}}*:\n\n[Please insert your custom announcement here]\n\n👉 *Details & Schedule:* {{rsvpUrl}}\n\nWarm regards,\nFamily of {{coupleNames}}`;
    }
  }
}
