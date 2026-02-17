// ============================================
// WALL FRAME PREVIEW — SVG Wireframe Elevation
// ============================================

const WALL_COLORS = {
  bottomPlate: '#6B4226',
  topPlate: '#6B4226',
  fullStud: '#A07828',
  trimmerStud: '#2563EB',
  jackStud: '#0D9488',
  lintel: '#BE185D',
  sillTrimmer: '#EA580C',
  crippleAbove: '#65A30D',
  crippleBelow: '#65A30D',
  dwang: '#7C3AED',
  openingFill: 'rgba(59, 130, 246, 0.06)',
  openingStroke: 'rgba(59, 130, 246, 0.25)',
};

// Colours for cutting plan component groups (matches preview colours)
export const COMPONENT_COLORS = {
  plates: WALL_COLORS.bottomPlate,
  studs: WALL_COLORS.fullStud,
  trimmers: WALL_COLORS.trimmerStud,
  jacks: WALL_COLORS.jackStud,
  lintels: WALL_COLORS.lintel,
  sills: WALL_COLORS.sillTrimmer,
  cripples: WALL_COLORS.crippleAbove,
  dwangs: WALL_COLORS.dwang,
};

export const LEGEND = [
  { label: 'Plates', color: WALL_COLORS.bottomPlate, countFn: s => s.bottomPlates + s.topPlates },
  { label: 'Studs', color: WALL_COLORS.fullStud, countFn: s => s.fullStuds },
  { label: 'Trimmers', color: WALL_COLORS.trimmerStud, countFn: s => s.trimmerStuds },
  { label: 'Jacks', color: WALL_COLORS.jackStud, countFn: s => s.jackStuds },
  { label: 'Lintels', color: WALL_COLORS.lintel, countFn: s => s.lintels },
  { label: 'Sills', color: WALL_COLORS.sillTrimmer, countFn: s => s.sillTrimmers },
  { label: 'Cripples', color: WALL_COLORS.crippleAbove, countFn: s => s.crippleStudsAbove + s.crippleStudsBelow },
  { label: 'Dwangs', color: WALL_COLORS.dwang, countFn: s => s.dwangs },
];

function colorForType(type) {
  return WALL_COLORS[type] || '#888';
}

function DimH({ x1, x2, y, label, above = true }) {
  const endLen = 8;
  const offset = above ? -20 : 20;
  const textY = above ? y + offset - 4 : y + offset + 12;
  return (
    <g>
      <line x1={x1} y1={y + offset - endLen} x2={x1} y2={y + offset + endLen} stroke="#64748B" strokeWidth={1} />
      <line x1={x2} y1={y + offset - endLen} x2={x2} y2={y + offset + endLen} stroke="#64748B" strokeWidth={1} />
      <line x1={x1} y1={y + offset} x2={x2} y2={y + offset} stroke="#64748B" strokeWidth={1} />
      <text x={(x1 + x2) / 2} y={textY} textAnchor="middle" fontSize="11" fill="#475569" fontFamily="Calibri, sans-serif" fontWeight="600">
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label, left = true }) {
  const endLen = 8;
  const offset = left ? -20 : 20;
  const textX = left ? x + offset - 10 : x + offset + 10;
  return (
    <g>
      <line x1={x + offset - endLen} y1={y1} x2={x + offset + endLen} y2={y1} stroke="#64748B" strokeWidth={1} />
      <line x1={x + offset - endLen} y1={y2} x2={x + offset + endLen} y2={y2} stroke="#64748B" strokeWidth={1} />
      <line x1={x + offset} y1={y1} x2={x + offset} y2={y2} stroke="#64748B" strokeWidth={1} />
      <text x={textX} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="11" fill="#475569" fontFamily="Calibri, sans-serif" fontWeight="600"
        transform={`rotate(-90, ${textX}, ${(y1 + y2) / 2})`}>
        {label}
      </text>
    </g>
  );
}

