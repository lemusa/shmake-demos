// ============================================
// CUTTING STOCK OPTIMIZER - PURE ALGORITHM
// No React dependencies - can be used anywhere
//
// Two-phase approach:
//   1. Greedy FFD (First Fit Decreasing) — fast baseline, no cut limit
//   2. Branch-and-bound over cutting patterns — optimal for small inputs
// ============================================

/**
 * Fill a stock piece using First Fit Decreasing (greedy bin-packing):
 * iterate through available cuts (pre-sorted largest-first),
 * add each cut if it fits. No limit on cuts per stock.
 */
function fillStockGreedy(stockLength, availableCuts, kerf) {
  let usedLength = 0;
  const pickedCuts = [];
  const pool = [...availableCuts]; // already sorted descending

  let i = 0;
  while (i < pool.length) {
    const kerfNeeded = pickedCuts.length > 0 ? kerf : 0;
    if (usedLength + kerfNeeded + pool[i] <= stockLength) {
      pickedCuts.push(pool[i]);
      usedLength += kerfNeeded + pool[i];
      pool.splice(i, 1);
    } else {
      i++;
    }
  }

  if (pickedCuts.length === 0) return null;

  const cutTotal = pickedCuts.reduce((s, c) => s + c, 0);
  return {
    cuts: pickedCuts,
    total: cutTotal,
    waste: stockLength - usedLength,
    efficiency: cutTotal / stockLength,
  };
}

/**
 * Enumerate all feasible cutting patterns for one stock length.
 * A pattern is an array of counts per distinct cut group that fits in the stock.
 */
function generatePatterns(stockLength, cutGroups, kerf) {
  const patterns = [];
  const n = cutGroups.length;
  const counts = new Array(n).fill(0);

  function recurse(idx) {
    const totalCuts = counts.reduce((s, c) => s + c, 0);
    if (totalCuts > 0) {
      const cutLenSum = cutGroups.reduce((s, g, i) => s + counts[i] * g.length, 0);
      if (cutLenSum + (totalCuts - 1) * kerf > stockLength) return;
    }

    if (idx >= n) {
      if (totalCuts > 0) {
        const cutLenSum = cutGroups.reduce((s, g, i) => s + counts[i] * g.length, 0);
        patterns.push({
          counts: [...counts],
          cutTotal: cutLenSum,
          totalCuts,
        });
      }
      return;
    }

    for (let c = 0; ; c++) {
      counts[idx] = c;
      const tc = counts.reduce((s, x) => s + x, 0);
      if (tc > 0) {
        const cl = cutGroups.reduce((s, g, i) => s + counts[i] * g.length, 0);
        if (cl + (tc - 1) * kerf > stockLength) break;
      }
      recurse(idx + 1);
    }
    counts[idx] = 0;
  }

  recurse(0);
  return patterns;
}

/**
 * Main cutting optimization algorithm
 *
 * @param {Object} params
 * @param {Array} params.stockLengths - Available stock: [{ length, cost?, available? }]
 * @param {Array} params.requiredCuts - Required cuts: [{ length, qty }]
 * @param {number} params.minOffcut - Minimum usable offcut length (default 0)
 * @param {number} params.kerf - Saw blade width (default 0)
 * @param {number} params.endTrim - Unusable mm at each end of stock (default 0)
 *
 * @returns {Object} { success, error, plan, summary, unplaceableCuts }
 */
