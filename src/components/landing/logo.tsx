import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const dimensions = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensions} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-sm"
        aria-label="Make My Marriage Emblem"
      >
        <defs>
          {/* Royal Crimson Gradient */}
          <linearGradient id="mmmCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9f1239" />
            <stop offset="50%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          {/* Zari Gold Metallic Gradient */}
          <linearGradient id="mmmGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Subtle Inner Glow */}
          <linearGradient id="mmmRingGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer Sacred Lotus / Arch Silhouette */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="24"
          fill="url(#mmmCrimson)"
          stroke="url(#mmmGold)"
          strokeWidth="3"
        />

        {/* Delicate Corner Filigree Ornaments */}
        <circle cx="18" cy="18" r="2.5" fill="url(#mmmGold)" />
        <circle cx="82" cy="18" r="2.5" fill="url(#mmmGold)" />
        <circle cx="18" cy="82" r="2.5" fill="url(#mmmGold)" />
        <circle cx="82" cy="82" r="2.5" fill="url(#mmmGold)" />

        {/* Top Royal Kalash / Diya Flame Finial */}
        <path
          d="M50 14 C48 18, 44 21, 50 25 C56 21, 52 18, 50 14 Z"
          fill="url(#mmmGold)"
        />

        {/* Central Intersecting Gathbandhan Knot & Twin Ceremonial Rings */}
        {/* Left Ring (Groom's Band) */}
        <ellipse
          cx="43"
          cy="48"
          rx="17"
          ry="15"
          fill="none"
          stroke="url(#mmmGold)"
          strokeWidth="4"
          transform="rotate(-12 43 48)"
        />

        {/* Right Ring (Bride's Band) with Pavé Crown */}
        <ellipse
          cx="57"
          cy="48"
          rx="17"
          ry="15"
          fill="none"
          stroke="url(#mmmGold)"
          strokeWidth="4"
          transform="rotate(12 57 48)"
        />

        {/* Central Sacred Solitaire Diamond Motif at Interlock */}
        <polygon
          points="50,33 55,40 50,47 45,40"
          fill="url(#mmmGold)"
          stroke="#fef08a"
          strokeWidth="1"
        />

        {/* Lower Elegant Calligraphic "M" Monogram Ribbon */}
        <path
          d="M32 75 L39 52 L50 67 L61 52 L68 75"
          fill="none"
          stroke="url(#mmmGold)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Auspicious Center Bindi Accent */}
        <circle cx="50" cy="56" r="2" fill="#fef08a" />
      </svg>
    </div>
  );
}