export function WallElevation({ wall, openings, frameData }) {
  if (!frameData || !wall.length || !wall.height) return null;

  const { allMembers } = frameData;
  const studDepth = wall.studDepth || 45;

  const padding = { top: 40, right: 40, bottom: 40, left: 80 };
  const totalFrameH = frameData.wallHeight;

  // Scale: fit within reasonable SVG dimensions
  const scale = Math.min(1, 1200 / wall.length, 600 / totalFrameH);
  const sW = wall.length * scale;
  const sH = totalFrameH * scale;

  const viewW = sW + padding.left + padding.right;
  const viewH = sH + padding.top + padding.bottom;

  // Transform: bottom plate at bottom, Y inverted (SVG y=0 is top)
  const tx = (m) => padding.left + m.x * scale;
  const ty = (m) => padding.top + sH - (m.y + m.h) * scale;
  const tw = (m) => m.w * scale;
  const th = (m) => m.h * scale;

  // Opening zones (floor-referenced: sillHeight and height are from floor)
  const openingRects = openings.map((o, i) => {
    const ox = padding.left + o.position * scale;
    const sillY = o.type === 'door' ? 0 : o.sillHeight;
    const topOfOpening = o.type === 'door' ? o.height : o.sillHeight + o.height;
    const oy = padding.top + sH - topOfOpening * scale;
    const ow = o.width * scale;
    const oh = (topOfOpening - sillY) * scale;
    return (
      <g key={`opening-${i}`}>
        <rect x={ox} y={oy} width={ow} height={oh}
          fill={WALL_COLORS.openingFill} stroke={WALL_COLORS.openingStroke} strokeWidth={1} strokeDasharray="4,3" />
        <text x={ox + ow / 2} y={oy + oh / 2 + 4} textAnchor="middle" fontSize="10" fill="#3B82F6" fontFamily="Calibri, sans-serif" fontWeight="600">
          {o.type === 'door' ? 'Door' : 'Window'} {o.width}×{o.height}
        </text>
      </g>
    );
  });

  // Render order: back to front (openings → nogs → plates → studs → lintels)
  const renderOrder = ['dwang', 'bottomPlate', 'topPlate', 'fullStud', 'crippleAbove', 'crippleBelow', 'trimmerStud', 'jackStud', 'sillTrimmer', 'lintel'];

  const sortedMembers = [...allMembers].sort((a, b) => {
    const ai = renderOrder.indexOf(a.type);
    const bi = renderOrder.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} style={{ width: '100%', height: 'auto', maxHeight: '400px' }}>
      {/* Background */}
      <rect x={0} y={0} width={viewW} height={viewH} fill="#FAFBFC" />

      {/* Opening zones */}
      {openingRects}

      {/* Members */}
      {sortedMembers.map((m, i) => (
        <rect
          key={`m-${i}`}
          x={tx(m)}
          y={ty(m)}
          width={Math.max(1, tw(m))}
          height={Math.max(1, th(m))}
          fill={colorForType(m.type)}
          stroke={colorForType(m.type)}
          strokeWidth={0.5}
          opacity={0.85}
        />
      ))}

      {/* Dimension: wall length */}
      <DimH
        x1={padding.left}
        x2={padding.left + sW}
        y={padding.top + sH + studDepth * scale}
        label={`${wall.length}mm`}
        above={false}
      />

      {/* Dimension: wall height */}
      <DimV
        x={padding.left - 5}
        y1={padding.top + sH - (studDepth + wall.height) * scale}
        y2={padding.top + sH - studDepth * scale}
        label={`${wall.height}mm`}
        left={true}
      />

      {/* Opening dimensions */}
      {openings.map((o, i) => {
        const ox = padding.left + o.position * scale;
        const ow = o.width * scale;
        const topOfOpening = o.type === 'door' ? o.height : o.sillHeight + o.height;
        const oy = padding.top + sH - topOfOpening * scale;
        return (
          <DimH key={`odim-${i}`}
            x1={ox} x2={ox + ow}
            y={oy}
            label={`${o.width}mm`}
            above={true}
          />
        );
      })}

    </svg>
  );
}
