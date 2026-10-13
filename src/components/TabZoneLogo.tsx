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
        {/* Metallic Gold Outer Bevel Gradient */}
        <linearGradient id="tzGoldOuterRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde6a4" />
          <stop offset="25%" stopColor="#dfb86e" />
          <stop offset="50%" stopColor="#be8c3b" />
          <stop offset="75%" stopColor="#e5c07b" />
          <stop offset="100%" stopColor="#8a5c18" />
        </linearGradient>

        {/* Inner Gold Lip Gradient */}
        <linearGradient id="tzGoldInnerRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe299" />
          <stop offset="40%" stopColor="#d4a34f" />
          <stop offset="100%" stopColor="#7a4b12" />
        </linearGradient>

        {/* Navy Shield Face Gradient (Left Facet: Lit) */}
        <linearGradient id="tzNavyLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#254a7c" />
          <stop offset="50%" stopColor="#1a375e" />
          <stop offset="100%" stopColor="#122744" />
        </linearGradient>

        {/* Navy Shield Face Gradient (Right Facet: Deeper) */}
        <linearGradient id="tzNavyRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1c375b" />
          <stop offset="50%" stopColor="#122744" />
          <stop offset="100%" stopColor="#0a1728" />
        </linearGradient>

        {/* Gold Emblem Metal Fill */}
        <linearGradient id="tzGoldEmblem" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fae097" />
          <stop offset="30%" stopColor="#dfb76c" />
          <stop offset="70%" stopColor="#be8a35" />
          <stop offset="100%" stopColor="#875815" />
        </linearGradient>

        {/* Cursor Gradient */}
        <linearGradient id="tzGoldCursor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff2be" />
          <stop offset="40%" stopColor="#e8c27a" />
          <stop offset="80%" stopColor="#b8832c" />
          <stop offset="100%" stopColor="#6e420b" />
        </linearGradient>
      </defs>

      {/* Soft Outer Shadow Silhouette */}
      <path
        d="M 256,48 L 404,82 L 404,280 C 404,372 340,432 256,474 C 172,432 108,372 108,280 L 108,82 Z"
        fill="#000000"
        fillOpacity="0.28"
      />

      {/* Outer Shield Beveled Gold Rim */}
      <path
        d="M 256,44 L 400,78 L 400,276 C 400,366 338,426 256,468 C 174,426 112,366 112,276 L 112,78 Z"
        fill="url(#tzGoldOuterRim)"
      />

      {/* Inner Gold Bevel Contour Line */}
      <path
        d="M 256,58 L 388,89 L 388,272 C 388,354 330,412 256,450 C 182,412 124,354 124,272 L 124,89 Z"
        fill="#7a4c14"
      />
      <path
        d="M 256,62 L 384,92 L 384,270 C 384,350 328,408 256,444 C 184,408 128,350 128,270 L 128,92 Z"
        fill="url(#tzGoldInnerRim)"
      />

      {/* Shield Navy Interior */}
      <path
        d="M 256,72 L 138,100 L 138,266 C 138,342 190,396 256,432 Z"
        fill="url(#tzNavyLeft)"
      />
      <path
        d="M 256,72 L 374,100 L 374,266 C 374,342 322,396 256,432 Z"
        fill="url(#tzNavyRight)"
      />

      {/* Center Spine Highlight */}
      <line
        x1="256"
        y1="72"
        x2="256"
        y2="432"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.15"
      />

      {/* UPPER GRAPHIC: GOLD TABLET & CURSOR ARROW */}
      <g>
        {/* Tablet Outer Shell (Landscape) */}
        <rect
          x="176"
          y="128"
          width="160"
          height="108"
          rx="16"
          ry="16"
          fill="none"
          stroke="url(#tzGoldEmblem)"
          strokeWidth="14"
          strokeLinejoin="round"
        />

        {/* Left Camera Dot & Right Sensor Dot */}
        <circle cx="187" cy="182" r="3.5" fill="url(#tzGoldEmblem)" />
        <circle cx="325" cy="182" r="2.5" fill="url(#tzGoldEmblem)" />

        {/* Tablet Screen Cutout (Dark Navy) */}
        <rect
          x="194"
          y="142"
          width="124"
          height="80"
          rx="6"
          ry="6"
          fill="#0a1626"
        />

        {/* Pointer Cursor Arrow */}
        <path
          d="M 270,175 L 316,247 L 300,250 L 320,287 L 300,297 L 280,260 L 262,273 Z"
          fill="#040c17"
          fillOpacity="0.5"
        />
        <path
          d="M 268,172 L 314,244 L 298,247 L 318,284 L 298,294 L 278,257 L 260,270 Z"
          fill="url(#tzGoldCursor)"
          stroke="#73470f"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      {/* LOWER GRAPHIC: 3D EMBOSSED KOREAN "탭존" */}
      <g>
        {/* '탭' */}
        <rect x="164" y="278" width="10" height="54" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="164" y="278" width="46" height="10" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="164" y="300" width="42" height="10" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="164" y="322" width="46" height="10" rx="2" fill="url(#tzGoldEmblem)" />

        {/* 'ㅐ' */}
        <rect x="218" y="276" width="10" height="56" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="226" y="299" width="16" height="10" rx="1" fill="url(#tzGoldEmblem)" />
        <rect x="240" y="274" width="11" height="58" rx="2" fill="url(#tzGoldEmblem)" />

        {/* 'ㅂ' */}
        <rect x="174" y="342" width="11" height="42" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="230" y="342" width="11" height="42" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="174" y="360" width="67" height="10" rx="1" fill="url(#tzGoldEmblem)" />
        <rect x="174" y="374" width="67" height="10" rx="2" fill="url(#tzGoldEmblem)" />

        {/* '존' */}
        <rect x="270" y="278" width="76" height="10" rx="2" fill="url(#tzGoldEmblem)" />
        <path d="M 312,286 L 274,328 L 286,328 L 318,286 Z" fill="url(#tzGoldEmblem)" />
        <path d="M 304,286 L 334,328 L 346,328 L 314,286 Z" fill="url(#tzGoldEmblem)" />

        {/* 'ㅗ' */}
        <rect x="303" y="328" width="10" height="18" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="262" y="342" width="92" height="10" rx="2" fill="url(#tzGoldEmblem)" />

        {/* 'ㄴ' */}
        <rect x="280" y="354" width="11" height="30" rx="2" fill="url(#tzGoldEmblem)" />
        <rect x="280" y="374" width="62" height="10" rx="2" fill="url(#tzGoldEmblem)" />
      </g>
    </svg>
  );
};
