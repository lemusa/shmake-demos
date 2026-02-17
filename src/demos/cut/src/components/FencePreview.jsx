// ============================================
// FENCE PREVIEW COMPONENTS
// Extracted from docs/FencePreview.jsx
// No standalone demo wrapper — used by FencingCalculator
// ============================================

export const COLORS = {
  post: "#8B6914",
  postStroke: "#6B4F10",
  rail: "#A07828",
  railStroke: "#7A5A1C",
  palingFront: "#C4A35A",
  palingFrontStroke: "#9E8040",
  palingBack: "#B8944A",
  palingBackStroke: "#8E7038",
  cap: "#A07828",
  capStroke: "#7A5A1C",
  ground: "#8B7355",
  groundDark: "#6B5540",
  underground: "#5C4A3A",
  dirt: "#A08B6E",
  grass: "#6B8E4E",
  sky: "#E8F0F8",
  gridLine: "#D0D8E0",
  dimLine: "#64748B",
  dimText: "#475569",
};

export function FenceElevation({
  height = 1800,
  undergroundDepth: undergroundDepthProp = null,
  postSpacing = 2400,
  lastBayWidth: lastBayWidthProp = null,
  postWidth = 100,
  postDepth = 100,
  railWidth = 90,
  railHeight = 45,
  railCount = 3,
  palingWidth = 150,
  palingThickness = 19,
  gap = 0,
  overlap = 25,
  boardWidth = 150,
  boardGap = 15,
  style = "standard_vertical",
  showCapping = true,
  capHeight = 19,
  bays = 2,
  viewSide = "front",
}) {
  const undergroundDepth = undergroundDepthProp != null ? undergroundDepthProp : Math.round(height / 3);
  const lastBayWidth = lastBayWidthProp != null ? lastBayWidthProp : postSpacing;

  // Build bay widths array — all equal except possibly the last
  const bayWidths = [];
  for (let i = 0; i < bays; i++) {
    bayWidths.push(i < bays - 1 ? postSpacing : lastBayWidth);
  }
  const totalFenceWidth = bayWidths.reduce((s, w) => s + w, 0) + postWidth;

  const padding = { top: 60, right: 80, bottom: 120, left: 260 };
  const svgContentW = totalFenceWidth;
  const capVisual = Math.max(capHeight, height * 0.025);
  const svgContentH = capVisual + height + undergroundDepth;

  const viewW = svgContentW + padding.left + padding.right;
  const viewH = svgContentH + padding.top + padding.bottom;

  const groundY = padding.top + height + capVisual;
  const topY = padding.top + capVisual;
  const capTopY = padding.top;

  const railPositions = [];
  const bottomInset = 150;
  if (railCount === 1) {
    railPositions.push(topY + height / 2 - railHeight / 2);
  } else if (railCount === 2) {
    railPositions.push(topY);
    railPositions.push(topY + height - bottomInset - railHeight);
  } else {
    for (let i = 0; i < railCount; i++) {
      const t = i / (railCount - 1);
      railPositions.push(topY + t * (height - bottomInset - railHeight));
    }
  }

  const posts = [padding.left];
  for (let i = 0; i < bays; i++) {
    posts.push(posts[i] + bayWidths[i]);
  }

  function generatePalings(bayIndex) {
    const bayLeft = posts[bayIndex] + postWidth;
    const bw = bayWidths[bayIndex] - postWidth;
    const palings = [];

    if (style === "standard_vertical") {
      const effectiveWidth = palingWidth + gap;
      const count = Math.ceil(bw / effectiveWidth);
      for (let i = 0; i < count; i++) {
        const x = bayLeft + i * effectiveWidth;
        const w = Math.min(palingWidth, bayLeft + bw - x);
        if (w > 0) palings.push({ x, y: topY, w, h: height, layer: "front" });
      }
    } else if (style === "vertical_lapped") {
      const effectiveWidth = palingWidth - overlap + gap;
      const count = Math.ceil(bw / effectiveWidth) + 1;
      for (let i = 0; i < count; i++) {
        const x = bayLeft + i * effectiveWidth;
        const w = Math.min(palingWidth, bayLeft + bw - x);
        if (w > 0 && x < bayLeft + bw) palings.push({ x, y: topY, w, h: height, layer: "front" });
      }
    } else if (style === "hit_and_miss") {
      const backGap = palingWidth - 2 * overlap;
      const backStep = palingWidth + backGap;
      const backCount = Math.ceil(bw / backStep) + 1;
      for (let i = 0; i < backCount; i++) {
        const x = bayLeft + i * backStep;
        const w = Math.min(palingWidth, bayLeft + bw - x);
        if (w > 0 && x < bayLeft + bw) palings.push({ x, y: topY, w, h: height, layer: "back" });
      }
      const frontCount = Math.ceil(bw / backStep);
      for (let i = 0; i < frontCount; i++) {
        const x = bayLeft + palingWidth - overlap + i * backStep;
        const w = Math.min(palingWidth, bayLeft + bw - x);
        if (w > 0 && x < bayLeft + bw) palings.push({ x, y: topY, w, h: height, layer: "front" });
      }
    } else if (style === "horizontal_slat") {
      const effectiveHeight = boardWidth + boardGap;
      const rowCount = Math.floor(height / effectiveHeight);
      const startY = topY + (height - rowCount * effectiveHeight + boardGap) / 2;
      for (let r = 0; r < rowCount; r++) {
        const y = startY + r * effectiveHeight;
        palings.push({ x: bayLeft, y, w: bw, h: boardWidth, layer: "front" });
      }
    }

    return palings;
  }

  function generateContinuousPalings() {
    const fenceLeft = padding.left;
    const fenceWidth = totalFenceWidth;
    const palings = [];

    if (style === "standard_vertical") {
      const effectiveWidth = palingWidth + gap;
      const count = Math.ceil(fenceWidth / effectiveWidth);
      for (let i = 0; i < count; i++) {
        const x = fenceLeft + i * effectiveWidth;
        const w = Math.min(palingWidth, fenceLeft + fenceWidth - x);
        if (w > 0) palings.push({ x, y: topY, w, h: height, layer: "front" });
      }
    } else if (style === "vertical_lapped") {
      const effectiveWidth = palingWidth - overlap + gap;
      const count = Math.ceil(fenceWidth / effectiveWidth) + 1;
      for (let i = 0; i < count; i++) {
        const x = fenceLeft + i * effectiveWidth;
        const w = Math.min(palingWidth, fenceLeft + fenceWidth - x);
        if (w > 0 && x < fenceLeft + fenceWidth) palings.push({ x, y: topY, w, h: height, layer: "front" });
      }
    } else if (style === "hit_and_miss") {
      const backGap = palingWidth - 2 * overlap;
      const backStep = palingWidth + backGap;
      const backCount = Math.ceil(fenceWidth / backStep) + 1;
      for (let i = 0; i < backCount; i++) {
        const x = fenceLeft + i * backStep;
        const w = Math.min(palingWidth, fenceLeft + fenceWidth - x);
        if (w > 0 && x < fenceLeft + fenceWidth) palings.push({ x, y: topY, w, h: height, layer: "back" });
      }
      const frontCount = Math.ceil(fenceWidth / backStep);
      for (let i = 0; i < frontCount; i++) {
        const x = fenceLeft + palingWidth - overlap + i * backStep;
        const w = Math.min(palingWidth, fenceLeft + fenceWidth - x);
        if (w > 0 && x < fenceLeft + fenceWidth) palings.push({ x, y: topY, w, h: height, layer: "front" });
      }
    } else if (style === "horizontal_slat") {
      const effectiveHeight = boardWidth + boardGap;
      const rowCount = Math.floor(height / effectiveHeight);
      const startY = topY + (height - rowCount * effectiveHeight + boardGap) / 2;
      for (let r = 0; r < rowCount; r++) {
        const y = startY + r * effectiveHeight;
        palings.push({ x: fenceLeft, y, w: fenceWidth, h: boardWidth, layer: "front" });
      }
    }

    return palings;
  }

  const allPalings = viewSide === "front" ? generateContinuousPalings() : (() => {
    const p = [];
    for (let b = 0; b < bays; b++) p.push(...generatePalings(b));
    return p;
  })();

  const backPalings = allPalings.filter(p => p.layer === "back");
  const frontPalings = allPalings.filter(p => p.layer === "front");

  function DimH({ x1, x2, y, label, above = true }) {
    const endLen = 24;
    const offset = above ? -50 : 50;
    const textY = above ? y + offset - 10 : y + offset + 28;
    return (
      <g>
        <line x1={x1} y1={y + offset - endLen} x2={x1} y2={y + offset + endLen} stroke={COLORS.dimLine} strokeWidth={5} />
        <line x1={x2} y1={y + offset - endLen} x2={x2} y2={y + offset + endLen} stroke={COLORS.dimLine} strokeWidth={5} />
        <line x1={x1} y1={y + offset} x2={x2} y2={y + offset} stroke={COLORS.dimLine} strokeWidth={4} />
        <text x={(x1 + x2) / 2} y={textY} textAnchor="middle" fontSize="90" fill="#1E293B" fontFamily="Calibri, sans-serif" fontWeight="800">
          {label}
        </text>
      </g>
    );
  }

  function DimV({ x, y1, y2, label, left = true }) {
    const endLen = 24;
    const offset = left ? -50 : 50;
    const textX = left ? x + offset - 30 : x + offset + 30;
    return (
      <g>
        <line x1={x + offset - endLen} y1={y1} x2={x + offset + endLen} y2={y1} stroke={COLORS.dimLine} strokeWidth={5} />
        <line x1={x + offset - endLen} y1={y2} x2={x + offset + endLen} y2={y2} stroke={COLORS.dimLine} strokeWidth={5} />
        <line x1={x + offset} y1={y1} x2={x + offset} y2={y2} stroke={COLORS.dimLine} strokeWidth={4} />
        <text x={textX} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="90" fill="#1E293B" fontFamily="Calibri, sans-serif" fontWeight="800"
          transform={`rotate(-90, ${textX}, ${(y1 + y2) / 2})`}>
          {label}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} style={{ width: "100%", height: "auto", maxHeight: "500px" }}>
      {/* Sky */}
      <rect x={0} y={0} width={viewW} height={groundY} fill={COLORS.sky} />

      {/* Ground: grass strip + dirt cross-section (both views) */}
      {(() => {
        const grassDepth = Math.min(100, undergroundDepth * 0.25);
        const grassBottom = groundY + grassDepth;
        return (
          <>
            {/* Grass strip */}
            <rect x={0} y={groundY} width={viewW} height={grassDepth} fill={COLORS.grass} />
            <rect x={0} y={groundY} width={viewW} height={4} fill="#4A7A30" />
            {/* Grass tufts */}
            {[...Array(12)].map((_, i) => {
              const gx = padding.left - 60 + i * (totalFenceWidth / 10);
              const gy = groundY - 2;
              return (
                <g key={`tuft${i}`} opacity={0.5}>
                  <line x1={gx} y1={gy + 4} x2={gx - 6} y2={gy - 8} stroke="#5A8E3E" strokeWidth={2} strokeLinecap="round" />
                  <line x1={gx + 4} y1={gy + 4} x2={gx + 4} y2={gy - 10} stroke="#4A7A30" strokeWidth={2} strokeLinecap="round" />
                  <line x1={gx + 10} y1={gy + 4} x2={gx + 14} y2={gy - 6} stroke="#5A8E3E" strokeWidth={2} strokeLinecap="round" />
                </g>
              );
            })}
            {/* Dirt below grass */}
            <rect x={0} y={grassBottom} width={viewW} height={viewH - grassBottom} fill={COLORS.ground} />
            <rect x={0} y={grassBottom} width={viewW} height={2} fill={COLORS.groundDark} opacity={0.4} />
            {/* Dirt texture */}
            {[...Array(6)].map((_, i) => (
              <line key={`gt${i}`} x1={padding.left - 40 + i * (totalFenceWidth / 5)}
                y1={grassBottom + 20 + (i % 2) * 20} x2={padding.left + i * (totalFenceWidth / 5)}
                y2={grassBottom + 40 + (i % 3) * 15} stroke={COLORS.groundDark} strokeWidth={1.5} opacity={0.2} />
            ))}
            {/* Underground posts */}
            {posts.map((px, i) => (
              <rect key={`upost${i}`} x={px} y={groundY} width={postWidth} height={undergroundDepth}
                fill={COLORS.underground} stroke={COLORS.postStroke} strokeWidth={2} opacity={0.6} />
            ))}
            {/* Concrete footings */}
            {posts.map((px, i) => (
              <ellipse key={`foot${i}`} cx={px + postWidth / 2} cy={groundY + undergroundDepth * 0.6}
                rx={postWidth * 0.9} ry={undergroundDepth * 0.18}
                fill="#999" opacity={0.15} />
            ))}
          </>
        );
      })()}

      {/* Back palings (hit & miss) — only visible from front */}
      {viewSide === "front" && backPalings.map((p, i) => (
        <rect key={`bp${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingBack} stroke={COLORS.palingBackStroke} strokeWidth={1.5} />
      ))}

      {/* Back view: palings as thin edge strips behind rails */}
      {viewSide === "back" && frontPalings.map((p, i) => (
        <rect key={`bpe${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingBack} stroke={COLORS.palingBackStroke} strokeWidth={1} opacity={0.4} />
      ))}
      {viewSide === "back" && backPalings.map((p, i) => (
        <rect key={`bbe${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} opacity={0.5} />
      ))}

      {/* Rails — only visible from back view */}
      {viewSide === "back" && posts.slice(0, -1).map((px, bi) =>
        railPositions.map((ry, ri) => (
          <rect key={`rail${bi}_${ri}`} x={px + postWidth} y={ry}
            width={bayWidths[bi] - postWidth} height={railHeight}
            fill={COLORS.rail} stroke={COLORS.railStroke}
            strokeWidth={2.5} />
        ))
      )}

      {/* Front view: palings fully opaque on top */}
      {viewSide === "front" && frontPalings.map((p, i) => (
        <rect key={`fp${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} />
      ))}

      {/* Posts (above ground) — back view only */}
      {viewSide === "back" && posts.map((px, i) => (
        <rect key={`post${i}`} x={px} y={topY} width={postWidth} height={height}
          fill={COLORS.post} stroke={COLORS.postStroke} strokeWidth={2.5} />
      ))}

      {/* Rail nailing indicators — back view */}
      {viewSide === "back" && posts.map((px, pi) =>
        railPositions.map((ry, ri) => {
          const nailY = ry + railHeight / 2;
          return (
            <g key={`nail${pi}_${ri}`}>
              <circle cx={px + postWidth / 2 - 12} cy={nailY} r={4} fill="#333" opacity={0.5} />
              <circle cx={px + postWidth / 2 + 12} cy={nailY} r={4} fill="#333" opacity={0.5} />
            </g>
          );
        })
      )}

      {/* Capping */}
      {showCapping && (
        <rect x={padding.left} y={capTopY} width={totalFenceWidth}
          height={capVisual} fill={COLORS.cap} stroke={COLORS.capStroke} strokeWidth={2} />
      )}

      {/* Ground line overlay — back view only */}
      {viewSide === "back" && (
        <line x1={0} y1={groundY} x2={viewW} y2={groundY} stroke={COLORS.groundDark} strokeWidth={2} />
      )}

      {/* Dimension: finished height */}
      <DimV x={padding.left - 10} y1={topY} y2={groundY} label={`${height}mm`} left={true} />

      {/* Dimension: underground — back view only */}
      {viewSide === "back" && (
        <DimV x={padding.left - 10} y1={groundY} y2={groundY + undergroundDepth} label={`${undergroundDepth}mm`} left={true} />
      )}

      {/* Dimension: post spacing — back view, one per distinct bay width */}
      {viewSide === "back" && (() => {
        const dimY = groundY + undergroundDepth + 10;
        // Show a dimension for each bay
        if (lastBayWidth !== postSpacing) {
          // Variable widths — label each bay
          return bayWidths.map((w, i) => (
            <DimH key={`dim${i}`}
              x1={posts[i] + postWidth / 2} x2={posts[i + 1] + postWidth / 2}
              y={dimY} label={`${w}mm`} above={false} />
          ));
        }
        // All equal — single dimension on first bay
        return (
          <DimH x1={posts[0] + postWidth / 2} x2={posts[1] + postWidth / 2}
            y={dimY} label={`${postSpacing}mm centres`} above={false} />
        );
      })()}
    </svg>
  );
}

// ==============================
// PLAN CROSS-SECTION VIEW
// ==============================

export function FenceCrossSection({
  style = "standard_vertical",
  palingWidth = 150,
  palingThickness = 19,
  gap = 0,
  overlap = 25,
  railWidth = 90,
  railThickness = 45,
}) {
  const font = "Calibri, sans-serif";
  const pw = palingWidth * 0.34;
  const pt = 10;
  const g = gap * 0.34;
  const ol = overlap * 0.34;
  const railDepth = 24;

  const svgW = 520;
  const svgH = 160;
  const railCentreY = svgH / 2 + 20;

  const railY = railCentreY - railDepth / 2;
  const railFrontY = railY;
  const railX = 40;
  const railW = svgW - 80;

  const startX = railX + 20;

  const boards = [];

  if (style === "standard_vertical") {
    const step = pw + g;
    for (let i = 0; i < 6; i++) {
      const x = startX + i * step;
      if (x + pw > railX + railW) break;
      boards.push({ x, y: railFrontY - pt, w: pw, h: pt, z: 0 });
    }
  } else if (style === "vertical_lapped") {
    const step = pw - ol;
    for (let i = 0; i < 8; i++) {
      const x = startX + i * step;
      if (x + pw > railX + railW + ol) break;
      boards.push({ x, y: railFrontY - pt, w: pw, h: pt, z: i, lapped: true, first: i === 0 });
    }
  } else if (style === "hit_and_miss") {
    const backGap = pw - 2 * ol;
    const backStep = pw + backGap;

    for (let i = 0; i < 5; i++) {
      const x = startX + i * backStep;
      if (x + pw > railX + railW) break;
      boards.push({ x, y: railFrontY - pt, w: pw, h: pt, z: 0 });
    }
    for (let i = 0; i < 4; i++) {
      const x = startX + pw - ol + i * backStep;
      if (x + pw > railX + railW) break;
      boards.push({ x, y: railFrontY - 2 * pt, w: pw, h: pt, z: 1 });
    }
  }

  if (boards.length === 0) return null;

  const sorted = [...boards].sort((a, b) => a.z - b.z);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "auto", maxHeight: 180 }}>
      <rect x={0} y={0} width={svgW} height={svgH} fill="#FAFBFC" rx={4} />

      <text x={svgW / 2} y={16} textAnchor="middle" fontSize={12} fill="#475569" fontFamily={font} fontWeight={700}>
        Cross Section — Plan View (looking down)
      </text>

      <text x={14} y={railFrontY - pt * 2 - 8} fontSize={10} fill="#94A3B8" fontFamily={font} fontWeight={600}>FRONT</text>
      <text x={14} y={railY + railDepth + 18} fontSize={10} fill="#94A3B8" fontFamily={font} fontWeight={600}>BACK</text>

      <rect x={railX} y={railY} width={railW} height={railDepth} fill={COLORS.rail} stroke={COLORS.railStroke} strokeWidth={1.5} rx={2} />
      <text x={railX + railW / 2} y={railY + railDepth / 2 + 4} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={600} fontFamily={font}>
        RAIL
      </text>

      {sorted.map((b, i) => {
        const fill = b.z > 0 && !b.lapped ? COLORS.palingBack : COLORS.palingFront;
        const stroke = b.z > 0 && !b.lapped ? COLORS.palingBackStroke : COLORS.palingFrontStroke;

        if (b.lapped) {
          if (b.first) {
            return (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
                fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} rx={1} />
            );
          }
          const kickOut = pt + 1;
          const points = [
            `${b.x},${b.y - kickOut}`,
            `${b.x + b.w},${b.y}`,
            `${b.x + b.w},${b.y + b.h}`,
            `${b.x},${b.y + b.h - kickOut}`,
          ].join(" ");
          return (
            <polygon key={i} points={points}
              fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} />
          );
        }

        return (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
            fill={fill} stroke={stroke} strokeWidth={1} rx={1} />
        );
      })}

      {/* Dimension annotations */}
      {style === "standard_vertical" && boards.length >= 2 && gap > 0 && (() => {
        const b1 = boards[0], b2 = boards[1];
        const gapX1 = b1.x + b1.w, gapX2 = b2.x;
        const dy = b1.y - 8;
        return (
          <g>
            <line x1={gapX1} y1={dy} x2={gapX2} y2={dy} stroke="#D97706" strokeWidth={2} />
            <line x1={gapX1} y1={dy - 4} x2={gapX1} y2={dy + 4} stroke="#D97706" strokeWidth={1.5} />
            <line x1={gapX2} y1={dy - 4} x2={gapX2} y2={dy + 4} stroke="#D97706" strokeWidth={1.5} />
            <text x={(gapX1 + gapX2) / 2} y={dy - 5} textAnchor="middle" fontSize={10} fill="#D97706" fontFamily={font} fontWeight={600}>
              {gap}mm
            </text>
          </g>
        );
      })()}

      {style === "vertical_lapped" && boards.length >= 2 && (() => {
        const b0 = boards[0], b1 = boards[1];
        const kickOut = pt + 1;
        const olStart = b1.x;
        const olEnd = b0.x + b0.w;
        const dy = b1.y - kickOut - 10;
        return (
          <g>
            <line x1={olStart} y1={dy} x2={olEnd} y2={dy} stroke="#D97706" strokeWidth={2} />
            <line x1={olStart} y1={dy - 4} x2={olStart} y2={dy + 4} stroke="#D97706" strokeWidth={1.5} />
            <line x1={olEnd} y1={dy - 4} x2={olEnd} y2={dy + 4} stroke="#D97706" strokeWidth={1.5} />
            <text x={(olStart + olEnd) / 2} y={dy - 5} textAnchor="middle" fontSize={10} fill="#D97706" fontFamily={font} fontWeight={600}>
              {overlap}mm lap
            </text>
          </g>
        );
      })()}

      {style === "hit_and_miss" && boards.length >= 2 && (() => {
        const backLayer = boards.filter(b => b.z === 0);
        const frontLayer = boards.filter(b => b.z === 1);
        if (!backLayer.length || !frontLayer.length) return null;
        const bb = backLayer[0], fb = frontLayer[0];
        const olStart = fb.x;
        const olEnd = bb.x + bb.w;
        const dy = fb.y - 8;
        return (
          <g>
            <line x1={olStart} y1={dy} x2={olEnd} y2={dy} stroke="#D97706" strokeWidth={2} />
            <line x1={olStart} y1={dy - 4} x2={olStart} y2={dy + 4} stroke="#D97706" strokeWidth={1.5} />
            <line x1={olEnd} y1={dy - 4} x2={olEnd} y2={dy + 4} stroke="#D97706" strokeWidth={1.5} />
            <text x={(olStart + olEnd) / 2} y={dy - 5} textAnchor="middle" fontSize={10} fill="#D97706" fontFamily={font} fontWeight={600}>
              {overlap}mm lap (×2 per board)
            </text>
          </g>
        );
      })()}

      {style !== "horizontal_slat" && boards.length >= 1 && (() => {
        const b = boards[0];
        const dy = svgH - 14;
        return (
          <g>
            <line x1={b.x} y1={dy} x2={b.x + b.w} y2={dy} stroke={COLORS.dimLine} strokeWidth={1.5} />
            <line x1={b.x} y1={dy - 4} x2={b.x} y2={dy + 4} stroke={COLORS.dimLine} strokeWidth={1} />
            <line x1={b.x + b.w} y1={dy - 4} x2={b.x + b.w} y2={dy + 4} stroke={COLORS.dimLine} strokeWidth={1} />
            <text x={b.x + b.w / 2} y={dy - 5} textAnchor="middle" fontSize={10} fill={COLORS.dimText} fontFamily={font} fontWeight={600}>
              {palingWidth}mm wide × {palingThickness}mm thick
            </text>
          </g>
        );
      })()}

      {style === "vertical_lapped" && (
        <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily={font}>
          Each board&apos;s edge laps over the previous — all on same side of rail
        </text>
      )}
      {style === "hit_and_miss" && (
        <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily={font}>
          Two layers, same side of rail — front boards bridge gaps in back row
        </text>
      )}
    </svg>
  );
}

