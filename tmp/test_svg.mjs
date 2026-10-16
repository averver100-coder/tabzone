import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Soft Canvas Drop Shadow for Shield -->
    <filter id="tzShieldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.36" />
    </filter>

    <!-- 3D Bevel Emboss Shadow for Gold Icons -->
    <filter id="tzIconShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#071322" flood-opacity="0.6" />
    </filter>

    <!-- Gold Outer Rim Gradient -->
    <linearGradient id="tzGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fae29a" />
      <stop offset="22%" stop-color="#dfb66b" />
      <stop offset="48%" stop-color="#b88836" />
      <stop offset="78%" stop-color="#e5be75" />
      <stop offset="100%" stop-color="#8a5b17" />
    </linearGradient>

    <!-- Inner Gold Lip Gradient -->
    <linearGradient id="tzGoldInnerLip" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffe6a3" />
      <stop offset="35%" stop-color="#d6a551" />
      <stop offset="100%" stop-color="#7a4b12" />
    </linearGradient>

    <!-- Navy Left Facet (Lighted) -->
    <linearGradient id="tzNavyFacetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#224068" />
      <stop offset="50%" stop-color="#182f50" />
      <stop offset="100%" stop-color="#102037" />
    </linearGradient>

    <!-- Navy Right Facet (Deep) -->
    <linearGradient id="tzNavyFacetRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a3254" />
      <stop offset="50%" stop-color="#12233c" />
      <stop offset="100%" stop-color="#0a1526" />
    </linearGradient>

    <!-- Tablet / Icon Gold Gradient -->
    <linearGradient id="tzGoldIcon" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fae39d" />
      <stop offset="30%" stop-color="#e0b86e" />
      <stop offset="70%" stop-color="#bf8c39" />
      <stop offset="100%" stop-color="#8a5b19" />
    </linearGradient>

    <!-- Tablet Screen Fill -->
    <linearGradient id="tzScreenFill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#162945" />
      <stop offset="100%" stop-color="#0d182b" />
    </linearGradient>
  </defs>

  <!-- ================= SHIELD ================= -->
  <!-- Outer Beveled Gold Rim -->
  <path d="M 256,44 Q 345,66 428,88 L 428,266 C 428,360 348,425 256,468 C 164,425 84,360 84,266 L 84,88 Q 167,66 256,44 Z"
        fill="url(#tzGoldRim)"
        filter="url(#tzShieldShadow)" />

  <!-- Inner Dark Bevel Groove -->
  <path d="M 256,58 Q 339,78 414,98 L 414,263 C 414,348 340,410 256,450 C 172,410 98,348 98,263 L 98,98 Q 173,78 256,58 Z"
        fill="#754710" />

  <!-- Inner Gold Lip -->
  <path d="M 256,62 Q 336,81 408,101 L 408,260 C 408,343 336,404 256,444 C 176,404 104,343 104,260 L 104,101 Q 176,81 256,62 Z"
        fill="url(#tzGoldInnerLip)" />

  <!-- Left Facet (Lighted Royal Navy) -->
  <path d="M 256,72 L 114,107 L 114,258 C 114,334 180,392 256,432 Z"
        fill="url(#tzNavyFacetLeft)" />

  <!-- Right Facet (Deep Royal Navy) -->
  <path d="M 256,72 L 398,107 L 398,258 C 398,334 332,392 256,432 Z"
        fill="url(#tzNavyFacetRight)" />

  <!-- Subtle Center Spine Reflection -->
  <line x1="256" y1="72" x2="256" y2="432" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.12" />

  <!-- ================= CENTER TABLET ================= -->
  <g filter="url(#tzIconShadow)">
    <!-- Tablet Body Outer Frame (Portrait) -->
    <rect x="178" y="136" width="156" height="232" rx="20" ry="20"
          fill="none" stroke="url(#tzGoldIcon)" stroke-width="14" stroke-linejoin="round" />

    <!-- Screen Cutout -->
    <rect x="193" y="161" width="126" height="182" rx="6" ry="6"
          fill="url(#tzScreenFill)" stroke="#6e4611" stroke-width="1" />

    <!-- Top Camera Circle -->
    <circle cx="256" cy="148" r="4" fill="#0d182b" stroke="url(#tzGoldIcon)" stroke-width="1.5" />

    <!-- Bottom Home Button Circle -->
    <circle cx="256" cy="354" r="7.5" fill="#0d182b" stroke="url(#tzGoldIcon)" stroke-width="2" />
  </g>

  <!-- ================= LEFT ARROW (2-WAY CHECKOUT/RETURN ARC) ================= -->
  <g filter="url(#tzIconShadow)">
    <!-- Top Arrowhead (Points Upwards) -->
    <path d="M 152,170 L 160,208 L 143,204 L 126,206 Z" fill="url(#tzGoldIcon)" />

    <!-- Curved Arc Ribbon connecting to Bottom Arrow -->
    <path d="M 136,205 C 104,242 104,264 136,301 L 148,296 C 118,264 118,242 148,207 Z" fill="url(#tzGoldIcon)" />

    <!-- Bottom Arrowhead (Points Downwards) -->
    <path d="M 152,336 L 126,300 L 143,302 L 160,298 Z" fill="url(#tzGoldIcon)" />
  </g>

  <!-- ================= RIGHT CIRCULATION (ARROWS + STAR) ================= -->
  <g filter="url(#tzIconShadow)">
    <!-- Top Curved Arrow (Clockwise upward rotation) -->
    <path d="M 374,170 L 366,208 L 383,204 L 400,206 Z" fill="url(#tzGoldIcon)" />
    <path d="M 388,206 C 378,218 373,227 368,236 L 380,240 C 385,232 390,224 398,214 Z" fill="url(#tzGoldIcon)" />

    <!-- Center 5-Pointed Star -->
    <!-- Center: (388, 253), Outer Radius: 19, Inner Radius: 8.5 -->
    <polygon points="
      388.0,234.0
      393.3,245.5
      406.0,246.8
      396.5,255.4
      399.2,267.8
      388.0,261.3
      376.8,267.8
      379.5,255.4
      370.0,246.8
      382.7,245.5"
      fill="url(#tzGoldIcon)"
      stroke="#7a4d13"
      stroke-width="1"
      stroke-linejoin="round" />

    <!-- Bottom Curved Arrow (Clockwise downward rotation) -->
    <path d="M 374,336 L 400,300 L 383,302 L 366,298 Z" fill="url(#tzGoldIcon)" />
    <path d="M 388,300 C 378,288 373,279 368,270 L 380,266 C 385,274 390,282 398,292 Z" fill="url(#tzGoldIcon)" />
  </g>
</svg>`;

fs.writeFileSync('/tmp/test-logo.svg', svgContent);
console.log('SVG written to /tmp/test-logo.svg');
