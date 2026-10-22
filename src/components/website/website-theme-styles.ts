export interface WebsiteThemeConfig {
  id: string;
  name: string;
  tag: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  cardBg: string;
  borderClass: string;
  headingColor: string;
  accentText: string;
  buttonClass: string;
  badgeClass: string;
  secondaryBadgeClass: string;
  swatchColor: string;
}

export const WEBSITE_THEMES: Record<string, WebsiteThemeConfig> = {
  crimson: {
    id: 'crimson',
    name: 'Royal Crimson & Zari Gold',
    tag: 'Auspicious & Regal',
    primaryColor: '#881337',
    accentColor: '#b45309',
    bgGradient: 'from-rose-50/90 via-amber-50/40 to-stone-50',
    cardBg: 'bg-white/95',
    borderClass: 'border-rose-200/80',
    headingColor: 'text-rose-950',
    accentText: 'text-rose-900',
    buttonClass: 'bg-rose-900 hover:bg-rose-950 text-white shadow-rose-900/20',
    badgeClass: 'bg-rose-100/80 text-rose-900 border-rose-300',
    secondaryBadgeClass: 'bg-amber-100/80 text-amber-900 border-amber-300',
    swatchColor: '#881337',
  },
  marigold: {
    id: 'marigold',
    name: 'Marigold Sunshine & Amber',
    tag: 'Haldi & Festive Glow',
    primaryColor: '#d97706',
    accentColor: '#b45309',
    bgGradient: 'from-amber-50/95 via-yellow-50/60 to-orange-50/30',
    cardBg: 'bg-white/95',
    borderClass: 'border-amber-300/80',
    headingColor: 'text-amber-950',
    accentText: 'text-amber-800',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-300',
    secondaryBadgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    swatchColor: '#d97706',
  },
  emerald: {
    id: 'emerald',
    name: 'Regal Emerald & Sandalwood',
    tag: 'Palatial Heritage',
    primaryColor: '#065f46',
    accentColor: '#047857',
    bgGradient: 'from-emerald-50/90 via-teal-50/40 to-stone-50',
    cardBg: 'bg-white/95',
    borderClass: 'border-emerald-300/80',
    headingColor: 'text-emerald-950',
    accentText: 'text-emerald-800',
    buttonClass: 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20',
    badgeClass: 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
    secondaryBadgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    swatchColor: '#065f46',
  },
  gulabi: {
    id: 'gulabi',
    name: 'Pastel Gulabi & Rose Gold',
    tag: 'Romantic & Floral Bliss',
    primaryColor: '#be185d',
    accentColor: '#db2777',
    bgGradient: 'from-pink-50/90 via-rose-50/50 to-stone-50',
    cardBg: 'bg-white/95',
    borderClass: 'border-pink-300/80',
    headingColor: 'text-pink-950',
    accentText: 'text-pink-800',
    buttonClass: 'bg-pink-700 hover:bg-pink-800 text-white shadow-pink-700/20',
    badgeClass: 'bg-pink-100/90 text-pink-900 border-pink-300',
    secondaryBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    swatchColor: '#be185d',
  },
};

// Aliases for themes
WEBSITE_THEMES.CLASSIC = WEBSITE_THEMES.crimson;
WEBSITE_THEMES.MINIMAL = WEBSITE_THEMES.emerald;
WEBSITE_THEMES.MODERN = WEBSITE_THEMES.gulabi;

export function getThemeConfig(themeKey?: string | null): WebsiteThemeConfig {
  if (!themeKey) return WEBSITE_THEMES.crimson;
  const normalized = themeKey.toLowerCase();
  return WEBSITE_THEMES[normalized] || WEBSITE_THEMES[themeKey] || WEBSITE_THEMES.crimson;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Extracts Google Meet code (e.g. abc-defg-hij) from URLs or plain text.
 */
export function extractGoogleMeetCode(urlOrCode: string | null | undefined): string | null {
  if (!urlOrCode) return null;
  const trimmed = urlOrCode.trim();
  const match = trimmed.match(/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Normalizes a Google Meet link or code to a standard HTTPS URL.
 */
export function normalizeGoogleMeetUrl(urlOrCode: string | null | undefined): string | null {
  if (!urlOrCode) return null;
  const trimmed = urlOrCode.trim();
  if (!trimmed) return null;
  const code = extractGoogleMeetCode(trimmed);
  if (code) {
    return `https://meet.google.com/${code}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('meet.google.com')) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
  return `https://meet.google.com/${trimmed}`;
}

export interface ScheduledTimeStatus {
  formattedTime: string;
  isUpcoming: boolean;
  isLive: boolean;
  countdownText: string;
}

/**
 * Formats a scheduled call time and calculates live countdown status in IST.
 */
export function getScheduledCallStatus(
  scheduledStartTime: string | null | undefined,
  timeZone: string = 'Asia/Kolkata',
  referenceNow?: Date
): ScheduledTimeStatus | null {
  if (!scheduledStartTime) return null;
  try {
    const target = new Date(scheduledStartTime);
    if (isNaN(target.getTime())) return null;

    const now = referenceNow || new Date();
    const diffMs = target.getTime() - now.getTime();

    const formattedTime = target.toLocaleString('en-IN', {
      timeZone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // If within 3 hours after start time, consider it live
    if (diffMs <= 0 && diffMs > -3 * 60 * 60 * 1000) {
      return {
        formattedTime,
        isUpcoming: false,
        isLive: true,
        countdownText: 'Happening Now! 🔴',
      };
    }

    if (diffMs <= -3 * 60 * 60 * 1000) {
      return {
        formattedTime,
        isUpcoming: false,
        isLive: false,
        countdownText: 'Ceremony Concluded',
      };
    }

    // Upcoming: calculate days, hours, minutes
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    let countdownText = 'Starts in ';
    if (days > 0) {
      countdownText += `${days}d ${hours}h`;
    } else if (hours > 0) {
      countdownText += `${hours}h ${minutes}m`;
    } else {
      countdownText += `${Math.max(1, minutes)}m`;
    }

    return {
      formattedTime,
      isUpcoming: true,
      isLive: false,
      countdownText,
    };
  } catch {
    return null;
  }
}