export function calculateCuttingPlan({
  stockLengths,
  requiredCuts,
  minOffcut = 0,
  kerf = 0,
  endTrim = 0,
}) {
  if (!stockLengths?.length || !requiredCuts?.length) {
    return {
      success: false,
      error: 'Need at least one stock length and one cut',
      plan: [],
      summary: null,
    };
  }

  // Normalize stock lengths and apply end trim
  const normalizedStock = stockLengths
    .map((s) => {
      const rawLength = typeof s === 'number' ? s : s.length;
      return {
        rawLength,
        length: rawLength - endTrim * 2,
        available: typeof s === 'number' ? null : (s.available ?? null),
        cost: typeof s === 'number' ? 0 : (s.cost ?? 0),
      };
    })
    .sort((a, b) => a.length - b.length);

  // Expand required cuts into individual pieces
  const allCuts = [];
  requiredCuts.forEach((cut) => {
    for (let i = 0; i < cut.qty; i++) {
      allCuts.push(cut.length);
    }
  });
  allCuts.sort((a, b) => b - a);

  // Check for impossible cuts
  const maxStock = Math.max(...normalizedStock.map((s) => s.length));
  const impossibleCut = allCuts.find((c) => c > maxStock);
  if (impossibleCut) {
    return {
      success: false,
      error: `Cut ${impossibleCut}mm exceeds max usable stock ${maxStock}mm`,
      plan: [],
      summary: null,
    };
  }

  // Group distinct cut lengths (for pattern generation)
  const cutGroupMap = {};
  const cutGroups = [];
  allCuts.forEach((len) => {
    if (!cutGroupMap[len]) {
      cutGroupMap[len] = { length: len, qty: 0 };
      cutGroups.push(cutGroupMap[len]);
    }
    cutGroupMap[len].qty++;
  });
  cutGroups.sort((a, b) => b.length - a.length);

  // ---- Phase 1: Greedy FFD baseline ----
  function runGreedy() {
    const stockState = normalizedStock.map((s) => ({ ...s, used: 0 }));
    let remaining = [...allCuts];
    const completed = [];

    while (remaining.length > 0) {
      let bestChoice = null;
      let bestScore = -Infinity;

      for (const stock of stockState) {
        if (stock.available !== null && stock.used >= stock.available) continue;
        const fill = fillStockGreedy(stock.length, remaining, kerf);
        if (!fill) continue;
        const score =
          fill.efficiency * 1000 +
          ((maxStock - stock.length) / maxStock) * 50 +
          (fill.cuts.length > 1 ? 20 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestChoice = { stock, fill };
        }
      }

      if (bestChoice) {
        bestChoice.stock.used++;
        completed.push({
          rawStockLength: bestChoice.stock.rawLength,
          stockLength: bestChoice.stock.length,
          stockCost: bestChoice.stock.cost,
          cuts: bestChoice.fill.cuts.map((c) => ({ target: c, actual: c })),
          remaining: bestChoice.fill.waste,
        });
        const toRemove = [...bestChoice.fill.cuts];
        remaining = remaining.filter((cut) => {
          const idx = toRemove.indexOf(cut);
          if (idx !== -1) {
            toRemove.splice(idx, 1);
            return false;
          }
          return true;
        });
      } else {
        return { completed, unplaceable: remaining };
      }
    }
    return { completed, unplaceable: [] };
  }

  const greedy = runGreedy();

  // ---- Phase 2: Branch-and-bound (small inputs only) ----
  let bestCompleted = greedy.completed;
  let bestUnplaceable = greedy.unplaceable;

  const hasLimitedStock = normalizedStock.some((s) => s.available !== null);
  const canBacktrack =
    cutGroups.length <= 8 &&
    allCuts.length <= 200 &&
    !hasLimitedStock &&
    greedy.unplaceable.length === 0;

  if (canBacktrack) {
    const hasCosts = normalizedStock.some((s) => s.cost > 0);

    // Generate patterns per stock size
    const stockWithPatterns = normalizedStock
      .map((stock) => ({
        ...stock,
        effectiveCost: hasCosts ? stock.cost : stock.length,
        patterns: generatePatterns(stock.length, cutGroups, kerf),
      }))
      .filter((sp) => sp.patterns.length > 0);

    if (stockWithPatterns.length > 0) {
      // Flatten into (stock, pattern) pairs sorted by efficiency desc
      const flatPatterns = [];
      for (const sp of stockWithPatterns) {
        for (const pattern of sp.patterns) {
          flatPatterns.push({
            stock: sp,
            pattern,
            efficiency: pattern.cutTotal / sp.length,
          });
        }
      }
      flatPatterns.sort((a, b) => b.efficiency - a.efficiency);

      // Greedy cost as initial upper bound
      const greedyCost = greedy.completed.reduce((s, piece) => {
        const stock = normalizedStock.find(
          (st) => st.rawLength === piece.rawStockLength
        );
        return s + (hasCosts ? stock?.cost || 0 : stock?.length || 0);
      }, 0);

      const remaining = cutGroups.map((g) => g.qty);
      let bestCost = greedyCost + 0.001; // beat greedy
      let bestBtPlan = null;
      let nodes = 0;
      const NODE_LIMIT = 50000;
      const cheapestPerMm = Math.min(
        ...stockWithPatterns.map((sp) => sp.effectiveCost / sp.length)
      );

      (function backtrack(currentCost, plan) {
        nodes++;
        if (nodes > NODE_LIMIT) return;

        // All cuts placed?
        if (remaining.every((r) => r <= 0)) {
          if (currentCost < bestCost) {
            bestCost = currentCost;
            bestBtPlan = plan.map((p) => ({ ...p }));
          }
          return;
        }

        // Lower bound pruning
        const totalRemLen = cutGroups.reduce(
          (s, g, i) => s + Math.max(0, remaining[i]) * g.length,
          0
        );
        if (currentCost + totalRemLen * cheapestPerMm >= bestCost) return;

        // Must cover the first unmet cut group (symmetry breaking)
        const firstNeed = remaining.findIndex((r) => r > 0);
        if (firstNeed < 0) return;

        for (const fp of flatPatterns) {
          if (fp.pattern.counts[firstNeed] === 0) continue;

          const maxRep = Math.min(
            ...cutGroups.map((_, j) =>
              fp.pattern.counts[j] > 0
                ? Math.floor(remaining[j] / fp.pattern.counts[j])
                : Infinity
            )
          );
          if (maxRep <= 0 || !isFinite(maxRep)) continue;

          for (let rep = maxRep; rep >= 1; rep--) {
            cutGroups.forEach(
              (_, j) => (remaining[j] -= fp.pattern.counts[j] * rep)
            );
            plan.push({ fp, qty: rep });

            backtrack(currentCost + fp.stock.effectiveCost * rep, plan);

            cutGroups.forEach(
              (_, j) => (remaining[j] += fp.pattern.counts[j] * rep)
            );
            plan.pop();

            if (nodes > NODE_LIMIT) return;
          }
        }
      })(0, []);

      // Convert backtracking result to completedStock format
      if (bestBtPlan) {
        const btCompleted = [];
        for (const entry of bestBtPlan) {
          for (let q = 0; q < entry.qty; q++) {
            const cuts = [];
            cutGroups.forEach((g, j) => {
              for (let k = 0; k < entry.fp.pattern.counts[j]; k++) {
                cuts.push(g.length);
              }
            });
            const totalCutLen = cuts.reduce((s, c) => s + c, 0);
            const totalKerf =
              cuts.length > 1 ? (cuts.length - 1) * kerf : 0;
            btCompleted.push({
              rawStockLength: entry.fp.stock.rawLength,
              stockLength: entry.fp.stock.length,
              stockCost: entry.fp.stock.cost,
              cuts: cuts.map((c) => ({ target: c, actual: c })),
              remaining: entry.fp.stock.length - totalCutLen - totalKerf,
            });
          }
        }
        bestCompleted = btCompleted;
        bestUnplaceable = [];
      }
    }
  }

  // ---- Build final plan ----
  const plan = bestCompleted
    .map((stock) => {
      const totalCutLength = stock.cuts.reduce(
        (sum, c) => sum + c.actual,
        0
      );
      const totalKerf =
        stock.cuts.length > 1 ? (stock.cuts.length - 1) * kerf : 0;
      const offcut = stock.stockLength - totalCutLength - totalKerf;

      return {
        rawStockLength: stock.rawStockLength,
        stockLength: stock.stockLength,
        stockCost: stock.stockCost,
        cuts: [...stock.cuts],
        kerfLoss: totalKerf,
        offcut: Math.max(0, offcut),
        isUsableOffcut: offcut >= minOffcut,
        efficiency: ((totalCutLength / stock.stockLength) * 100).toFixed(1),
      };
    })
    .sort((a, b) => b.rawStockLength - a.rawStockLength);

  // Calculate summary statistics
  const stockUsed = {};
  let totalPieces = 0;
  let totalStockLength = 0;
  let totalCutLength = 0;
  let totalKerfLoss = 0;
  let usableOffcuts = 0;
  let scrap = 0;
  let totalStockCost = 0;

  plan.forEach((piece) => {
    stockUsed[piece.rawStockLength] =
      (stockUsed[piece.rawStockLength] || 0) + 1;
    totalPieces++;
    totalStockLength += piece.stockLength;
    totalCutLength += piece.cuts.reduce((sum, c) => sum + c.actual, 0);
    totalKerfLoss += piece.kerfLoss;
    totalStockCost += piece.stockCost;
    if (piece.isUsableOffcut) {
      usableOffcuts += piece.offcut;
    } else {
      scrap += piece.offcut;
    }
  });

  return {
    success: bestUnplaceable.length === 0,
    error:
      bestUnplaceable.length > 0
        ? `Could not place ${bestUnplaceable.length} cuts`
        : null,
    plan,
    unplaceableCuts: bestUnplaceable,
    summary: {
      stockUsed,
      totalPieces,
      totalStockLength,
      totalCutLength,
      totalKerfLoss,
      totalWaste: totalStockLength - totalCutLength,
      usableOffcuts,
      scrap,
      totalStockCost,
      overallEfficiency:
        totalStockLength > 0
          ? ((totalCutLength / totalStockLength) * 100).toFixed(1)
          : '0.0',
    },
  };
}