// ==============================
// MINI PATTERN ICONS
// ==============================

export function StylePatternIcon({ type, active }) {
  const wood = active ? "#D4A44A" : "#C4A060";
  const woodStroke = active ? "#B8882E" : "#A08050";
  const woodBack = active ? "#BF9040" : "#B09058";
  const post = active ? "#9E7520" : "#8E7040";
  const rail = active ? "#8B6518" : "#7E6530";
  const ground = active ? "#A0D070" : "#C0C8C0";

  const p1x = 8, p2x = 82, pw = 8, py = 8, ph = 48;
  const gy = 56;

  const rails = (
    <>
      <rect x={p1x + pw} y={16} width={p2x - p1x - pw} height={4} fill={rail} rx={0.5} />
      <rect x={p1x + pw} y={42} width={p2x - p1x - pw} height={4} fill={rail} rx={0.5} />
    </>
  );

  return (
    <svg viewBox="0 0 100 70" width={80} height={52} style={{ display: "block" }}>
      <rect x={0} y={0} width={100} height={70} fill={active ? "#FFF7ED" : "#FAFAFA"} />
      <rect x={0} y={gy} width={100} height={14} fill={ground} />

      {type === "standard_vertical" && (
        <>
          {rails}
          {[...Array(8)].map((_, i) => {
            const x = p1x + pw + 2 + i * 8.5;
            return x + 6 <= p2x ? (
              <rect key={i} x={x} y={py} width={6} height={ph} fill={wood} stroke={woodStroke} strokeWidth={0.5} rx={0.3} />
            ) : null;
          })}
        </>
      )}

      {type === "vertical_lapped" && (
        <>
          {rails}
          {[...Array(10)].map((_, i) => {
            const x = p1x + pw + 1 + i * 5.5;
            return x + 7 <= p2x + 2 ? (
              <rect key={i} x={x} y={py} width={7} height={ph}
                fill={i % 2 === 0 ? wood : woodBack}
                stroke={woodStroke} strokeWidth={0.5} rx={0.3} />
            ) : null;
          })}
        </>
      )}

      {type === "hit_and_miss" && (
        <>
          {rails}
          {[...Array(4)].map((_, i) => {
            const x = p1x + pw + 2 + i * 16;
            return x + 7 <= p2x ? (
              <rect key={`b${i}`} x={x} y={py + 1} width={7} height={ph - 2} fill={woodBack} stroke={woodStroke} strokeWidth={0.4} rx={0.3} />
            ) : null;
          })}
          {[...Array(3)].map((_, i) => {
            const x = p1x + pw + 2 + 7 - 2 + i * 16;
            return x + 7 <= p2x ? (
              <rect key={`f${i}`} x={x} y={py} width={7} height={ph} fill={wood} stroke={woodStroke} strokeWidth={0.5} rx={0.3} />
            ) : null;
          })}
        </>
      )}

      {type === "horizontal_slat" && (
        <>
          {[...Array(6)].map((_, i) => {
            const y = py + 2 + i * 8;
            return (
              <rect key={i} x={p1x + pw + 1} y={y} width={p2x - p1x - pw - 1} height={5.5}
                fill={wood} stroke={woodStroke} strokeWidth={0.5} rx={0.3} />
            );
          })}
        </>
      )}

      <rect x={p1x} y={py} width={pw} height={ph + 6} fill={post} rx={0.5} />
      <rect x={p2x} y={py} width={pw} height={ph + 6} fill={post} rx={0.5} />
    </svg>
  );
}
