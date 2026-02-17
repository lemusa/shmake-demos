/**
 * Generate timber cross-section profile SVGs for shmakeCut demo catalogue.
 * Based on the existing hand-crafted SVGs in docs/images/.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(import.meta.dirname, '..', 'public', 'images', 'profiles');
mkdirSync(OUT_DIR, { recursive: true });

// Seeded pseudo-random for reproducible grain
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Color palettes by category
const PALETTES = {
  framing: { light: '#E8C06A', mid: '#D4A44A', dark: '#B8882E' },
  post:    { light: '#DABA60', mid: '#C49A3C', dark: '#A07828' },
  board:   { light: '#E8C06A', mid: '#D4A44A', dark: '#B8882E' },
  rail:    { light: '#E0BC62', mid: '#CCA048', dark: '#B08830' },
  decking: { light: '#DEB860', mid: '#C89E42', dark: '#AA8228' },
  batten:  { light: '#E8C06A', mid: '#D4A44A', dark: '#B8882E' },
  capping: { light: '#E4C872', mid: '#CCAA55', dark: '#AA8833' },
};

const CANVAS_W = 140;
const BODY_W = 120;
const PAD_X = 10;
const PAD_Y = 8;
const LABEL_SPACE = 36;

function generateGrain(rng, bodyW, bodyH, count) {
  const ellipses = [];
  const lines = [];
  const cx = bodyW * (0.4 + rng() * 0.2);
  const cy = bodyH * (0.3 + rng() * 0.4);

  // Elliptical growth rings
  const ringCount = Math.max(3, Math.min(8, Math.floor(bodyH / 10)));
  for (let i = 0; i < ringCount; i++) {
    const t = (i + 1) / ringCount;
    const rx = bodyW * 0.2 + bodyW * 0.6 * t + rng() * bodyW * 0.1;
    const ry = bodyH * 0.15 + bodyH * 0.5 * t + rng() * bodyH * 0.05;
    const sw = 0.5 + rng() * 0.8;
    const op = 0.08 + rng() * 0.1;
    ellipses.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="#8B6914" stroke-width="${sw.toFixed(2)}" opacity="${op.toFixed(3)}"/>`);
  }

  // Vertical grain lines
  const lineCount = Math.max(5, Math.floor(bodyW / 12));
  for (let i = 0; i < lineCount; i++) {
    const x1 = (bodyW / lineCount) * (i + 0.3 + rng() * 0.4);
    const x2 = x1 + (rng() - 0.5) * 4;
    const sw = 0.4 + rng() * 0.4;
    const op = 0.04 + rng() * 0.06;
    lines.push(`<line x1="${x1.toFixed(1)}" y1="0" x2="${x2.toFixed(1)}" y2="${bodyH}" stroke="#6B4F10" stroke-width="${sw.toFixed(2)}" opacity="${op.toFixed(3)}"/>`);
  }

  return [...ellipses, ...lines].join('');
}

function generateRect(id, category, w, h) {
  const palette = PALETTES[category] || PALETTES.framing;
  const scale = BODY_W / w;
  const bodyH = Math.max(16, Math.round(h * scale));
  const svgH = PAD_Y + bodyH + LABEL_SPACE;
  const rng = seededRandom(w * 1000 + h * 7 + category.charCodeAt(0));
  const grain = generateGrain(rng, BODY_W, bodyH, 10);
  const gradId = `wood_${id}`;
  const clipId = `clip_${id}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${svgH}" width="${CANVAS_W}" height="${svgH}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.light}"/>
      <stop offset="50%" stop-color="${palette.mid}"/>
      <stop offset="100%" stop-color="${palette.dark}"/>
    </linearGradient>
    <clipPath id="${clipId}">
      <rect x="${PAD_X}" y="${PAD_Y}" width="${BODY_W}" height="${bodyH}" rx="1"/>
    </clipPath>
  </defs>
  <rect x="${PAD_X + 1.5}" y="${PAD_Y + 1.5}" width="${BODY_W}" height="${bodyH}" rx="1.5" fill="#00000015"/>
  <rect x="${PAD_X}" y="${PAD_Y}" width="${BODY_W}" height="${bodyH}" rx="1.5" fill="url(#${gradId})" stroke="${palette.dark}" stroke-width="1.2"/>
  <g clip-path="url(#${clipId})" transform="translate(${PAD_X},${PAD_Y})">
    ${grain}
  </g>
  <rect x="${PAD_X + 0.5}" y="${PAD_Y + 0.5}" width="${BODY_W - 1}" height="3" rx="0.5" fill="#fff" opacity="0.15"/>
  <text x="70" y="${svgH - 12}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#475569">${w}\u00d7${h}</text>
</svg>`;
}

function generateCapping(id, w, h) {
  const palette = PALETTES.capping;
  const scale = BODY_W / w;
  const bodyH = Math.max(16, Math.round(h * scale));
  const peakH = Math.round(bodyH * 0.6);
  const topY = PAD_Y;
  const peakY = topY;
  const slopeY = topY + peakH;
  const botY = slopeY + bodyH;
  const svgH = botY + LABEL_SPACE;
  const cx = CANVAS_W / 2;
  const lx = PAD_X;
  const rx = PAD_X + BODY_W;
  const rng = seededRandom(w * 1000 + h * 7 + 99);
  const grain = generateGrain(rng, BODY_W, bodyH, 8);
  const gradId = `wood_${id}`;
  const clipId = `clip_${id}`;

  const points = `${cx},${peakY} ${rx},${slopeY} ${rx},${botY} ${lx},${botY} ${lx},${slopeY}`;
  const shadowPoints = `${cx + 1.5},${peakY + 1.5} ${rx + 1.5},${slopeY + 1.5} ${rx + 1.5},${botY + 1.5} ${lx + 1.5},${botY + 1.5} ${lx + 1.5},${slopeY + 1.5}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${svgH}" width="${CANVAS_W}" height="${svgH}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.light}"/>
      <stop offset="50%" stop-color="${palette.mid}"/>
      <stop offset="100%" stop-color="${palette.dark}"/>
    </linearGradient>
    <clipPath id="${clipId}">
      <polygon points="${points}"/>
    </clipPath>
  </defs>
  <polygon points="${shadowPoints}" fill="#00000015"/>
  <polygon points="${points}" fill="url(#${gradId})" stroke="${palette.dark}" stroke-width="1.2"/>
  <g clip-path="url(#${clipId})" transform="translate(${lx},${slopeY})">
    ${grain}
  </g>
  <line x1="${lx}" y1="${slopeY}" x2="${cx}" y2="${peakY}" stroke="#fff" stroke-width="1.5" opacity="0.2"/>
  <line x1="${cx}" y1="${peakY}" x2="${rx}" y2="${slopeY}" stroke="#fff" stroke-width="1" opacity="0.1"/>
  <text x="70" y="${svgH - 12}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#475569">${w}\u00d7${h}</text>
</svg>`;
}

// All profiles to generate
const PROFILES = [
  // Framing
  { cat: 'framing', w: 45, h: 45 },
  { cat: 'framing', w: 90, h: 45 },
  { cat: 'framing', w: 140, h: 45 },
  { cat: 'framing', w: 190, h: 45 },
  { cat: 'framing', w: 240, h: 45 },
  { cat: 'framing', w: 290, h: 45 },
  // Posts
  { cat: 'post', w: 100, h: 100 },
  { cat: 'post', w: 125, h: 125 },
  { cat: 'post', w: 150, h: 150 },
  // Boards
  { cat: 'board', w: 100, h: 19 },
  { cat: 'board', w: 150, h: 19 },
  { cat: 'board', w: 200, h: 19 },
  { cat: 'board', w: 150, h: 25 },
  { cat: 'board', w: 200, h: 25 },
  // Rails
  { cat: 'rail', w: 65, h: 35 },
  { cat: 'rail', w: 75, h: 50 },
  // Decking
  { cat: 'decking', w: 90, h: 23 },
  { cat: 'decking', w: 140, h: 19 },
  { cat: 'decking', w: 140, h: 32 },
  // Battens
  { cat: 'batten', w: 40, h: 20 },
  { cat: 'batten', w: 65, h: 19 },
  // Capping
  { cat: 'capping', w: 65, h: 19 },
  { cat: 'capping', w: 90, h: 19 },
  { cat: 'capping', w: 140, h: 19 },
];

for (const p of PROFILES) {
  const id = `${p.cat}_${p.w}x${p.h}`;
  const filename = `profile-${p.cat}-${p.w}x${p.h}.svg`;
  const svg = p.cat === 'capping'
    ? generateCapping(id, p.w, p.h)
    : generateRect(id, p.cat, p.w, p.h);
  writeFileSync(join(OUT_DIR, filename), svg, 'utf-8');
  console.log(`  ✓ ${filename}`);
}

console.log(`\nGenerated ${PROFILES.length} profile SVGs in ${OUT_DIR}`);
