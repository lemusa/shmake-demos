// ============================================
// WALL FRAMING CALCULATIONS
// Pure functions — no React dependencies
// ============================================

// ---- Presets ----

export const OPENING_PRESETS = [
  { label: 'Interior Door', type: 'door', width: 810, height: 2040 },
  { label: 'Exterior Door', type: 'door', width: 860, height: 2040 },
  { label: 'Ranch Slider', type: 'door', width: 1800, height: 2040 },
  { label: 'Std Window', type: 'window', width: 1200, height: 1200, sillHeight: 900 },
  { label: 'Small Window', type: 'window', width: 600, height: 600, sillHeight: 1200 },
];

// ---- Helpers ----

export function parseStudWidth(profile) {
  const match = profile?.match(/(\d+)\s*[x×]\s*\d+/i);
  return match ? parseInt(match[1]) : 90;
}

export function parseStudDepth(profile) {
  const match = profile?.match(/\d+\s*[x×]\s*(\d+)/i);
  return match ? parseInt(match[1]) : 45;
}

export function autoDwangRows(wallHeight) {
  const targetSpacing = 800; // ~800mm vertical centres
  return Math.max(1, Math.round(wallHeight / targetSpacing) - 1);
}

// ---- Validation ----

export function validateOpenings(wall, openings, studWidth = 45) {
  const errors = [];
  const sorted = [...openings].sort((a, b) => a.position - b.position);

  for (let i = 0; i < sorted.length; i++) {
    const o = sorted[i];
    // Framing extends 2*studWidth each side of the clear opening
    if (o.position - 2 * studWidth < 0) {
      errors.push(`${o.type} "${o.id}" framing extends past wall start`);
    }
    if (o.position + o.width + 2 * studWidth > wall.length) {
      errors.push(`${o.type} "${o.id}" framing extends past wall end`);
    }
    const topOfOpening = o.type === 'door' ? o.height : o.sillHeight + o.height;
    if (topOfOpening > wall.height) {
      errors.push(`${o.type} "${o.id}" is taller than wall height`);
    }
    // Check framing zone overlap with next opening
    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      if (o.position + o.width + 4 * studWidth > next.position) {
        errors.push(`Openings too close: "${o.id}" and "${next.id}"`);
      }
    }
  }
  return errors;
}

// ---- Plate splitting ----

/**
 * Split a plate member into segments that fit within maxLen,
 * breaking at stud grid positions so joints are supported.
 */
function splitPlateAtStuds(plate, maxLen, gridPositions) {
  if (plate.cutLength <= maxLen) return [plate];

  const pieces = [];
  let currentX = plate.x;
  let remaining = plate.cutLength;

  while (remaining > maxLen) {
    // Find the rightmost stud position within maxLen from currentX
    let splitAt = currentX + maxLen; // fallback
    for (const pos of gridPositions) {
      if (pos > currentX && pos - currentX <= maxLen) {
        splitAt = pos;
      }
    }
    const segLen = splitAt - currentX;
    if (segLen <= 0) break; // safety
    pieces.push({ ...plate, x: currentX, w: segLen, cutLength: segLen });
    currentX = splitAt;
    remaining -= segLen;
  }
  if (remaining > 0) {
    pieces.push({ ...plate, x: currentX, w: remaining, cutLength: remaining });
  }
  return pieces;
}

// ---- Core Computation ----

/**
 * Compute all wall frame members.
 *
 * Opening position/width define the CLEAR opening (e.g. 810mm door = 810mm clear space).
 * Trimmers and jacks sit OUTSIDE this clear zone.
 *
 * Layout per opening (from outside to inside):
 *   [Trimmer] [Jack] | CLEAR OPENING | [Jack] [Trimmer]
 *
 * DATUM: All opening dimensions (height, sillHeight) are FLOOR-REFERENCED (y=0 = floor).
 * The bottom plate occupies y=[0, studDepth]. Vertical members sitting on the plate
 * start at y=studDepth, so their CUT LENGTHS subtract studDepth from floor-referenced heights.
 *
 * @param {Object} wall - { length, height, studSpacing, doubleTopPlate, dwangRows, studWidth, studDepth, lintelDepth, maxPlateLength }
 * @param {Array} openings - [{ id, type, width, height, position, sillHeight }]
 * @returns {Object} members grouped by type, each with { x, y, w, h, cutLength }
 */
