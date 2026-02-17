import { useState, useMemo } from "react";

const STYLES = {
  standard_vertical: "Standard Vertical",
  vertical_lapped: "Vertical Lapped",
  hit_and_miss: "Hit & Miss",
  horizontal_slat: "Horizontal Slat",
};

const COLORS = {
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

function FenceElevation({
  height = 1800,
  postSpacing = 2400,
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
  const undergroundDepth = Math.round(height / 3);
  const postLength = height + undergroundDepth;
  const totalFenceWidth = postSpacing * bays + postWidth;

  // SVG coordinate system: we'll work in mm then scale
  // Always use full dimensions (including underground) so SVG height is stable between views
  const padding = { top: 60, right: 80, bottom: 80, left: 80 };
  const svgContentW = totalFenceWidth;
  // Capping at real scale (19mm on 1800mm) is invisible — use a visual minimum
  const capVisual = Math.max(capHeight, height * 0.025); // always calculated for layout
  const svgContentH = capVisual + height + undergroundDepth; // always includes cap space

  const viewW = svgContentW + padding.left + padding.right;
  const viewH = svgContentH + padding.top + padding.bottom;

  const groundY = padding.top + height + capVisual;
  const topY = padding.top + capVisual;
  const capTopY = padding.top; // capping sits above fence, only drawn if showCapping

  // Rail positions — top rail flush with top of fence (capping sits on it), bottom rail near base
  const railPositions = [];
  const bottomInset = 150; // mm from ground
  if (railCount === 1) {
    railPositions.push(topY + height / 2 - railHeight / 2);
  } else if (railCount === 2) {
    railPositions.push(topY); // top rail flush
    railPositions.push(topY + height - bottomInset - railHeight);
  } else {
    for (let i = 0; i < railCount; i++) {
      const t = i / (railCount - 1);
      railPositions.push(topY + t * (height - bottomInset - railHeight));
    }
  }

  const posts = [];
  for (let i = 0; i <= bays; i++) {
    posts.push(padding.left + i * postSpacing);
  }

  // Paling generation per bay
  function generatePalings(bayIndex) {
    const bayLeft = padding.left + postWidth + bayIndex * postSpacing;
    const bayWidth = postSpacing - postWidth;
    const palings = [];

    if (style === "standard_vertical") {
      const effectiveWidth = palingWidth + gap;
      const count = Math.ceil(bayWidth / effectiveWidth);
      for (let i = 0; i < count; i++) {
        const x = bayLeft + i * effectiveWidth;
        const w = Math.min(palingWidth, bayLeft + bayWidth - x);
        if (w > 0) {
          palings.push({ x, y: topY, w, h: height, layer: "front" });
        }
      }
    } else if (style === "vertical_lapped") {
      const effectiveWidth = palingWidth - overlap + gap;
      const count = Math.ceil(bayWidth / effectiveWidth) + 1;
      for (let i = 0; i < count; i++) {
        const x = bayLeft + i * effectiveWidth;
        const w = Math.min(palingWidth, bayLeft + bayWidth - x);
        if (w > 0 && x < bayLeft + bayWidth) {
          palings.push({ x, y: topY, w, h: height, layer: "front" });
        }
      }
    } else if (style === "hit_and_miss") {
      // Back boards spaced with gaps, front boards bridge the gaps
      // Gap between back boards = palingWidth - 2*overlap
      const backGap = palingWidth - 2 * overlap;
      const backStep = palingWidth + backGap; // centre-to-start of next back board
      // Back boards
      const backCount = Math.ceil(bayWidth / backStep) + 1;
      for (let i = 0; i < backCount; i++) {
        const x = bayLeft + i * backStep;
        const w = Math.min(palingWidth, bayLeft + bayWidth - x);
        if (w > 0 && x < bayLeft + bayWidth) {
          palings.push({ x, y: topY, w, h: height, layer: "back" });
        }
      }
      // Front boards — each bridges a gap, overlapping back boards on either side
      const frontCount = Math.ceil(bayWidth / backStep);
      for (let i = 0; i < frontCount; i++) {
        const x = bayLeft + palingWidth - overlap + i * backStep;
        const w = Math.min(palingWidth, bayLeft + bayWidth - x);
        if (w > 0 && x < bayLeft + bayWidth) {
          palings.push({ x, y: topY, w, h: height, layer: "front" });
        }
      }
    } else if (style === "horizontal_slat") {
      const effectiveHeight = boardWidth + boardGap;
      const rowCount = Math.floor(height / effectiveHeight);
      const startY = topY + (height - rowCount * effectiveHeight + boardGap) / 2;
      for (let r = 0; r < rowCount; r++) {
        const y = startY + r * effectiveHeight;
        palings.push({ x: bayLeft, y, w: bayWidth, h: boardWidth, layer: "front" });
      }
    }

    return palings;
  }

  // Front view: continuous palings across full fence width (they cover post faces)
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
      // Back boards
      const backCount = Math.ceil(fenceWidth / backStep) + 1;
      for (let i = 0; i < backCount; i++) {
        const x = fenceLeft + i * backStep;
        const w = Math.min(palingWidth, fenceLeft + fenceWidth - x);
        if (w > 0 && x < fenceLeft + fenceWidth) palings.push({ x, y: topY, w, h: height, layer: "back" });
      }
      // Front boards bridging gaps
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

  // Dimension lines helper
  function DimH({ x1, x2, y, label, above = true }) {
    const endLen = 8;
    const offset = above ? -20 : 20;
    const textY = above ? y + offset - 4 : y + offset + 12;
    return (
      <g>
        <line x1={x1} y1={y + offset - endLen} x2={x1} y2={y + offset + endLen} stroke={COLORS.dimLine} strokeWidth={1.5} />
        <line x1={x2} y1={y + offset - endLen} x2={x2} y2={y + offset + endLen} stroke={COLORS.dimLine} strokeWidth={1.5} />
        <line x1={x1} y1={y + offset} x2={x2} y2={y + offset} stroke={COLORS.dimLine} strokeWidth={1.5} />
        <text x={(x1 + x2) / 2} y={textY} textAnchor="middle" fontSize="28" fill={COLORS.dimText} fontFamily="Calibri, sans-serif" fontWeight="600">
          {label}
        </text>
      </g>
    );
  }

  function DimV({ x, y1, y2, label, left = true }) {
    const endLen = 8;
    const offset = left ? -20 : 20;
    const textX = left ? x + offset - 8 : x + offset + 8;
    return (
      <g>
        <line x1={x + offset - endLen} y1={y1} x2={x + offset + endLen} y2={y1} stroke={COLORS.dimLine} strokeWidth={1.5} />
        <line x1={x + offset - endLen} y1={y2} x2={x + offset + endLen} y2={y2} stroke={COLORS.dimLine} strokeWidth={1.5} />
        <line x1={x + offset} y1={y1} x2={x + offset} y2={y2} stroke={COLORS.dimLine} strokeWidth={1.5} />
        <text x={textX} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="28" fill={COLORS.dimText} fontFamily="Calibri, sans-serif" fontWeight="600"
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

      {/* Ground */}
      {viewSide === "front" ? (
        <>
          <rect x={0} y={groundY} width={viewW} height={viewH - groundY} fill={COLORS.grass} />
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
        </>
      ) : (
        <>
          <rect x={0} y={groundY} width={viewW} height={viewH - groundY} fill={COLORS.ground} />
          <rect x={0} y={groundY} width={viewW} height={4} fill={COLORS.grass} />
          {/* Ground texture lines */}
          {[...Array(6)].map((_, i) => (
            <line key={`gt${i}`} x1={padding.left - 40 + i * (totalFenceWidth / 5)}
              y1={groundY + 30 + (i % 2) * 20} x2={padding.left + i * (totalFenceWidth / 5)}
              y2={groundY + 50 + (i % 3) * 15} stroke={COLORS.groundDark} strokeWidth={1.5} opacity={0.3} />
          ))}
        </>
      )}

      {/* Underground post portions — back view only */}
      {viewSide === "back" && posts.map((px, i) => (
        <rect key={`upost${i}`} x={px} y={groundY} width={postWidth} height={undergroundDepth}
          fill={COLORS.underground} stroke={COLORS.postStroke} strokeWidth={2} opacity={0.6} />
      ))}

      {/* Concrete footings hint — back view only */}
      {viewSide === "back" && posts.map((px, i) => (
        <ellipse key={`foot${i}`} cx={px + postWidth / 2} cy={groundY + undergroundDepth * 0.6}
          rx={postWidth * 0.9} ry={undergroundDepth * 0.18}
          fill="#999" opacity={0.15} />
      ))}

      {/* Back palings (hit & miss) — only visible from front */}
      {viewSide === "front" && backPalings.map((p, i) => (
        <rect key={`bp${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingBack} stroke={COLORS.palingBackStroke} strokeWidth={1.5} />
      ))}

      {/* === BACK VIEW: palings as thin edge strips behind rails === */}
      {viewSide === "back" && frontPalings.map((p, i) => (
        <rect key={`bpe${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingBack} stroke={COLORS.palingBackStroke} strokeWidth={1} opacity={0.4} />
      ))}
      {viewSide === "back" && backPalings.map((p, i) => (
        <rect key={`bbe${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} opacity={0.5} />
      ))}

      {/* Rails — only visible from back view (cladding covers them from front) */}
      {viewSide === "back" && posts.slice(0, -1).map((px, bi) =>
        railPositions.map((ry, ri) => (
          <rect key={`rail${bi}_${ri}`} x={px + postWidth} y={ry}
            width={postSpacing - postWidth} height={railHeight}
            fill={COLORS.rail} stroke={COLORS.railStroke}
            strokeWidth={2.5} />
        ))
      )}

      {/* === FRONT VIEW: palings fully opaque on top === */}
      {viewSide === "front" && frontPalings.map((p, i) => (
        <rect key={`fp${i}`} x={p.x} y={p.y} width={p.w} height={p.h}
          fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} />
      ))}

      {/* Posts (above ground) — back view only, palings cover them from front */}
      {viewSide === "back" && posts.map((px, i) => (
        <rect key={`post${i}`} x={px} y={topY} width={postWidth} height={height}
          fill={COLORS.post} stroke={COLORS.postStroke} strokeWidth={2.5} />
      ))}

      {/* Rail nailing indicators on back view — show where rails meet posts */}
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

      {/* Dimension: post spacing (first bay) — back view only */}
      {viewSide === "back" && (
        <DimH x1={padding.left + postWidth / 2} x2={padding.left + postSpacing + postWidth / 2}
          y={groundY + undergroundDepth + 10} label={`${postSpacing}mm centres`} above={false} />
      )}

      {/* Style label */}
      <text x={viewW / 2} y={24} textAnchor="middle" fontSize="24" fill={COLORS.dimText}
        fontFamily="Calibri, sans-serif" fontWeight="600" letterSpacing="0.5">
        {STYLES[style]} — {viewSide === "front" ? "Front" : "Back"} View — {bays} {bays === 1 ? "bay" : "bays"}
      </text>
    </svg>
  );
}

// ==============================
// PLAN CROSS-SECTION VIEW
// ==============================
// Horizontal slice through fence at rail height, looking down
// X axis = along the fence, Y axis = front-to-back (front = top)
// Thickness dimension exaggerated so layering is visible

function FenceCrossSection({
  style = "standard_vertical",
  palingWidth = 150,
  palingThickness = 19,
  gap = 0,
  overlap = 25,
  railWidth = 90,
  railThickness = 45,
}) {
  const font = "Calibri, sans-serif";
  // Use proportional sizes - exaggerate thickness slightly for readability
  const pw = palingWidth * 0.34;  // paling width along fence
  const pt = 10;                   // paling thickness (real ratio ~8:1, this is ~5:1 for readability)
  const g = gap * 0.34;
  const ol = overlap * 0.34;
  const railDepth = 24;            // rail front-to-back visual size

  const svgW = 520;
  const svgH = 160;
  const railCentreY = svgH / 2 + 20;

  // Rail: centred vertically, runs full width
  const railY = railCentreY - railDepth / 2;
  const railFrontY = railY; // front face of rail
  const railX = 40;
  const railW = svgW - 80;

  // Board starting position along fence
  const startX = railX + 20;

  // Collect board rectangles: { x, y, w, h, z }
  // x/w = position along fence, y/h = front-to-back position, z = draw order
  const boards = [];

  if (style === "standard_vertical") {
    const step = pw + g;
    for (let i = 0; i < 6; i++) {
      const x = startX + i * step;
      if (x + pw > railX + railW) break;
      boards.push({ x, y: railFrontY - pt, w: pw, h: pt, z: 0 });
    }
  } else if (style === "vertical_lapped") {
    // Going left to right, each board's LEFT edge sits in front of the previous board's right edge
    // Right edge sits against the rail, left edge is one board-thickness forward
    const step = pw - ol; // exposed width per board
    for (let i = 0; i < 8; i++) {
      const x = startX + i * step;
      if (x + pw > railX + railW + ol) break;
      boards.push({ x, y: railFrontY - pt, w: pw, h: pt, z: i, lapped: true, first: i === 0 });
    }
  } else if (style === "hit_and_miss") {
    // Back layer: against rail, with gaps
    // Front layer: in front of back layer, bridging gaps, overlapping edges
    const backGap = pw - 2 * ol;
    const backStep = pw + backGap;

    // Back layer — flat against rail front face
    for (let i = 0; i < 5; i++) {
      const x = startX + i * backStep;
      if (x + pw > railX + railW) break;
      boards.push({ x, y: railFrontY - pt, w: pw, h: pt, z: 0 });
    }
    // Front layer — sitting in front of back layer
    for (let i = 0; i < 4; i++) {
      const x = startX + pw - ol + i * backStep;
      if (x + pw > railX + railW) break;
      boards.push({ x, y: railFrontY - 2 * pt, w: pw, h: pt, z: 1 });
    }
  }
  // No cross-section for horizontal slat — nothing meaningful to show

  if (boards.length === 0) return null;

  const sorted = [...boards].sort((a, b) => a.z - b.z);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "auto", maxHeight: 180 }}>
      <rect x={0} y={0} width={svgW} height={svgH} fill="#FAFBFC" rx={4} />

      {/* Title */}
      <text x={svgW / 2} y={16} textAnchor="middle" fontSize={12} fill="#475569" fontFamily={font} fontWeight={700}>
        Cross Section — Plan View (looking down)
      </text>

      {/* Front/Back labels */}
      <text x={14} y={railFrontY - pt * 2 - 8} fontSize={10} fill="#94A3B8" fontFamily={font} fontWeight={600}>FRONT</text>
      <text x={14} y={railY + railDepth + 18} fontSize={10} fill="#94A3B8" fontFamily={font} fontWeight={600}>BACK</text>

      {/* Rail */}
      <rect x={railX} y={railY} width={railW} height={railDepth} fill={COLORS.rail} stroke={COLORS.railStroke} strokeWidth={1.5} rx={2} />
      <text x={railX + railW / 2} y={railY + railDepth / 2 + 4} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={600} fontFamily={font}>
        RAIL
      </text>

      {/* Boards in z-order */}
      {sorted.map((b, i) => {
        const fill = b.z > 0 && !b.lapped ? COLORS.palingBack : COLORS.palingFront;
        const stroke = b.z > 0 && !b.lapped ? COLORS.palingBackStroke : COLORS.palingFrontStroke;

        if (b.lapped) {
          if (b.first) {
            // First board: flat against rail
            return (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
                fill={COLORS.palingFront} stroke={COLORS.palingFrontStroke} strokeWidth={1} rx={1} />
            );
          }
          // Left edge kicks forward (sits on previous board), right edge against rail
          // Uniform thickness throughout - parallelogram
          const kickOut = pt + 1; // one board thickness forward
          const points = [
            `${b.x},${b.y - kickOut}`,             // top-left (front face, kicked forward)
            `${b.x + b.w},${b.y}`,                  // top-right (front face, against rail)
            `${b.x + b.w},${b.y + b.h}`,            // bottom-right (back face, against rail)
            `${b.x},${b.y + b.h - kickOut}`,        // bottom-left (back face, kicked forward)
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
        // Overlap zone: board 1's left edge sits on board 0's right edge
        const b0 = boards[0], b1 = boards[1];
        const kickOut = pt + 1;
        const olStart = b1.x;
        const olEnd = b0.x + b0.w;
        const dy = b1.y - kickOut - 10; // above the kicked-out left edge
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
        // Overlap on the left side of the front board
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

      {/* Paling width dimension on first board */}
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

      {/* Style note */}
      {style === "vertical_lapped" && (
        <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily={font}>
          Each board's edge laps over the previous — all on same side of rail
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

// Mini pattern icons for style selector
function StylePatternIcon({ type, active }) {
  const wood = active ? "#D4A44A" : "#C4A060";
  const woodStroke = active ? "#B8882E" : "#A08050";
  const woodBack = active ? "#BF9040" : "#B09058";
  const post = active ? "#9E7520" : "#8E7040";
  const rail = active ? "#8B6518" : "#7E6530";
  const ground = active ? "#A0D070" : "#C0C8C0";

  // Two posts
  const p1x = 8, p2x = 82, pw = 8, py = 8, ph = 48;
  const gy = 56;

  // Rails
  const rails = (
    <>
      <rect x={p1x + pw} y={16} width={p2x - p1x - pw} height={4} fill={rail} rx={0.5} />
      <rect x={p1x + pw} y={42} width={p2x - p1x - pw} height={4} fill={rail} rx={0.5} />
    </>
  );

  return (
    <g>
      {/* Ground strip */}
      <rect x={0} y={gy} width={100} height={14} fill={ground} />

      {type === "standard_vertical" && (
        <>
          {rails}
          {/* Evenly spaced palings */}
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
          {/* Lapped: each board edge sits over the previous — all same side */}
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
          {/* Back boards with gaps */}
          {[...Array(4)].map((_, i) => {
            const x = p1x + pw + 2 + i * 16;
            return x + 7 <= p2x ? (
              <rect key={`b${i}`} x={x} y={py + 1} width={7} height={ph - 2} fill={woodBack} stroke={woodStroke} strokeWidth={0.4} rx={0.3} />
            ) : null;
          })}
          {/* Front boards bridging gaps, overlapping back board edges */}
          {[...Array(3)].map((_, i) => {
            const x = p1x + pw + 2 + 7 - 2 + i * 16; // starts at first back board right edge minus lap
            return x + 7 <= p2x ? (
              <rect key={`f${i}`} x={x} y={py} width={7} height={ph} fill={wood} stroke={woodStroke} strokeWidth={0.5} rx={0.3} />
            ) : null;
          })}
        </>
      )}

      {type === "horizontal_slat" && (
        <>
          {/* Horizontal boards */}
          {[...Array(6)].map((_, i) => {
            const y = py + 2 + i * 8;
            return (
              <rect key={i} x={p1x + pw + 1} y={y} width={p2x - p1x - pw - 1} height={5.5}
                fill={wood} stroke={woodStroke} strokeWidth={0.5} rx={0.3} />
            );
          })}
        </>
      )}

      {/* Posts always on top */}
      <rect x={p1x} y={py} width={pw} height={ph + 6} fill={post} rx={0.5} />
      <rect x={p2x} y={py} width={pw} height={ph + 6} fill={post} rx={0.5} />
    </g>
  );
}

// ==============================
// INTERACTIVE DEMO WRAPPER
// ==============================
export default function FencePreviewDemo() {
  const [style, setStyle] = useState("standard_vertical");
  const [height, setHeight] = useState(1800);
  const [postSpacing, setPostSpacing] = useState(2400);
  const [gap, setGap] = useState(0);
  const [overlap, setOverlap] = useState(25);
  const [boardGap, setBoardGap] = useState(15);
  const [railCount, setRailCount] = useState(3);
  const [showCapping, setShowCapping] = useState(true);
  const [bays, setBays] = useState(2);
  const [palingWidth, setPalingWidth] = useState(150);
  const [viewSide, setViewSide] = useState("front");

  const undergroundDepth = Math.round(height / 3);
  const postLength = height + undergroundDepth;
  const postCountPerSection = (sectionLengthM) => Math.ceil((sectionLengthM * 1000) / postSpacing) + 1;

  // Paling count for one bay
  const palingsPerBay = useMemo(() => {
    const bayWidth = postSpacing - 100; // minus post width
    if (style === "standard_vertical") return Math.ceil(bayWidth / (palingWidth + gap));
    if (style === "vertical_lapped") return Math.ceil(bayWidth / (palingWidth - overlap + gap)) + 1;
    if (style === "hit_and_miss") {
      const backGap = palingWidth - 2 * overlap;
      const backStep = palingWidth + backGap;
      const back = Math.ceil(bayWidth / backStep) + 1;
      const front = Math.ceil(bayWidth / backStep);
      return back + front;
    }
    if (style === "horizontal_slat") {
      const rows = Math.floor(height / (150 + boardGap));
      return rows; // per bay, these are cuts not palings
    }
    return 0;
  }, [style, postSpacing, palingWidth, gap, overlap, height, boardGap]);

  return (
    <div style={{ fontFamily: "Calibri, -apple-system, sans-serif", maxWidth: 900, margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>Fence Elevation Preview</h2>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Live preview of one section of fence. Adjust parameters below.</p>

      {/* View toggle + Preview */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0", padding: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 12 }}>
          <button onClick={() => setViewSide("front")}
            style={{
              padding: "6px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              borderRadius: "6px 0 0 6px", border: "2px solid #E2E8F0", borderRight: "1px solid #E2E8F0",
              background: viewSide === "front" ? "#1E3A5F" : "#fff",
              color: viewSide === "front" ? "#fff" : "#475569",
            }}>
            Front View
          </button>
          <button onClick={() => setViewSide("back")}
            style={{
              padding: "6px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              borderRadius: "0 6px 6px 0", border: "2px solid #E2E8F0", borderLeft: "1px solid #E2E8F0",
              background: viewSide === "back" ? "#1E3A5F" : "#fff",
              color: viewSide === "back" ? "#fff" : "#475569",
            }}>
            Back View
          </button>
        </div>
        <FenceElevation
          height={height}
          postSpacing={postSpacing}
          railCount={railCount}
          palingWidth={palingWidth}
          gap={style === "horizontal_slat" ? 0 : gap}
          overlap={overlap}
          boardWidth={150}
          boardGap={boardGap}
          style={style}
          showCapping={showCapping}
          bays={bays}
          viewSide={viewSide}
        />
      </div>

      {/* Cladding style selector + cross section */}
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 16, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
          {Object.entries(STYLES).map(([key, label]) => {
            const isActive = style === key;
            return (
              <button key={key} onClick={() => setStyle(key)}
                style={{
                  flex: 1, padding: 0, cursor: "pointer", border: "none", borderBottom: isActive ? "3px solid #D97706" : "3px solid transparent",
                  background: isActive ? "#FFF7ED" : "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  transition: "all 0.15s ease",
                }}>
                <svg viewBox="0 0 100 70" width={90} height={58} style={{ display: "block", marginTop: 6 }}>
                  <rect x={0} y={0} width={100} height={70} fill={isActive ? "#FFF7ED" : "#FAFAFA"} />
                  <StylePatternIcon type={key} active={isActive} />
                </svg>
                <div style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 0 6px",
                  color: isActive ? "#D97706" : "#64748B",
                }}>
                  {label}
                </div>
              </button>
            );
          })}
        </div>
        {/* Cross section content */}
        <div style={{ minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px" }}>
          {style !== "horizontal_slat" ? (
            <FenceCrossSection
              style={style}
              palingWidth={palingWidth}
              gap={gap}
              overlap={overlap}
            />
          ) : (
            <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
              No cross section for horizontal slat — boards run flat between posts
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={lbl}>
          <span>Finished Height</span>
          <select value={height} onChange={e => { setHeight(+e.target.value); setRailCount(+e.target.value > 1500 ? 3 : 2); }} style={sel}>
            {[900, 1200, 1500, 1800, 2100].map(h => <option key={h} value={h}>{h}mm</option>)}
          </select>
        </label>

        <label style={lbl}>
          <span>Post Spacing</span>
          <select value={postSpacing} onChange={e => setPostSpacing(+e.target.value)} style={sel}>
            {[1800, 2100, 2400, 2700, 3000].map(s => <option key={s} value={s}>{s}mm</option>)}
          </select>
        </label>

        <label style={lbl}>
          <span>Paling Width</span>
          <select value={palingWidth} onChange={e => setPalingWidth(+e.target.value)} style={sel}>
            {[100, 125, 150, 175, 200].map(w => <option key={w} value={w}>{w}mm</option>)}
          </select>
        </label>

        <label style={lbl}>
          <span>Rails</span>
          <select value={railCount} onChange={e => setRailCount(+e.target.value)} style={sel}>
            {[2, 3, 4].map(n => <option key={n} value={n}>{n} rails</option>)}
          </select>
        </label>

        {(style === "standard_vertical" || style === "hit_and_miss") && (
          <label style={lbl}>
            <span>Gap Between Palings</span>
            <select value={gap} onChange={e => setGap(+e.target.value)} style={sel}>
              {[0, 5, 10, 15, 20, 25].map(g => <option key={g} value={g}>{g}mm</option>)}
            </select>
          </label>
        )}

        {style === "vertical_lapped" && (
          <label style={lbl}>
            <span>Overlap</span>
            <select value={overlap} onChange={e => setOverlap(+e.target.value)} style={sel}>
              {[15, 20, 25, 30, 40].map(o => <option key={o} value={o}>{o}mm</option>)}
            </select>
          </label>
        )}

        {style === "horizontal_slat" && (
          <label style={lbl}>
            <span>Slat Gap</span>
            <select value={boardGap} onChange={e => setBoardGap(+e.target.value)} style={sel}>
              {[5, 10, 15, 20, 25, 30].map(g => <option key={g} value={g}>{g}mm</option>)}
            </select>
          </label>
        )}

        <label style={lbl}>
          <span>Bays Shown</span>
          <select value={bays} onChange={e => setBays(+e.target.value)} style={sel}>
            {[1, 2, 3].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        <label style={{ ...lbl, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={showCapping} onChange={e => setShowCapping(e.target.checked)} />
          <span>Show Capping</span>
        </label>
      </div>

      {/* Summary stats */}
      <div style={{ marginTop: 16, padding: 12, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Per Bay Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <Stat label="Post Length" value={`${postLength}mm`} sub={`${height}mm + ${undergroundDepth}mm underground`} />
          <Stat label="Rails / Bay" value={railCount} sub={`at ${postSpacing - 100}mm spans`} />
          <Stat label={style === "horizontal_slat" ? "Rows / Bay" : "Palings / Bay"} value={palingsPerBay}
            sub={style === "hit_and_miss" ? "front + back" : style === "horizontal_slat" ? `${150}×${postSpacing - 100}mm cuts` : `${palingWidth}mm wide`} />
          <Stat label="Capping" value={showCapping ? "Yes" : "No"} sub={showCapping ? "full length" : ""} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#94A3B8" }}>{sub}</div>}
    </div>
  );
}

const lbl = {
  display: "flex", flexDirection: "column", gap: 4,
  fontSize: 12, fontWeight: 600, color: "#475569",
};
const sel = {
  padding: "6px 10px", borderRadius: 6, border: "1px solid #E2E8F0",
  fontSize: 13, color: "#1E293B", background: "#fff",
};