/**
 * Group identical cutting patterns for display
 * e.g., 5 pieces with the same cuts become "5× 2450mm: 1200 + 1200"
 */
export function groupCuttingPatterns(plan) {
  const grouped = [];

  plan.forEach((piece) => {
    const signature = `${piece.rawStockLength}|${piece.cuts
      .map((c) => c.actual)
      .sort((a, b) => b - a)
      .join(',')}`;

    const existing = grouped.find((g) => g.signature === signature);
    if (existing) {
      existing.qty++;
    } else {
      grouped.push({ ...piece, signature, qty: 1 });
    }
  });

  // Sort by stock length (descending), then by first cut (descending)
  grouped.sort((a, b) =>
    b.rawStockLength !== a.rawStockLength
      ? b.rawStockLength - a.rawStockLength
      : (b.cuts[0]?.actual || 0) - (a.cuts[0]?.actual || 0)
  );

  return grouped;
}

// ============================================
// UNIT CONVERSION HELPERS
// ============================================

export const UNITS = {
  mm: { label: 'mm', toMm: 1, decimals: 0 },
  m: { label: 'm', toMm: 1000, decimals: 3 },
  inch: { label: 'in', toMm: 25.4, decimals: 2 },
  foot: { label: 'ft', toMm: 304.8, decimals: 3 },
};

/**
 * Convert mm to display value in given unit
 */
export function toDisplayValue(mm, unit) {
  const config = UNITS[unit];
  if (mm === 0) return '';
  return Number((mm / config.toMm).toFixed(config.decimals));
}

/**
 * Convert display value to mm
 */
export function toMmValue(value, unit) {
  const config = UNITS[unit];
  if (value === '' || value === null || isNaN(value)) return 0;
  return Math.round(value * config.toMm);
}

/**
 * Format length with unit label
 */
export function formatLength(mm, unit, autoUpgrade = false) {
  let targetUnit = unit;

  // Auto-upgrade to larger unit when sensible
  if (autoUpgrade) {
    if (unit === 'mm' && mm >= 1000) {
      targetUnit = 'm';
    } else if (unit === 'inch' && mm >= 304.8) { // 12 inches = 1 foot
      targetUnit = 'foot';
    }
  }

  const config = UNITS[targetUnit];
  return `${(mm / config.toMm).toFixed(config.decimals)}${config.label}`;
}
