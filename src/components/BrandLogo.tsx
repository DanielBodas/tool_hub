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
        <linearGradient id="brand-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="35%" stopColor="#7C3AED" />
          <stop offset="70%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
        <filter id="brand-logo-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Background Squircle */}
      <rect width="512" height="512" rx="144" fill="url(#brand-logo-grad)" />

      <g filter="url(#brand-logo-glow)">
        {/* Central Hub Circle representing Platform */}
        <circle cx="256" cy="256" r="110" fill="none" stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" opacity="0.9" />

        {/* Gear Teeth / Spokes (8 radiating pill shapes) */}
        <g fill="#FFFFFF" opacity="0.9">
          <rect x="244" y="100" width="24" height="40" rx="12" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(45 256 256)" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(90 256 256)" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(135 256 256)" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(180 256 256)" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(225 256 256)" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(270 256 256)" />
          <rect x="244" y="100" width="24" height="40" rx="12" transform="rotate(315 256 256)" />
        </g>

        {/* Stylized Wrench Diagonal crossing the center */}
        <g transform="rotate(-45 256 256)">
          <rect x="240" y="180" width="32" height="200" rx="16" fill="#FFFFFF" />
          <rect x="248" y="220" width="16" height="120" rx="8" fill="url(#brand-logo-grad)" />

          <circle cx="256" cy="170" r="44" fill="#FFFFFF" />
          <rect x="238" y="110" width="36" height="60" rx="8" fill="url(#brand-logo-grad)" />

          <circle cx="256" cy="380" r="32" fill="#FFFFFF" />
          <circle cx="256" cy="380" r="14" fill="url(#brand-logo-grad)" />
        </g>

        {/* Sparkles / Stars */}
        <path d="M380,100 Q380,130 410,130 Q380,130 380,160 Q380,130 350,130 Q380,130 380,100 Z" fill="#FFFFFF" />
        <path d="M130,350 Q130,370 150,370 Q130,370 130,390 Q130,370 110,370 Q130,370 130,350 Z" fill="#FFFFFF" opacity="0.8" />
      </g>
    </svg>
  );
}
