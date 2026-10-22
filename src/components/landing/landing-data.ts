export interface NavLink {
  label: string;
  href: string;
}

export interface WeddingTheme {
  id: 'crimson' | 'marigold' | 'emerald' | 'gulabi';
  name: string;
  tag: string;
  swatchColor: string;
  primaryHex: string;
  accentHex: string;
  bgGradient: string;
  borderClass: string;
  badgeClass: string;
  buttonClass: string;
  accentText: string;
}

export interface CeremonyItem {
  name: string;
  time: string;
  theme: string;
  photoUrl: string;
  accentColor: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  shortSnippet: string;
  photoUrl?: string;
  iconName: 'calendar' | 'users' | 'mail' | 'currency' | 'globe' | 'camera';
  badge: string;
  visualTag: string;
  previewData: string[];
}

export interface StepItem {
  number: string;
  action: string;
  title: string;
  description: string;
  chipText: string;
}

export interface ComparisonPoint {
  topic: string;
  chaotic: string;
  organized: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const BRAND_TAGLINE = 'The Operating System for Managing an Indian Wedding';
export const BRAND_STACKING_TAGLINE = 'The Operating System for Indian Weddings';
export const BRAND_MAIN_HEADLINE = 'Your Wedding. Your People. Your Plan. All in One Place.';

export const WEDDING_THEMES: WeddingTheme[] = [
  {
    id: 'crimson',
    name: 'Royal Crimson & Zari Gold',
    tag: 'Traditional & Regal',
    swatchColor: '#881337',
    primaryHex: '#881337',
    accentHex: '#b45309',
    bgGradient: 'from-rose-50/80 via-amber-50/40 to-white',
    borderClass: 'border-rose-300/80',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
    buttonClass: 'bg-brand-crimson hover:bg-rose-900 text-white',
    accentText: 'text-brand-crimson',
  },
  {
    id: 'marigold',
    name: 'Marigold Sunshine & Amber',
    tag: 'Haldi & Festive Glow',
    swatchColor: '#d97706',
    primaryHex: '#d97706',
    accentHex: '#b45309',
    bgGradient: 'from-amber-50/90 via-yellow-50/50 to-white',
    borderClass: 'border-amber-300',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    accentText: 'text-amber-700',
  },
  {
    id: 'emerald',
    name: 'Regal Emerald & Sandalwood',
    tag: 'Palatial & Sophisticated',
    swatchColor: '#065f46',
    primaryHex: '#065f46',
    accentHex: '#047857',
    bgGradient: 'from-emerald-50/80 via-teal-50/30 to-white',
    borderClass: 'border-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    buttonClass: 'bg-emerald-800 hover:bg-emerald-900 text-white',
    accentText: 'text-emerald-800',
  },
  {
    id: 'gulabi',
    name: 'Pastel Gulabi & Rose Gold',
    tag: 'Romantic & Floral Bliss',
    swatchColor: '#be185d',
    primaryHex: '#be185d',
    accentHex: '#db2777',
    bgGradient: 'from-pink-50/80 via-rose-50/40 to-white',
    borderClass: 'border-pink-300',
    badgeClass: 'bg-pink-100 text-pink-900 border-pink-200',
    buttonClass: 'bg-pink-700 hover:bg-pink-800 text-white',
    accentText: 'text-pink-700',
  },
];

export const NAV_LINKS: NavLink[] = [
  { label: 'The Contrast', href: '#the-reality' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

export const HERO_CONTENT = {
  badge: BRAND_TAGLINE,
  headline: BRAND_MAIN_HEADLINE,
  subheadline:
    'One shared workspace for both families to coordinate ceremonies, guests, budgets, and memories without the chaos of 15 WhatsApp groups.',
  primaryCta: {
    label: 'Create Your Wedding Workspace',
    href: '/signup',
  },
  secondaryCta: {
    label: 'See How It Works',
    href: '#the-reality',
  },
  sampleWedding: {
    couple: 'Divya & Rahul',
    city: 'Dehradun, Uttarakhand',
    date: '14 February 2027',
    daysToGo: 42,
    couplePhotoUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    ceremonies: [
      {
        name: 'Haldi Ceremony',
        time: 'Feb 12 • 10:00 AM',
        theme: 'Yellow & Marigold',
        photoUrl:
          'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=400&q=80',
        accentColor: '#d97706',
      },
      {
        name: 'Mehendi & Dholki',
        time: 'Feb 12 • 4:30 PM',
        theme: 'Greenery & Live Dhol',
        photoUrl:
          'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=400&q=80',
        accentColor: '#059669',
      },
      {
        name: 'Sangeet Night',
        time: 'Feb 13 • 7:00 PM',
        theme: 'Glamour & 14 Dances',
        photoUrl:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
        accentColor: '#7c3aed',
      },
      {
        name: 'Varmala & Pheras',
        time: 'Feb 14 • Muhurat 8:15 PM',
        theme: 'Traditional Royal',
        photoUrl:
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80',
        accentColor: '#881337',
      },
      {
        name: 'Grand Reception',
        time: 'Feb 15 • 7:30 PM',
        theme: 'Black Tie & Banquets',
        photoUrl:
          'https://images.unsplash.com/photo-1519225433281-9b0d2d3a7788?auto=format&fit=crop&w=400&q=80',
        accentColor: '#1e3a8a',
      },
    ] as CeremonyItem[],
    confirmedGuests: 186,
    totalInvited: 240,
    dietaryNotes: '18 Jain / Strict Veg',
    budgetSpent: '₹12,45,000',
    budgetAllocated: '₹25,00,000',
    activeTasks: '32 of 48 Tasks Finished',
    bookedVendors: '8 Key Vendors Locked',
  },
};

export const COMPARISON_POINTS: ComparisonPoint[] = [
  {
    topic: 'Ceremony Schedules',
    chaotic: 'Lost in endless WhatsApp chat forwards',
    organized: 'Live timeline with venues & dress codes',
  },
  {
    topic: 'Caterer Headcounts',
    chaotic: 'Guessed numbers and wasted food plates',
    organized: 'Exact counts with Jain & Veg dietary tags',
  },
  {
    topic: 'Two-Family Expenses',
    chaotic: 'Awkward phone calls on who paid what',
    organized: 'Shared rupee ledger of advances & balances',
  },
  {
    topic: 'Wedding Photos',
    chaotic: 'Scattered across 100 guest phones in low-res',
    organized: 'One table QR code to drop original high-res photos',
  },
];

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'ceremonies',
    title: 'Multi-Ceremony Timeline',
    shortSnippet: 'Separate venues, times, and dress codes for Haldi to Reception.',
    photoUrl:
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80',
    iconName: 'calendar',
    badge: '5-7 Ceremonies',
    visualTag: '🟡 Haldi • 🌿 Mehendi • 🎵 Sangeet • 🌺 Pheras',
    previewData: ['Individual map links', 'Custom ceremonial dress codes', 'Per-event guest lists'],
  },
  {
    id: 'rsvps',
    title: 'Zero-App Guest RSVPs',
    shortSnippet: 'Guests confirm attendance in 1 tap via WhatsApp. No accounts needed.',
    photoUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    iconName: 'mail',
    badge: '1-Click WhatsApp',
    visualTag: '186 Confirmed • 18 Jain/Veg • 240 Invited',
    previewData: ['No app download required', 'Jain & dietary headcounts', 'Automatic caterer totals'],
  },
  {
    id: 'expenses',
    title: 'Rupee Expense Ledger',
    shortSnippet: 'Track halwai tokens, decor advances, and remaining balances in ₹.',
    iconName: 'currency',
    badge: 'Real-Time ₹',
    visualTag: '₹12.45L Spent • ₹25.0L Budget • 8 Vendors',
    previewData: ['Vendor advance tracking', 'Due date reminders', 'Both families stay aligned'],
  },
  {
    id: 'gallery',
    title: 'Table QR Photo Drop',
    shortSnippet: 'Guests scan QR table cards to upload candid photos instantly.',
    photoUrl:
      'https://images.unsplash.com/photo-1545232979-fbf68fe9b132?auto=format&fit=crop&w=600&q=80',
    iconName: 'camera',
    badge: 'Original High-Res',
    visualTag: '420+ Candid Photos Uploaded Live',
    previewData: ['No app needed to upload', 'Original uncompressed quality', 'Private family album'],
  },
  {
    id: 'website-stream',
    title: 'Couple Website & Live Stream',
    shortSnippet: 'Themed public site with YouTube Live for relatives abroad.',
    photoUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
    iconName: 'globe',
    badge: 'Global Relatives',
    visualTag: 'HD YouTube Live • 4 Color Themes',
    previewData: ['Love story & schedule', 'One-click venue maps', 'Watch live from UK/US/Canada'],
  },
  {
    id: 'collaboration',
    title: 'Two Families Co-Managing',
    shortSnippet: 'Multi-admin roles for bride, groom, parents & close cousins.',
    iconName: 'users',
    badge: 'Admin & Manager Roles',
    visualTag: 'Bride Side & Groom Side in Sync',
    previewData: ['Assign tasks with deadlines', 'No duplicate bookings', 'Total peace of mind'],
  },
];

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: '01',
    action: 'CREATE',
    title: 'Set Up Your Workspace',
    description: 'Add dates, venues, ceremonies, and invite your family committee in 2 minutes.',
    chipText: 'Bride & Groom co-manage',
  },
  {
    number: '02',
    action: 'COORDINATE',
    title: 'Track Tasks & Rupee Budget',
    description: 'Assign duties to cousins and record halwai and decorator advances with full transparency.',
    chipText: 'Zero duplicate calls',
  },
  {
    number: '03',
    action: 'CELEBRATE',
    title: 'Collect RSVPs & Memories',
    description: 'Share 1-click WhatsApp invites and collect candid guest photos via table QR cards.',
    chipText: 'Exact caterer counts',
  },
];

export const FAQS: FaqItem[] = [
  {
    category: 'Elders & Guests',
    question: 'Do older relatives need to download an app or create a password?',
    answer:
      'No. Guests receive a unique web link via WhatsApp or SMS that opens instantly in their phone browser to RSVP with a single tap.',
  },
  {
    category: 'Two Families',
    question: 'Can both bride and groom families track expenses together?',
    answer:
      'Yes. Multiple Admins from both sides see the same rupee expense ledger so everyone knows which advances are settled.',
  },
  {
    category: 'Ceremonies',
    question: 'Can we invite different guests to Haldi vs Reception?',
    answer:
      'Yes. You can customize guest lists for each ceremony, from an intimate 40-person Haldi to a 500-person Grand Reception.',
  },
  {
    category: 'Overseas Live',
    question: 'How do relatives abroad watch the Pheras live?',
    answer:
      'Paste your YouTube Live link into your wedding website. Relatives anywhere in the world can watch in full HD on their phones or TVs.',
  },
];
