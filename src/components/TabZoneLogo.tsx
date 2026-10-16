import React from 'react';

interface TabZoneLogoProps {
  className?: string;
  size?: number;
}

export const TabZoneLogo: React.FC<TabZoneLogoProps> = ({
  className = 'w-11 h-11 sm:w-12 sm:h-12',
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size || undefined}
      height={size || undefined}
      className={`shrink-0 select-none ${className}`}
      aria-label="탭존 패밀리 로고"
    >
      <defs>
        {/* Soft Outer Drop Shadow for Shield */}
        <filter id="tzShieldShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor="#000000" floodOpacity="0.38" />
        </filter>

        {/* 3D Bevel Emboss Shadow for Gold Icons */}
        <filter id="tz3dEmboss" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#05101e" floodOpacity="0.7" />
        </filter>

        {/* Metallic Gold Outer Bevel Gradient */}
        <linearGradient id="tzGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fae4a0" />
          <stop offset="25%" stopColor="#dfb96f" />
          <stop offset="50%" stopColor="#ba8a38" />
          <stop offset="78%" stopColor="#e8c37a" />
          <stop offset="100%" stopColor="#8a5c18" />
        </linearGradient>

        {/* Inner Gold Lip Gradient */}
        <linearGradient id="tzGoldInnerRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe6a2" />
          <stop offset="35%" stopColor="#d6a551" />
          <stop offset="100%" stopColor="#7a4b12" />
        </linearGradient>

        {/* Shield Interior: Left Facet (Illuminated Navy) */}
        <linearGradient id="tzNavyLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#213a5f" />
          <stop offset="50%" stopColor="#192e4e" />
          <stop offset="100%" stopColor="#122137" />
        </linearGradient>

        {/* Shield Interior: Right Facet (Deep Navy) */}
        <linearGradient id="tzNavyRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a2f4e" />
          <stop offset="50%" stopColor="#13233b" />
          <stop offset="100%" stopColor="#0b1626" />
        </linearGradient>

        {/* Gold Graphic Elements Gradient */}
        <linearGradient id="tzGoldElement" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fae39d" />
          <stop offset="30%" stopColor="#dfb86e" />
          <stop offset="70%" stopColor="#bf8c39" />
          <stop offset="100%" stopColor="#875816" />
        </linearGradient>

        {/* Screen Dark Navy */}
        <linearGradient id="tzScreenDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14243b" />
          <stop offset="100%" stopColor="#0c1727" />
        </linearGradient>
      </defs>

      <g transform="translate(15.36, 15.36) scale(0.94)">
        {/* ================= SHIELD ================= */}
        {/* Outer Shield Beveled Gold Rim & Soft Shadow */}
        <path
          d="M 256,48 Q 345,68 428,88 L 428,266 C 428,362 348,428 256,470 C 164,428 84,362 84,266 L 84,88 Q 167,68 256,48 Z"
          fill="url(#tzGoldRim)"
          filter="url(#tzShieldShadow)"
        />

        {/* Inner Dark Groove */}
        <path
          d="M 256,62 Q 338,81 414,99 L 414,262 C 414,350 340,412 256,452 C 172,412 98,350 98,262 L 98,99 Q 174,81 256,62 Z"
          fill="#754710"
        />

        {/* Inner Gold Bevel Lip */}
        <path
          d="M 256,66 Q 335,84 408,102 L 408,260 C 408,345 336,406 256,446 C 176,406 104,345 104,260 L 104,102 Q 177,84 256,66 Z"
          fill="url(#tzGoldInnerRim)"
        />

        {/* Shield Navy Interior: Left Facet */}
        <path
          d="M 256,76 L 114,108 L 114,258 C 114,336 180,394 256,434 Z"
          fill="url(#tzNavyLeft)"
        />

        {/* Shield Navy Interior: Right Facet */}
        <path
          d="M 256,76 L 398,108 L 398,258 C 398,336 332,394 256,434 Z"
          fill="url(#tzNavyRight)"
        />

        {/* Subtle Center Vertical Specular Line */}
        <line
          x1="256"
          y1="76"
          x2="256"
          y2="434"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.14"
        />

        {/* ================= CENTER TABLET (PORTRAIT) ================= */}
        <g filter="url(#tz3dEmboss)">
          {/* Golden Tablet Bezel Outer Frame (iPad-like proportion) */}
          <rect
            x="180"
            y="132"
            width="152"
            height="236"
            rx="20"
            ry="20"
            fill="none"
            stroke="url(#tzGoldElement)"
            strokeWidth="15"
            strokeLinejoin="round"
          />

          {/* Dark Navy Screen Area */}
          <rect
            x="194"
            y="157"
            width="124"
            height="186"
            rx="6"
            ry="6"
            fill="url(#tzScreenDark)"
          />

          {/* Front Camera Dot (Top Bezel) */}
          <circle cx="256" cy="144.5" r="4" fill="#0c1727" stroke="url(#tzGoldElement)" strokeWidth="1.6" />

          {/* Home Button (Bottom Bezel) */}
          <circle cx="256" cy="353.5" r="7.5" fill="#0c1727" stroke="url(#tzGoldElement)" strokeWidth="2.2" />
        </g>

        {/* ================= LEFT ELEMENT: 2-WAY CHECKOUT/RETURN ARC ================= */}
        <g filter="url(#tz3dEmboss)">
          {/* Top Arrowhead (Rotated along arc tangent ~ -14 deg) */}
          <g transform="translate(141, 170) rotate(-14)">
            <polygon points="0,-16 16,16 -16,16" fill="url(#tzGoldElement)" />
          </g>

          {/* Curved Connecting Arc Shaft */}
          <path
            d="M 139,184 C 108,222 108,278 139,316"
            fill="none"
            stroke="url(#tzGoldElement)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Bottom Arrowhead (Rotated along arc tangent ~ 194 deg) */}
          <g transform="translate(141, 330) rotate(194)">
            <polygon points="0,-16 16,16 -16,16" fill="url(#tzGoldElement)" />
          </g>
        </g>

        {/* ================= RIGHT ELEMENT: CIRCULATION CYCLE + STAR ================= */}
        <g filter="url(#tz3dEmboss)">
          {/* Top Arrowhead (Points up-right along circle ~ 18 deg) */}
          <g transform="translate(371, 170) rotate(18)">
            <polygon points="0,-16 16,16 -16,16" fill="url(#tzGoldElement)" />
          </g>

          {/* Top Curved Arc Shaft (Curving toward star) */}
          <path
            d="M 373,184 C 387,198 394,212 397,224"
            fill="none"
            stroke="url(#tzGoldElement)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Center 5-Pointed Star */}
          <g transform="translate(398, 250) rotate(10)">
            <polygon
              points="
                0.0,-19.0
                5.6,-7.6
                18.1,-5.9
                9.0,2.9
                11.2,15.4
                0.0,9.5
                -11.2,15.4
                -9.0,2.9
                -18.1,-5.9
                -5.6,-7.6"
              fill="url(#tzGoldElement)"
              stroke="#754710"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </g>

          {/* Bottom Curved Arc Shaft (Curving from star down) */}
          <path
            d="M 397,276 C 394,288 387,302 373,316"
            fill="none"
            stroke="url(#tzGoldElement)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Bottom Arrowhead (Points down-left along circle ~ 162 deg) */}
          <g transform="translate(371, 330) rotate(162)">
            <polygon points="0,-16 16,16 -16,16" fill="url(#tzGoldElement)" />
          </g>
        </g>
      </g>
    </svg>
  );
};
