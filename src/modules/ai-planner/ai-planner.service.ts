import mongoose from 'mongoose';
import { connectToDatabase } from '@/server/db/connection';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { GuestModel } from '@/modules/guest/guest.model';
import { ExpenseModel } from '@/modules/expense/expense.model';
import { TaskModel } from '@/modules/task/task.model';
import { WeddingMembershipModel } from '@/modules/wedding/membership.model';
import { NotFoundError } from '@/shared/errors/app-error';
import {
  HalwaiCalculationInput,
  CulturalPresetType,
  CULTURAL_PRESET_TYPES,
  BudgetOptimizerInput,
  BUDGET_PRIORITY_FOCUS,
} from './ai-planner.schema';
import { StandardEventType } from '@/shared/constants';

export interface HalwaiRationItem {
  ingredient: string;
  quantity: number;
  unit: string;
  notes: string;
}

export interface HalwaiEstimateResult {
  invitedHeadcount: number;
  expectedTurnout: number;
  turnoutPercent: number;
  safetyBufferPercent: number;
  recommendedPlates: number;
  flatCatererQuotePlates: number;
  platesSaved: number;
  costPerPlate: number;
  estimatedRupeeSavings: number;
  totalEstimatedCateringRupees: number;
  rationList: HalwaiRationItem[];
  turnoutTip: string;
}

export interface CulturalCeremonyPresetItem {
  name: string;
  type: StandardEventType;
  dayOffset: number; // relative to wedding date
  timeSlot: string; // e.g. "10:00 AM"
  significance: string;
  dressCode: string;
  samagriList: string[];
  tasks: string[];
}

export interface CulturalPresetDefinition {
  culture: CulturalPresetType;
  title: string;
  regionalTag: string;
  description: string;
  ceremonies: CulturalCeremonyPresetItem[];
}

export interface CategoryBudgetAnalysis {
  categoryKey: string;
  categoryLabel: string;
  recommendedPercent: number;
  allocatedRupees: number;
  actualSpentRupees: number;
  remainingRupees: number;
  status: 'HEALTHY' | 'NEARING_LIMIT' | 'OVER_BUDGET';
  tips: string[];
}

export interface BudgetOptimizerResult {
  totalBudgetRupees: number;
  totalSpentRupees: number;
  totalRemainingRupees: number;
  budgetHealthScore: number; // 0 to 100
  priorityFocus: string;
  categories: CategoryBudgetAnalysis[];
  topRecommendations: string[];
}

export interface PlannerAdvisorResponse {
  topic: string;
  title: string;
  summary: string;
  actionableInsights: string[];
  checklistItems: string[];
}