export function computeWallFrame(wall, openings) {
  const {
    length: wallLen,
    height: wallH,
    studSpacing,
    doubleTopPlate,
    dwangRows,
    studWidth,
    studDepth,
    lintelDepth = studWidth,
    maxPlateLength,
  } = wall;

  const sorted = [...openings].sort((a, b) => a.position - b.position);

  // Helper: check if x-centre falls inside any clear opening zone
  function isInsideClearOpening(xCentre) {
    return sorted.some(o => xCentre > o.position && xCentre < o.position + o.width);
  }

  // Helper: check if stud overlaps any opening's framing zone
  // (from left trimmer to right trimmer, i.e. 2*studWidth each side of clear opening)
  function isNearOpening(xCentre) {
    return sorted.some(o =>
      xCentre > o.position - 2 * studWidth && xCentre < o.position + o.width + 2 * studWidth
    );
  }

  // Helper: get stud grid positions
  function getStudGrid() {
    const positions = new Set();
    positions.add(0); // left end stud
    for (let x = studSpacing; x < wallLen; x += studSpacing) {
      positions.add(x);
    }
    positions.add(wallLen - studWidth); // right end stud
    return [...positions].sort((a, b) => a - b);
  }

  // ---- 1. Bottom plates ----
  // Plate runs under trimmers and jacks; gaps only at the clear door opening
  const bottomPlates = [];
  let plateStart = 0;
  const doors = sorted.filter(o => o.type === 'door');

  if (doors.length === 0) {
    bottomPlates.push({ x: 0, y: 0, w: wallLen, h: studDepth, cutLength: wallLen, type: 'bottomPlate' });
  } else {
    for (const door of doors) {
      const gapStart = door.position; // left edge of clear opening
      const gapEnd = door.position + door.width; // right edge of clear opening
      const segLen = gapStart - plateStart;
      if (segLen > 0) {
        bottomPlates.push({ x: plateStart, y: 0, w: segLen, h: studDepth, cutLength: segLen, type: 'bottomPlate' });
      }
      plateStart = gapEnd;
    }
    const remaining = wallLen - plateStart;
    if (remaining > 0) {
      bottomPlates.push({ x: plateStart, y: 0, w: remaining, h: studDepth, cutLength: remaining, type: 'bottomPlate' });
    }
  }

  // ---- 2. Top plates ----
  const topPlates = [];
  topPlates.push({ x: 0, y: wallH + studDepth, w: wallLen, h: studDepth, cutLength: wallLen, type: 'topPlate' });
  if (doubleTopPlate) {
    topPlates.push({ x: 0, y: wallH + studDepth * 2, w: wallLen, h: studDepth, cutLength: wallLen, type: 'topPlate' });
  }

  // ---- 2b. Split plates if they exceed max available stock ----
  const gridPositions = getStudGrid();

  if (maxPlateLength && maxPlateLength < wallLen) {
    const splitBottom = bottomPlates.flatMap(p => splitPlateAtStuds(p, maxPlateLength, gridPositions));
    bottomPlates.length = 0;
    bottomPlates.push(...splitBottom);

    const splitTop = topPlates.flatMap(p => splitPlateAtStuds(p, maxPlateLength, gridPositions));
    topPlates.length = 0;
    topPlates.push(...splitTop);
  }

  // ---- 3-4. Full studs & trimmer studs ----

  // Collect all special positions (trimmers + jacks) to exclude from grid studs
  const specialPositions = new Set();
  sorted.forEach(o => {
    specialPositions.add(o.position - 2 * studWidth); // left trimmer
    specialPositions.add(o.position + o.width + studWidth); // right trimmer
    specialPositions.add(o.position - studWidth); // left jack
    specialPositions.add(o.position + o.width); // right jack
  });

  const fullStuds = [];
  const trimmerStuds = [];

  for (const x of gridPositions) {
    if (specialPositions.has(x)) continue;
    const xCentre = x + studWidth / 2;
    if (isNearOpening(xCentre)) continue;
    fullStuds.push({
      x, y: studDepth, w: studWidth, h: wallH, cutLength: wallH, type: 'fullStud',
    });
  }

  // Trimmer studs (full height, outermost at each opening)
  sorted.forEach(o => {
    trimmerStuds.push({
      x: o.position - 2 * studWidth, y: studDepth, w: studWidth, h: wallH, cutLength: wallH, type: 'trimmerStud',
    });
    trimmerStuds.push({
      x: o.position + o.width + studWidth, y: studDepth, w: studWidth, h: wallH, cutLength: wallH, type: 'trimmerStud',
    });
  });

  // ---- 5. Jack studs (between trimmers and opening, support lintel) ----
  // Opening top is floor-referenced; jack sits on bottom plate so cut = openingTop - studDepth
  const jackStuds = [];
  sorted.forEach(o => {
    const openingTopFloor = o.type === 'door' ? o.height : o.sillHeight + o.height;
    const jackCutH = openingTopFloor - studDepth;
    // Left jack: between left trimmer and clear opening
    jackStuds.push({
      x: o.position - studWidth, y: studDepth, w: studWidth, h: jackCutH, cutLength: jackCutH, type: 'jackStud',
    });
    // Right jack: between clear opening and right trimmer
    jackStuds.push({
      x: o.position + o.width, y: studDepth, w: studWidth, h: jackCutH, cutLength: jackCutH, type: 'jackStud',
    });
  });

  // ---- 6. Lintels (sit on jack studs at floor-referenced opening top) ----
  const lintels = [];
  sorted.forEach(o => {
    const openingTopFloor = o.type === 'door' ? o.height : o.sillHeight + o.height;
    // Lintel spans from left jack to right jack (sits on top of jacks)
    const lintelW = o.width + 2 * studWidth;
    lintels.push({
      x: o.position - studWidth,
      y: openingTopFloor,
      w: lintelW,
      h: lintelDepth,
      cutLength: lintelW,
      type: 'lintel',
      openingId: o.id,
    });
  });

  // ---- 7. Sill trimmers (windows only, at floor-referenced sill height) ----
  const sillTrimmers = [];
  sorted.filter(o => o.type === 'window').forEach(o => {
    sillTrimmers.push({
      x: o.position,
      y: o.sillHeight,
      w: o.width,
      h: studDepth,
      cutLength: o.width,
      type: 'sillTrimmer',
      openingId: o.id,
    });
  });

  // ---- 8 & 9. Cripple studs ----
  // All vertical positions are floor-referenced; cut lengths subtract plate thickness
  const crippleStudsAbove = [];
  const crippleStudsBelow = [];
  const topPlateBottomY = studDepth + wallH; // underside of top plate (floor-referenced)

  sorted.forEach(o => {
    const openingTopFloor = o.type === 'door' ? o.height : o.sillHeight + o.height;
    const lintelTopY = openingTopFloor + lintelDepth; // top of lintel (floor-referenced)
    const crippleAboveH = topPlateBottomY - lintelTopY;

    // Cripple studs above: from top of lintel to underside of top plate
    for (const x of gridPositions) {
      const xCentre = x + studWidth / 2;
      if (xCentre > o.position && xCentre < o.position + o.width) {
        if (crippleAboveH > 0) {
          crippleStudsAbove.push({
            x, y: lintelTopY, w: studWidth, h: crippleAboveH, cutLength: crippleAboveH, type: 'crippleAbove',
          });
        }
      }
    }

    // Cripple studs below windows: from top of bottom plate to sill
    if (o.type === 'window' && o.sillHeight > studDepth) {
      const crippleBelowH = o.sillHeight - studDepth;
      for (const x of gridPositions) {
        const xCentre = x + studWidth / 2;
        if (xCentre > o.position && xCentre < o.position + o.width) {
          crippleStudsBelow.push({
            x, y: studDepth, w: studWidth, h: crippleBelowH, cutLength: crippleBelowH, type: 'crippleBelow',
          });
        }
      }
    }
  });

  // ---- 10. Dwangs (horizontal bracing between studs) ----
  const dwangs = [];
  const effectiveDwangRows = dwangRows != null ? dwangRows : autoDwangRows(wallH);

  if (effectiveDwangRows > 0) {
    for (let r = 1; r <= effectiveDwangRows; r++) {
      const dwangY = studDepth + (wallH / (effectiveDwangRows + 1)) * r;

      // Walk all vertical member positions pairwise
      const allVerticals = [...new Set([
        ...fullStuds.map(s => s.x),
        ...trimmerStuds.map(s => s.x),
        ...jackStuds.map(s => s.x),
        ...crippleStudsAbove.map(s => s.x),
        ...crippleStudsBelow.map(s => s.x),
      ])].sort((a, b) => a - b);

      for (let i = 0; i < allVerticals.length - 1; i++) {
        const leftX = allVerticals[i] + studWidth;
        const rightX = allVerticals[i + 1];
        const dwangLen = rightX - leftX;
        if (dwangLen <= 0) continue;

        // Skip dwangs inside clear opening zones (between sill and lintel, floor-referenced)
        const midX = (leftX + rightX) / 2;
        const insideOpeningZone = sorted.some(o => {
          if (midX <= o.position || midX >= o.position + o.width) return false;
          const sillY = o.type === 'window' ? o.sillHeight : studDepth; // doors: opening starts at top of plate
          const lintelY = o.type === 'door' ? o.height : o.sillHeight + o.height;
          return dwangY > sillY && dwangY < lintelY;
        });

        if (!insideOpeningZone) {
          dwangs.push({
            x: leftX, y: dwangY - studDepth / 2, w: dwangLen, h: studDepth, cutLength: dwangLen, type: 'dwang',
          });
        }
      }
    }
  }

  // ---- Aggregate ----
  const allMembers = [
    ...bottomPlates,
    ...topPlates,
    ...fullStuds,
    ...trimmerStuds,
    ...jackStuds,
    ...lintels,
    ...sillTrimmers,
    ...crippleStudsAbove,
    ...crippleStudsBelow,
    ...dwangs,
  ];

  // Summary counts
  const summary = {
    bottomPlates: bottomPlates.length,
    topPlates: topPlates.length,
    fullStuds: fullStuds.length,
    trimmerStuds: trimmerStuds.length,
    jackStuds: jackStuds.length,
    lintels: lintels.length,
    sillTrimmers: sillTrimmers.length,
    crippleStudsAbove: crippleStudsAbove.length,
    crippleStudsBelow: crippleStudsBelow.length,
    dwangs: dwangs.length,
    totalMembers: allMembers.length,
    effectiveDwangRows,
  };

  // Cut lists: plates and lintels separate (may use different timber),
  // all other framing combined with component tags for colour-coded display
  const plateCuts = [...bottomPlates, ...topPlates].map(m => m.cutLength);
  const lintelCuts = lintels.map(m => m.cutLength);
  const framingCuts = [
    ...fullStuds.map(m => ({ length: m.cutLength, component: 'studs' })),
    ...trimmerStuds.map(m => ({ length: m.cutLength, component: 'trimmers' })),
    ...jackStuds.map(m => ({ length: m.cutLength, component: 'jacks' })),
    ...sillTrimmers.map(m => ({ length: m.cutLength, component: 'sills' })),
    ...crippleStudsAbove.map(m => ({ length: m.cutLength, component: 'cripples' })),
    ...crippleStudsBelow.map(m => ({ length: m.cutLength, component: 'cripples' })),
    ...dwangs.map(m => ({ length: m.cutLength, component: 'dwangs' })),
  ];

  return {
    members: {
      bottomPlates,
      topPlates,
      fullStuds,
      trimmerStuds,
      jackStuds,
      lintels,
      sillTrimmers,
      crippleStudsAbove,
      crippleStudsBelow,
      dwangs,
    },
    allMembers,
    summary,
    cutLists: { plateCuts, framingCuts, lintelCuts },
    wallHeight: wallH + studDepth * (doubleTopPlate ? 3 : 2),
  };
}
