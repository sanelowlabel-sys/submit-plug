import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 select-none group ${className}`}
      style={{ width: size, height: size }}
      title="Submit Plug"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(190,30,47,0.35)] transition-transform duration-300 group-hover:scale-105"
      >
        {/* Background Rounded Shield / Vinyl Plate */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          className="fill-[#1e1e1e] stroke-[#BE1E2F]/40"
          strokeWidth="3"
        />

        {/* Concentric Vinyl Grooves */}
        <circle cx="50" cy="50" r="38" stroke="#3a3a3a" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="50" cy="50" r="30" stroke="#3a3a3a" strokeWidth="1" opacity="0.4" />
        <circle cx="50" cy="50" r="22" stroke="#BE1E2F" strokeWidth="1.5" opacity="0.3" />

        {/* Glowing Red Center Hub */}
        <circle cx="50" cy="50" r="15" fill="#BE1E2F" className="animate-pulse" />

        {/* Iconic Audio Plug / Lightning Thunderbolt Prongs */}
        {/* Top left plug prong */}
        <rect x="36" y="22" width="6" height="14" rx="3" fill="#ffffff" />
        {/* Top right plug prong */}
        <rect x="58" y="22" width="6" height="14" rx="3" fill="#ffffff" />

        {/* Plug Header Body / Socket */}
        <path
          d="M32 34C32 31.7909 33.7909 30 36 30H64C66.2091 30 68 31.7909 68 34V46C68 55.9411 59.9411 64 50 64C40.0589 64 32 55.9411 32 46V34Z"
          fill="#ffffff"
        />

        {/* Inner Plug Core Symbol (Soundwave Bolt in Crimson) */}
        <path
          d="M52 36L42 49H49L47 60L58 46H50L52 36Z"
          fill="#BE1E2F"
        />

        {/* Plug Cord / Audio Wave Trail at Bottom */}
        <path
          d="M50 64V76M44 76C44 79 46.5 82 50 82C53.5 82 56 79 56 76"
          stroke="#BE1E2F"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        
        {/* Sparkle Accent Top Right */}
        <circle cx="76" cy="24" r="3" fill="#BE1E2F" />
      </svg>
    </div>
  );
};
