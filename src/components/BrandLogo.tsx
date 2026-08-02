import React from "react";

interface BrandLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function BrandLogo({ className = "w-10 h-10", ...props }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      {...props}
    >
      <defs>
        {/* Isolated gradient and filter IDs to prevent collisions on duplicate rendering */}
        <linearGradient id="bl-ring-pink" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="bl-ring-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="bl-ring-gold" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>

        <radialGradient id="bl-bg-grad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="60%" stopColor="#0F0C24" />
          <stop offset="100%" stopColor="#070514" />
        </radialGradient>

        <filter id="bl-ring-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bl-core-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#FFFFFF" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Dark Premium Background Squircle */}
      <rect width="512" height="512" rx="144" fill="url(#bl-bg-grad)" />

      {/* Interlocking Rings Group with screen blend mode */}
      <g filter="url(#bl-ring-glow)" style={{ mixBlendMode: "screen" }}>
        {/* Blue Ring (Bottom-Left / Finance & Precision) */}
        <circle cx="195" cy="295" r="94" fill="none" stroke="url(#bl-ring-blue)" strokeWidth="32" opacity="0.9" />

        {/* Gold Ring (Bottom-Right / Bets & Celebration) */}
        <circle cx="317" cy="295" r="94" fill="none" stroke="url(#bl-ring-gold)" strokeWidth="32" opacity="0.9" />

        {/* Pink Ring (Top / Care & Baby Leaves) */}
        <circle cx="256" cy="190" r="94" fill="none" stroke="url(#bl-ring-pink)" strokeWidth="32" opacity="0.9" />
      </g>

      {/* Central Glow & Core Connection Sparkle */}
      <g filter="url(#bl-core-glow)">
        <circle cx="256" cy="260" r="14" fill="#FFFFFF" />
        <path d="M256,220 Q256,260 296,260 Q256,260 256,300 Q256,260 216,260 Q256,260 256,220 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