export class AiPlannerService {
  /**
   * Calculates plate counts and wholesale raw material (ration) estimates for Indian catering.
   */
  static async calculateHalwaiEstimates(
    weddingId: string,
    input: HalwaiCalculationInput
  ): Promise<HalwaiEstimateResult> {
    await connectToDatabase();

    const wedding = await WeddingModel.findOne({
      _id: new mongoose.Types.ObjectId(weddingId),
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    // Baseline turnout by ceremony type in Indian weddings
    let baselineTurnout = 88;
    let safetyBuffer = 12;
    let turnoutTip = 'Standard wedding ceremony turnout.';

    switch (input.ceremonyType) {
      case 'SANGEET':
        baselineTurnout = 95;
        safetyBuffer = 10;
        turnoutTip = 'High turnout expected. Youth and close family arrive early for dance performances.';
        break;
      case 'RECEPTION':
        baselineTurnout = 98;
        safetyBuffer = 14;
        turnoutTip = 'Maximum turnout with local acquaintances, colleagues, and unannounced family walk-ins.';
        break;
      case 'MEHENDI':
        baselineTurnout = 75;
        safetyBuffer = 8;
        turnoutTip = 'Daytime intimate gathering, primarily ladies and close maternal relatives.';
        break;
      case 'HALDI':
        baselineTurnout = 72;
        safetyBuffer = 8;
        turnoutTip = 'Morning ritual followed by festive breakfast/snacks with close family.';
        break;
      case 'POOJA':
        baselineTurnout = 60;
        safetyBuffer = 6;
        turnoutTip = 'Auspicious hawan/puja attended mostly by immediate elders.';
        break;
      case 'WEDDING':
      default:
        baselineTurnout = 88;
        safetyBuffer = 12;
        turnoutTip = 'Vedic pheras ceremony. Turnout varies slightly between daytime vs evening muhurtham.';
        break;
    }

    const turnoutPercent = input.expectedTurnoutPercent ?? baselineTurnout;
    const expectedTurnout = Math.round((input.invitedHeadcount * turnoutPercent) / 100);
    const recommendedPlates = Math.ceil(
      Math.round((expectedTurnout + (expectedTurnout * safetyBuffer) / 100) * 100) / 100
    );

    // Flat blind quote: traditional caterer ordering 115% of invited guest list
    const flatCatererQuotePlates = Math.ceil(
      Math.round((input.invitedHeadcount + (input.invitedHeadcount * 15) / 100) * 100) / 100
    );
    const platesSaved = Math.max(0, flatCatererQuotePlates - recommendedPlates);
    const estimatedRupeeSavings = platesSaved * input.costPerPlate;
    const totalEstimatedCateringRupees = recommendedPlates * input.costPerPlate;

    // Wholesale Raw Material (Ration) calculations scaled per recommended plates
    const ratio = recommendedPlates / 100;
    const rationList: HalwaiRationItem[] = [
      {
        ingredient: 'Pure Desi Ghee (A2/Cow)',
        quantity: Math.round(ratio * 8 * 10) / 10,
        unit: 'Kg',
        notes: 'For traditional sweets, pooris, and dal tadka',
      },
      {
        ingredient: 'Fresh Malai Paneer',
        quantity: Math.round(ratio * 14 * 10) / 10,
        unit: 'Kg',
        notes: 'For Shahi Paneer, starters & live tandoor counter',
      },
      {
        ingredient: 'Aged Basmati Rice',
        quantity: Math.round(ratio * 10 * 10) / 10,
        unit: 'Kg',
        notes: 'For Dum Biryani and Jeera Rice',
      },
      {
        ingredient: 'Chakki Fresh Atta & Maida',
        quantity: Math.round(ratio * 12 * 10) / 10,
        unit: 'Kg',
        notes: 'For live Tandoor naans, rotis, and bhature',
      },
      {
        ingredient: 'Full Cream Milk & Khoya/Mawa',
        quantity: Math.round(ratio * 25 * 10) / 10,
        unit: 'Liters / Kg',
        notes: 'For hot Gulab Jamun, Rabdi, and Kulfi dessert counter',
      },
      {
        ingredient: 'Cooking Oil (Mustard / Refined)',
        quantity: Math.round(ratio * 9 * 10) / 10,
        unit: 'Liters',
        notes: 'For deep frying snacks and chaat station',
      },
      {
        ingredient: 'Dal & Legumes (Urad, Chana, Arhar)',
        quantity: Math.round(ratio * 6 * 10) / 10,
        unit: 'Kg',
        notes: 'For Dal Makhani and Pindi Chhole',
      },
      {
        ingredient: 'Mithai Return Gift Boxes (Dabbas)',
        quantity: Math.ceil(recommendedPlates * 0.45),
        unit: 'Boxes (500g)',
        notes: '1 box per attending family party for Vidai / return Prasad',
      },
    ];

    return {
      invitedHeadcount: input.invitedHeadcount,
      expectedTurnout,
      turnoutPercent,
      safetyBufferPercent: safetyBuffer,
      recommendedPlates,
      flatCatererQuotePlates,
      platesSaved,
      costPerPlate: input.costPerPlate,
      estimatedRupeeSavings,
      totalEstimatedCateringRupees,
      rationList,
      turnoutTip,
    };
  }

  /**
   * Retrieves regional cultural wedding ceremony presets and samagri requirements.
   */
  static getCulturalPresets(): CulturalPresetDefinition[] {
    return [
      {
        culture: CULTURAL_PRESET_TYPES.NORTH_INDIAN_PUNJABI,
        title: 'North Indian / Punjabi Vivah',
        regionalTag: 'Dhol, Jaggo & Big-Hearted Celebrations',
        description: 'Vibrant pre-wedding festivities leading to auspicious Vedic Pheras and Grand Reception.',
        ceremonies: [
          {
            name: 'Mehendi & Henna Fiesta',
            type: 'MEHENDI',
            dayOffset: -2,
            timeSlot: '03:00 PM',
            significance: 'Application of auspicious henna designs on bride and family hands with folk geet.',
            dressCode: 'Bright Yellow, Lime Green & Floral Lehengas',
            samagriList: ['Organic Mehendi Cones', 'Eucalyptus Oil', 'Clove Smoke Pot', 'Lemon-Sugar Water'],
            tasks: ['Book Mehendi Artists', 'Arrange Dholak player', 'Set up colorful floral photo booth'],
          },
          {
            name: 'Jaggo & Sangeet Night',
            type: 'SANGEET',
            dayOffset: -1,
            timeSlot: '07:00 PM',
            significance: 'Night of joyful musical dances, brass pot (Jaggo) procession, and family choreography.',
            dressCode: 'Royal Indo-Western & Glittering Evening Attire',
            samagriList: ['Brass Jaggo Pot with LED/candles', 'Giddha Sticks', 'Chaat counter setup'],
            tasks: ['Coordinate DJ playlist', 'Choreograph bride & groom performance', 'Confirm sound engineer'],
          },
          {
            name: 'Haldi & Chooda Kalire Ceremony',
            type: 'HALDI',
            dayOffset: 0,
            timeSlot: '09:00 AM',
            significance: 'Ubtan purification bath followed by maternal uncles adorning bride with red chooda bangles.',
            dressCode: 'Marigold Yellow & White Kurtas',
            samagriList: ['Fresh Turmeric Paste', 'Rose Water', 'Chooda Set', 'Gold Kalire', 'Red Shawl'],
            tasks: ['Procure fresh raw turmeric', 'Arrange silver thali for bangles', 'Prepare towel & flower shower'],
          },
          {
            name: 'Baraat, Varmala & Vedic Pheras',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '06:00 PM',
            significance: 'Groom royal procession, exchange of floral garlands, sacred 7 vows around Agni.',
            dressCode: 'Royal Sherwani & Traditional Red/Crimson Lehenga',
            samagriList: ['Hawan Samagri', 'Desi Ghee', 'Akshat (Rice)', 'Gathbandhan Cloth', 'Varmalas (Rose & Baby Breath)'],
            tasks: ['Coordinate Vintage Car / Ghodi for Baraat', 'Arrange Milni malas for elders', 'Verify Pandit samagri'],
          },
          {
            name: 'Grand Wedding Reception',
            type: 'RECEPTION',
            dayOffset: 1,
            timeSlot: '07:30 PM',
            significance: 'Formal introduction of newlyweds to extended family, dignitaries, and community.',
            dressCode: 'Black Tie Tuxedo & Designer Evening Gown/Saree',
            samagriList: ['Gift Envelope Box', 'Champagne/Mocktail Flutes', 'Guest Signing Book'],
            tasks: ['Stage floral backdrop check', 'Arrange stage seating for couple', 'Coordinate VIP dinner service'],
          },
        ],
      },
      {
        culture: CULTURAL_PRESET_TYPES.MARWARI_RAJASTHANI,
        title: 'Marwari / Rajasthani Royal Vivah',
        regionalTag: 'Heritage Royalty, Tel Baan & Mayra (Bhaat)',
        description: 'Centuries-old regal customs celebrating maternal bonds, sacred phera rituals, and hospitality.',
        ceremonies: [
          {
            name: 'Bhaat Nyootna & Mayra (Maternal Blessings)',
            type: 'CUSTOM',
            dayOffset: -2,
            timeSlot: '11:00 AM',
            significance: 'Grand arrival of maternal uncles (Mama) bearing rich gifts, textiles, and jewelry for the family.',
            dressCode: 'Bandhani, Leheriya & Rajasthani Safa',
            samagriList: ['Bhaat Thali', 'Silver Sikka (Coins)', 'Gud & Supari', 'Poshak for elders'],
            tasks: ['Arrange welcoming Shehnai players', 'Prepare dry fruit thalis', 'List maternal relatives poshak'],
          },
          {
            name: 'Tel Baan & Haldi Ubtan',
            type: 'HALDI',
            dayOffset: -1,
            timeSlot: '10:00 AM',
            significance: 'Clay bowl and grass (doob) anointing ritual with mustard oil and herbal turmeric.',
            dressCode: 'Yellow Bandhani & Chanderi Kurtas',
            samagriList: ['Earthen Tel Baan Bowls', 'Doob Grass', 'Mustard Oil', 'Fresh Ubtan', 'Kangna Thread'],
            tasks: ['Verify 7 clay diya bowls', 'Tie auspicious Mauli threads', 'Arrange sweet lapsi prasad'],
          },
          {
            name: 'Sangeet & Ghoomar Night',
            type: 'SANGEET',
            dayOffset: -1,
            timeSlot: '07:00 PM',
            significance: 'Traditional Rajasthani folk Ghoomar dances, dhol rhythms, and family celebration.',
            dressCode: 'Mirror-work Rajputi Poshak & Jodhpuri Bandhgala',
            samagriList: ['Dandiya Sticks', 'Ghoomar Dupattas', 'Rajasthani live snack counter'],
            tasks: ['Hire traditional Manganiyar folk singers', 'Finalize stage lighting', 'Brief photographer'],
          },
          {
            name: 'Korath, Baraat & Royal Pheras',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '07:00 PM',
            significance: 'Formal invitation to groom camp (Korath), royal Toran hitting, and solemn 4 Vedic pheras.',
            dressCode: 'Royal Zardozi Red Lehenga & Achkan with Brocade Safa',
            samagriList: ['Wooden Toran', 'Sword (Talwar) for Groom', 'Pheras Chauri (Pillars)', 'Silver Varmalas'],
            tasks: ['Verify Toran placement at entrance gate', 'Mandap Agni Kund setup', 'Baraat welcome sherbet'],
          },
        ],
      },
      {
        culture: CULTURAL_PRESET_TYPES.GUJARATI,
        title: 'Gujarati Vivah & Raas Garba',
        regionalTag: 'Mandap Mahurat, Mameru & Dandiya Raas',
        description: 'Joyful rituals centered on Ganesha blessings, maternal Mameru gifts, and high-energy Garba.',
        ceremonies: [
          {
            name: 'Mandap Mahurat & Grah Shanti Pooja',
            type: 'CUSTOM',
            dayOffset: -2,
            timeSlot: '09:30 AM',
            significance: 'Sacred digging of the earth to pitch the wedding canopy and pacify planetary deities.',
            dressCode: 'Traditional Gujarati Panetar or Bandhani Saree',
            samagriList: ['Manek Stambha (Sacred Wooden Post)', 'Navgraha Samagri', 'Coconuts', 'Paan & Supari'],
            tasks: ['Set up pooja chowki facing East', 'Invite family priest', 'Arrange Kansar prasad'],
          },
          {
            name: 'Mameru / Mosalu (Maternal Uncle Feast)',
            type: 'CUSTOM',
            dayOffset: -1,
            timeSlot: '11:00 AM',
            significance: 'Bride receives auspicious bridal Panetar saree, jewellery, and cash from maternal uncles.',
            dressCode: 'Gharchola & Silk Kurtas',
            samagriList: ['Silver Thali for Saree presentation', 'Sweets Box', 'Dry fruits packaging'],
            tasks: ['Prepare welcome Aarti plate', 'Arrange traditional lunch (Kadhi, Fafda, Jalebi)'],
          },
          {
            name: 'Sanji & Dandiya Raas Night',
            type: 'SANGEET',
            dayOffset: -1,
            timeSlot: '07:30 PM',
            significance: 'Vibrant circular Garba and Dandiya folk dance with family and friends.',
            dressCode: 'Embroidered Kedia & Chaniya Choli',
            samagriList: ['Wooden Dandiya Sticks (100+ pairs)', 'Ganesha Diya for Garbi center'],
            tasks: ['Test sound for live Gujarati Garba troupe', 'Ensure spacious wooden dance floor'],
          },
          {
            name: 'Jaan Aagman, Ponkhana & Hastamelap',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '05:30 PM',
            significance: 'Mother-in-law playful nose-pulling welcome (Ponkhana), curtain drop (Antarpat), and Hastamelap hand-joining.',
            dressCode: 'Ivory-Red Panetar Saree & Velvet Sherwani',
            samagriList: ['Sambhela (Pestle), Ravaiyya (Churner) for Ponkhana', 'Antarpat Cloth', 'Kansar Sweet Bowl'],
            tasks: ['Prepare Ponkhana welcome tray', 'Arrange bride brother for ear-pulling ritual'],
          },
        ],
      },
      {
        culture: CULTURAL_PRESET_TYPES.SOUTH_INDIAN,
        title: 'South Indian Kalyanam',
        regionalTag: 'Kanchipuram Silks, Nadaswaram & Mangala Snanam',
        description: 'Vedic purity, auspicious nadaswaram melodies, playful Oonjal swing, and sacred Muhurtham.',
        ceremonies: [
          {
            name: 'Vratham & Nandi Devata Pooja',
            type: 'CUSTOM',
            dayOffset: -1,
            timeSlot: '08:00 AM',
            significance: 'Purification rituals performed by bride and groom families to invoke ancestral blessings.',
            dressCode: 'Traditional Veshti & Kanchipuram Pavada',
            samagriList: ['Navadhanyam (9 grains)', 'Clay Pots', 'Raw Mango Leaves', 'Turmeric Rhizomes'],
            tasks: ['Coordinate with Vadhyar (Priest)', 'Prepare banana leaf breakfast service'],
          },
          {
            name: 'Mangala Snanam (Auspicious Oil Bath)',
            type: 'HALDI',
            dayOffset: 0,
            timeSlot: '06:30 AM',
            significance: 'Herbal oil and nalangu paste bath before sunrise to prepare for the sacred wedding vows.',
            dressCode: 'Simple Cotton Madisar / Dhoti',
            samagriList: ['Gingelly Oil', 'Nalangu Powder', 'Kumkum', 'Aarti Plates with camphor'],
            tasks: ['Arrange fresh flower garlands', 'Set up brass urli with water and petals'],
          },
          {
            name: 'Kasi Yatra & Oonjal (Swing Ceremony)',
            type: 'CUSTOM',
            dayOffset: 0,
            timeSlot: '08:30 AM',
            significance: 'Playful drama of groom embarking on spiritual pilgrimage; father-in-law persuades him to marry; couple sits on decorated swing.',
            dressCode: 'Gold Zari Kanchipuram Silk & Angavastram',
            samagriList: ['Umbrella, Walking Stick, Geeta Book for Kasi Yatra', 'Decorated Swing', 'Milk & Banana for Oonjal'],
            tasks: ['Decorate swing with jasmine strands', 'Arrange traditional songs by ladies'],
          },
          {
            name: 'Kanyadaanam & Mangalya Dharanam',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '10:00 AM',
            significance: 'Sacred tying of the gold Thaali (Mangalsutra) amid roaring Nadaswaram and showering of Akshata.',
            dressCode: 'Nine-Yard Koorai Silk Saree & Pattu Veshti',
            samagriList: ['Gold Thaali with yellow thread', 'Turmeric root', 'Akshata Rice', 'Coconut & Betel leaves'],
            tasks: ['Distribute Akshata to all seated guests', 'Cue Nadaswaram crescendo for 3 knots (Thirumangalyam)'],
          },
        ],
      },
      {
        culture: CULTURAL_PRESET_TYPES.MAHARASHTRIAN,
        title: 'Maharashtrian Lagna',
        regionalTag: 'Mundavalya, Shehnai & Paithani Elegance',
        description: 'Understated spiritual rituals, Antarpat cloth drop, Saptapadi, and vibrant Maharashtrian hospitality.',
        ceremonies: [
          {
            name: 'Kelvan (Pre-Wedding Family Feasts)',
            type: 'CUSTOM',
            dayOffset: -2,
            timeSlot: '01:00 PM',
            significance: 'Intimate lunches hosted by close relatives offering prayers to family Kuldevata.',
            dressCode: 'Traditional Paithani & Kurta',
            samagriList: ['Puran Poli', 'Sweet Khichdi', 'Betel Leaves & Areca nuts'],
            tasks: ['Confirm menu with family cook', 'Prepare silver coin gifts for bride'],
          },
          {
            name: 'Halad Chadavane (Haldi Ceremony)',
            type: 'HALDI',
            dayOffset: -1,
            timeSlot: '10:30 AM',
            significance: 'Application of turmeric paste applied first to groom, remaining sent lovingly to bride.',
            dressCode: 'Bright Yellow Cotton Saree & Kurta Pajama',
            samagriList: ['Pure Haldi paste', 'Mango leaves', 'Aarti thali', 'Silver lota'],
            tasks: ['Designate family courier to deliver groom haldi to bride venue'],
          },
          {
            name: 'Simant Pujan & Antarpat Ceremony',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '10:00 AM',
            significance: 'Groom camp reception at boundary, pearl/flower forehead strings (Mundavalya), and Antarpat drop at auspicious shloka.',
            dressCode: 'Yellow/Green Paithani Saree & Dhoti Kurta with Mundavalya',
            samagriList: ['Mundavalya forehead ornaments (2 pairs)', 'Antarpat Silk Curtain', 'Akshata for all guests'],
            tasks: ['Ensure Mundavalya tied properly', 'Distribute Akshata packets to guests', 'Cue Shehnai on Subhamangalam'],
          },
          {
            name: 'Kanyadaan & Saptapadi',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '12:00 PM',
            significance: 'Parents bestow blessings, 7 steps around the sacred fire, and groom placing silver toe-rings (Jodvi).',
            dressCode: 'Nauvari (Nine-yard) Saree & Pheta (Turban)',
            samagriList: ['Silver Jodvi toe rings', 'Gathbandhan scarf', 'Hawan Samagri', 'Laja (Puffed rice)'],
            tasks: ['Brother ready for Kaan-Pili ritual', 'Prepare traditional Maharashtrian lunch (Varan Bhat)'],
          },
        ],
      },
      {
        culture: CULTURAL_PRESET_TYPES.BENGALI,
        title: 'Bengali Biye',
        regionalTag: 'Shankha Pola, Topor, Saat Paake Ghaura & Sindoor Daan',
        description: 'Rich cultural aesthetic, Ululation (Ulu-dhwani), Shankha-Pola conch bangles, and fish Tattva gifts.',
        ceremonies: [
          {
            name: 'Gaye Holud & Tattva Exchange',
            type: 'HALDI',
            dayOffset: -1,
            timeSlot: '10:00 AM',
            significance: 'Turmeric paste sent from groom with beautifully decorated fish, sweets, and saree Tattva baskets.',
            dressCode: 'Yellow Saree with Red Border & Dhoti Kurta',
            samagriList: ['Decorated Rohu Fish in bridal attire', 'Mithai trays', 'Gaye Holud turmeric paste'],
            tasks: ['Inspect Tattva gift decorations', 'Sound conch shells (Shankha) during ubtan'],
          },
          {
            name: 'Dodhi Mangol & Ganga Snan',
            type: 'CUSTOM',
            dayOffset: 0,
            timeSlot: '05:30 AM',
            significance: 'Pre-dawn meal of sweetened yogurt, flattened rice (Chira), and sweets before day-long fasting.',
            dressCode: 'Simple Red-White Cotton Garment',
            samagriList: ['Sweet Curd (Misti Doi)', 'Chira', 'Banana', 'Ganga Jal'],
            tasks: ['Serve pre-dawn meal before sunrise', 'Ensure bride and groom stay hydrated'],
          },
          {
            name: 'Bor Boron, Saat Paake Ghaura & Shubho Drishti',
            type: 'WEDDING',
            dayOffset: 0,
            timeSlot: '07:00 PM',
            significance: 'Bride seated on wooden stool (Piri) lifted by brothers, circling groom 7 times hiding behind betel leaves, followed by first glance (Shubho Drishti).',
            dressCode: 'Benarasi Red/Maroon Silk Saree, Topor & Mukut headgear',
            samagriList: ['2 Paan Betel leaves for eyes', 'Wooden Piri', 'Topor (Groom) & Mukut (Bride)', 'Floral Mala'],
            tasks: ['Assign 4 strong brothers to lift wooden piri', 'Coordinate Conch shell & Ululation chorus'],
          },
          {
            name: 'Sindoor Daan & Bou Bhaat (Reception)',
            type: 'RECEPTION',
            dayOffset: 1,
            timeSlot: '07:30 PM',
            significance: 'Groom applies vermillion with wooden cone; followed next day by newlywed bride serving rice to family.',
            dressCode: 'Designer Tussar Silk Saree & Kurta Pajama',
            samagriList: ['Pure Vermillion (Sindoor)', 'Kunke (Bamboo rice measuring cup)', 'Silver coin'],
            tasks: ['Arrange stage photography for Sindoor Daan', 'Prepare Grand Bengali Feast with Ilish/Mutton'],
          },
        ],
      },
    ];
  }

  /**
   * 1-Click applies selected cultural ceremony sequence to wedding workspace.
   */
  static async applyCulturalPresetToWedding(
    weddingId: string,
    culture: CulturalPresetType,
    userId: string
  ): Promise<{ appliedCeremoniesCount: number; appliedTasksCount: number; culture: CulturalPresetType }> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    const presets = this.getCulturalPresets();
    const preset = presets.find((p) => p.culture === culture);
    if (!preset) {
      throw new NotFoundError(`Cultural preset ${culture} not found`);
    }

    // Resolve current member
    const membership = await WeddingMembershipModel.findOne({
      weddingId: weddingObjectId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    const membershipId = membership?._id || new mongoose.Types.ObjectId();

    const existingEvents = await WeddingEventModel.find({
      weddingId: weddingObjectId,
      archivedAt: null,
    });
    const existingNames = new Set(existingEvents.map((e) => e.name.toLowerCase().trim()));

    const weddingDate = new Date(wedding.weddingDate);
    let appliedCeremoniesCount = 0;
    let appliedTasksCount = 0;

    for (const item of preset.ceremonies) {
      if (!existingNames.has(item.name.toLowerCase().trim())) {
        // Calculate date relative to wedding date
        const eventDate = new Date(weddingDate);
        eventDate.setDate(eventDate.getDate() + item.dayOffset);

        // Parse timeSlot e.g. "03:00 PM"
        const [timePart, modifier] = item.timeSlot.split(' ');
        const [hoursStr, minutesStr] = timePart.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        eventDate.setHours(hours, minutes, 0, 0);

        const endsDate = new Date(eventDate);
        endsDate.setHours(endsDate.getHours() + 4);

        const newEvent = await WeddingEventModel.create({
          weddingId: weddingObjectId,
          name: item.name,
          type: item.type,
          startsAt: eventDate,
          endsAt: endsDate,
          venueName: wedding.location?.city ? `${wedding.location.city} Venue` : null,
          dressCode: item.dressCode,
          description: `${item.significance}\n\nEssential Samagri: ${item.samagriList.join(', ')}`,
        });
        appliedCeremoniesCount++;

        // Create tasks for this ceremony
        for (const taskTitle of item.tasks) {
          await TaskModel.create({
            weddingId: weddingObjectId,
            title: `${taskTitle} (${item.name})`,
            description: `Auto-generated ritual task for ${item.name}. Dress code: ${item.dressCode}.`,
            committee: 'RITUALS_PUJA',
            priority: 'HIGH',
            status: 'TODO',
            eventId: newEvent._id,
            dueDate: eventDate,
            createdByMembershipId: membershipId,
          });
          appliedTasksCount++;
        }
      }
    }

    return {
      appliedCeremoniesCount,
      appliedTasksCount,
      culture,
    };
  }

  /**
   * Analyzes actual ledger spending vs standard Indian wedding benchmark percentages.
   */
  static async optimizeBudget(
    weddingId: string,
    input: BudgetOptimizerInput
  ): Promise<BudgetOptimizerResult> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    // Retrieve all expenses
    const expenses = await ExpenseModel.find({ weddingId: weddingObjectId });

    // Sum actual spent by category (convert paise to rupees)
    const categorySpendMap: Record<string, number> = {};
    let totalSpentRupees = 0;

    for (const exp of expenses) {
      const rupees = exp.amountPaise / 100;
      totalSpentRupees += rupees;
      categorySpendMap[exp.category] = (categorySpendMap[exp.category] || 0) + rupees;
    }

    // Define benchmark distributions based on couple focus
    let benchmarks: Record<string, { percent: number; label: string; tips: string[] }>;

    switch (input.priorityFocus) {
      case BUDGET_PRIORITY_FOCUS.FOOD_FOCUSED:
        benchmarks = {
          CATERING: {
            percent: 42,
            label: 'Catering & Halwai Feasts',
            tips: [
              'Scale plate orders using the AI Halwai Calculator to avoid paying for absent guests.',
              'Limit main course gravy dishes to 4 premium choices; guests remember live chaat and desserts most.',
            ],
          },
          VENUE: {
            percent: 16,
            label: 'Venues & Mandap Lawns',
            tips: [
              'Combine Sangeet & Wedding at the same property for multi-event package discounts.',
            ],
          },
          DECORATION: {
            percent: 10,
            label: 'Decor, Florals & Mandap',
            tips: [
              'Replace expensive imported exotics with vibrant local marigolds and brass urlis.',
            ],
          },
          PHOTOGRAPHY: {
            percent: 10,
            label: 'Photography & Cinematic Video',
            tips: [
              'Hire a single consolidated team for both bride & groom sides to eliminate redundant crews.',
            ],
          },
          CLOTHING: {
            percent: 11,
            label: 'Attire, Jewellery & Trousseau',
            tips: [
              'Explore heritage rental jewellery for heavy bridal necklace pieces.',
            ],
          },
          ENTERTAINMENT: {
            percent: 4,
            label: 'DJ, Dhol, Sound & Choreography',
            tips: [
              'Engage talented cousins for Sangeet emceeing instead of hiring expensive commercial anchors.',
            ],
          },
          GIFTS: {
            percent: 4,
            label: 'Invitations, Gifting & Logistics',
            tips: [
              'Use Make My Marriage digital WhatsApp invites to eliminate costly physical card courier fees.',
            ],
          },
          OTHER: {
            percent: 3,
            label: 'Contingency & Pandit Ji Dakshina',
            tips: [
              'Keep 3% untouched in cash envelopes for immediate pandit dakshina, shagun, and tips.',
            ],
          },
        };
        break;

      case BUDGET_PRIORITY_FOCUS.DECOR_PHOTO:
        benchmarks = {
          VENUE: {
            percent: 18,
            label: 'Aesthetic Venues & Lawns',
            tips: ['Choose naturally scenic outdoor lawns with built-in architectural arches to minimize artificial backdrop framing.'],
          },
          DECORATION: {
            percent: 18,
            label: 'Luxury Florals, Lighting & Mandap',
            tips: ['Rent reusable fabric drape structures instead of single-use polystyrene thermocol stage sets.'],
          },
          PHOTOGRAPHY: {
            percent: 14,
            label: 'Cinematic Video, Pre-Wedding & Drone',
            tips: ['Schedule couple portraits during the golden hour (5:00-6:00 PM) before guests overwhelm the stage.'],
          },
          CATERING: {
            percent: 28,
            label: 'Catering & Beverages',
            tips: ['Opt for high-impact live stations (Khao Suey, wood-fired pizza) rather than vast 80-dish buffets.'],
          },
          CLOTHING: {
            percent: 11,
            label: 'Attire, Jewellery & Styling',
            tips: ['Coordinate groom sherwani palette with bride lehenga for striking contrast photos.'],
          },
          ENTERTAINMENT: {
            percent: 4,
            label: 'DJ, Sound & Light Show',
            tips: ['Negotiate sound console bundling with the venue lighting vendor.'],
          },
          GIFTS: {
            percent: 4,
            label: 'Favors, Printing & Logistics',
            tips: ['Replace physical gift boxes with artisanal local honey / dry fruits in jute bags.'],
          },
          OTHER: {
            percent: 3,
            label: 'Emergency Reserve',
            tips: ['Maintain emergency cash for sudden venue electricity extensions.'],
          },
        };
        break;

      case BUDGET_PRIORITY_FOCUS.BALANCED:
      default:
        benchmarks = {
          CATERING: {
            percent: 34,
            label: 'Catering, Mithai & Food Counters',
            tips: [
              'Review plate count agreements 48 hours prior with confirmed RSVPs.',
              'Ensure contract specifies clear per-plate rates for unexpected walk-in surplus.',
            ],
          },
          VENUE: {
            percent: 18,
            label: 'Venues, Lawns & Rooms',
            tips: [
              'Negotiate complimentary green rooms for bride and groom family changes.',
            ],
          },
          DECORATION: {
            percent: 13,
            label: 'Decor, Theme & Mandap Lighting',
            tips: [
              'Repurpose Mehendi floral arrangements as hallway accents for Sangeet next day.',
            ],
          },
          PHOTOGRAPHY: {
            percent: 11,
            label: 'Photography, Reels & Albums',
            tips: [
              'Negotiate raw footage delivery alongside teaser video in your master agreement.',
            ],
          },
          CLOTHING: {
            percent: 12,
            label: 'Bridal Lehenga, Sherwani & Jewellery',
            tips: [
              'Shop in wholesale heritage markets (Chandni Chowk, Surat, Zaveri Bazaar) for 30-40% savings.',
            ],
          },
          ENTERTAINMENT: {
            percent: 4,
            label: 'DJ, Music & Dhol Players',
            tips: [
              'Check venue sound cut-off curfew (typically 10:00 PM) before booking extra performance hours.',
            ],
          },
          GIFTS: {
            percent: 4,
            label: 'Shagun, Invitations & Guest Logistics',
            tips: [
              'Track shagun envelopes systematically in the Rupee Ledger.',
            ],
          },
          OTHER: {
            percent: 4,
            label: 'Contingency & Miscellaneous Buffer',
            tips: [
              'Keep 4% aside for last-minute hotel room additions and valet parking extras.',
            ],
          },
        };
        break;
    }

    const categories: CategoryBudgetAnalysis[] = [];
    let healthyCount = 0;

    for (const [catKey, meta] of Object.entries(benchmarks)) {
      const allocatedRupees = Math.round((input.totalBudgetRupees * meta.percent) / 100);
      const actualSpentRupees = categorySpendMap[catKey] || 0;
      const remainingRupees = allocatedRupees - actualSpentRupees;

      let status: 'HEALTHY' | 'NEARING_LIMIT' | 'OVER_BUDGET' = 'HEALTHY';
      if (actualSpentRupees > allocatedRupees) {
        status = 'OVER_BUDGET';
      } else if (actualSpentRupees >= allocatedRupees * 0.8) {
        status = 'NEARING_LIMIT';
      } else {
        healthyCount++;
      }

      categories.push({
        categoryKey: catKey,
        categoryLabel: meta.label,
        recommendedPercent: meta.percent,
        allocatedRupees,
        actualSpentRupees,
        remainingRupees,
        status,
        tips: meta.tips,
      });
    }

    const totalRemainingRupees = input.totalBudgetRupees - totalSpentRupees;
    const budgetHealthScore = Math.min(
      100,
      Math.max(
        10,
        Math.round((healthyCount / categories.length) * 70 + (totalRemainingRupees >= 0 ? 30 : 0))
      )
    );

    const topRecommendations = [
      totalRemainingRupees < 0
        ? `⚠️ Currently over allocated budget by ₹${Math.abs(Math.round(totalRemainingRupees)).toLocaleString('en-IN')}. Focus negotiations on Catering and Decor.`
        : `✅ Budget is well managed with ₹${Math.round(totalRemainingRupees).toLocaleString('en-IN')} unallocated reserve remaining.`,
      'Lock in raw material grain and ghee purchases from wholesale Mandis 3 weeks prior to avoid retail markups.',
      'Always request an itemized tax breakdown (GST 5% on pure catering vs 18% on venue-bundled catering) before signing contracts.',
    ];

    return {
      totalBudgetRupees: input.totalBudgetRupees,
      totalSpentRupees,
      totalRemainingRupees,
      budgetHealthScore,
      priorityFocus: input.priorityFocus,
      categories,
      topRecommendations,
    };
  }

  /**
   * Domain-specific expert AI advisory for common Indian wedding planning dilemmas.
   */
  static askPlannerAdvisor(weddingId: string, question: string): PlannerAdvisorResponse {
    const q = question.toLowerCase();

    if (q.includes('halwai') || q.includes('ration') || q.includes('food') || q.includes('raw material') || q.includes('catering')) {
      return {
        topic: 'Halwai & Catering Optimization',
        title: 'Mastering the Halwai Ration List & Reducing Food Wastage',
        summary:
          'In traditional Indian weddings, ordering raw ingredients yourself from wholesale grain markets (Mandi) and paying Halwais making charges typically saves 25% to 35% compared to commercial all-inclusive per-plate packages.',
        actionableInsights: [
          'Order raw ingredients in 2 tranches: 75% for prep 2 days prior, and 25% just-in-time on the ceremony morning to avoid spoilage.',
          'Never agree to caterer flat plate counts matching 100% of invited guest lists. Turnout for daytime Mehendi averages 75%, while Sangeet/Reception averages 95%.',
          'Lock in pure A2 Desi Ghee tins with verifiable brand seals to ensure purity for sacred prasad and sweets.',
        ],
        checklistItems: [
          'Obtain itemized grocery ration list signed by head Halwai (Kharche ki fard).',
          'Compare rates between local Mandi wholesaler vs Halwai-provided supplies.',
          'Designate a trusted family member (Bhandari / Storekeeper) to guard the raw ration room.',
        ],
      };
    }

    if (q.includes('samagri') || q.includes('pheras') || q.includes('mandap') || q.includes('pooja') || q.includes('pandit')) {
      return {
        topic: 'Mandap & Pheras Sacred Samagri',
        title: 'Essential Vedic Wedding Samagri & Muhurtham Preparation',
        summary:
          'The Vedic wedding ceremony centers on invoking Agni Devta as the divine witness for the 7 sacred vows (Saptapadi). Having every ritual item organized beforehand avoids stress during the auspicious Muhurtham.',
        actionableInsights: [
          'Verify Hawan Kund dimensions and ventilation with your venue; indoor banquets often require smoke-free dry coconut husk and camphor burners.',
          'Prepare separate thalis: one for Varmala exchange, one for Kanyadaan, and one for Saptapadi laja (puffed rice).',
          'Ensure fresh flower Varmalas are kept in a cool insulated cooler with moist muslin cloth until the Baraat arrives.',
        ],
        checklistItems: [
          'Pure Cow Desi Ghee (2 Kg) & Cotton Wicks (Rui Batti).',
          'Hawan Samagri, Black Til, Jau (Barley), and Camphor (Kapur).',
          'Gathbandhan Sacred Scarf with 1 Rupee Coin & Supari tied.',
          'Akshat (Unbroken rice mixed with turmeric) in brass bowls for guest blessings.',
        ],
      };
    }

    if (q.includes('split') || q.includes('expense') || q.includes('groom') || q.includes('bride') || q.includes('budget') || q.includes('who pays')) {
      return {
        topic: 'Multi-Family Expense Splitting Etiquette',
        title: 'Graceful Coordination of Shared Wedding Expenses',
        summary:
          'Modern Indian weddings often share costs equitably. Setting up mutual transparency early in the Rupee Ledger prevents awkward misunderstandings later.',
        actionableInsights: [
          'Shared Ceremonies (Sangeet, Cocktail): Typically split 50:50 or proportionally by guest headcount.',
          'Individual Ceremonies: Mehendi & Haldi are traditionally hosted individually by each side.',
          'Log every token advance and halwai payment in the Make My Marriage Rupee Ledger with Payer Side tags (Groom, Bride, Shared).',
        ],
        checklistItems: [
          'Align on who pays for out-of-town guest hotel rooms and airport cabs.',
          'Decide whether photography will be a single joint crew or individual teams.',
          'Assign designated committee treasurers from both sides to reconcile balances weekly.',
        ],
      };
    }

    // Default general wedding planning strategy
    return {
      topic: 'Comprehensive Wedding Strategy',
      title: 'Action Blueprint for a Seamless Indian Wedding',
      summary:
        'Executing a memorable, stress-free Indian wedding requires delegating family squad duties, tracking vendor commitments, and leveraging automated reminders.',
      actionableInsights: [
        'Use the AI Halwai Calculator to finalize caterer plate bookings based on actual RSVP turnouts.',
        'Apply the Cultural Ceremony Presets to populate authentic rituals, dress codes, and samagri lists.',
        'Broadcast digital WhatsApp reminders with personalized digital invite links 10 days before ceremonies.',
      ],
      checklistItems: [
        'Verify all vendor arrival times (Sound, Makeup, Decor, Halwai).',
        'Review the Ceremony Logistics Run-Sheet and share CSV with family coordinators.',
        'Keep emergency cash envelopes and basic first-aid/electrolyte kits at the hospitality desk.',
      ],
    };
  }
}
