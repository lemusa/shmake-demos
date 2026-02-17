import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, X, ChevronDown, AlertTriangle, DoorOpen, Square, Ruler } from 'lucide-react';
import MiniProductSelector from './MiniProductSelector';
import {
  calculateCuttingPlan,
  groupCuttingPatterns,
  formatLength,
} from '../lib/cuttingAlgorithm';
import {
  getProductLabel,
  getProductsByCategory,
  WALL_CATEGORIES,
} from '../config/embedConfig';
import {
  computeWallFrame,
  validateOpenings,
  parseStudWidth,
  parseStudDepth,
  autoDwangRows,
  OPENING_PRESETS,
} from '../lib/wallCalculations';
import { WallElevation, LEGEND } from './WallPreview';

// ============================================
// HELPERS
// ============================================

function getStockCost(product, lengthMm) {
  const rate = product?.pricePerMeter || 0;
  return (lengthMm / 1000) * rate;
}

function filterLengths(lengths, maxStockLength) {
  if (!lengths || !maxStockLength) return lengths;
  const filtered = lengths.filter(l => l <= maxStockLength);
  return filtered.length > 0 ? filtered : lengths;
}

// ============================================
// WALL PANEL ROW
// ============================================

function WallPanelRow({ wall, onChange, onRemove, canRemove, isFocused, onFocus }) {
  return (
    <div
      className={`tc-fencing-section-row ${isFocused ? 'tc-fencing-section-row--focused' : ''}`}
      onClick={() => onFocus(wall.id)}
      onFocus={() => onFocus(wall.id)}
    >
      <input
        type="text"
        className="tc-fencing-section-label"
        value={wall.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label (optional)"
      />
      <div className="tc-fencing-section-field">
        <input
          type="number"
          value={wall.length}
          onChange={(e) => onChange({ length: parseInt(e.target.value) || 0 })}
          placeholder="6000"
        />
        <span className="tc-fencing-section-unit">mm</span>
      </div>
      <div className="tc-fencing-section-field">
        <input
          type="number"
          min={300}
          max={4000}
          step={100}
          value={wall.height}
          onChange={(e) => onChange({ height: parseInt(e.target.value) || 2400 })}
        />
        <span className="tc-fencing-section-unit">mm</span>
      </div>
      <button
        onClick={onRemove}
        className="tc-btn tc-btn--icon"
        disabled={!canRemove}
        style={{ opacity: canRemove ? 1 : 0.3 }}
        type="button"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================
// OPENING ROW
// ============================================

function OpeningRow({ opening, onChange, onRemove }) {
  const isWindow = opening.type === 'window';
  return (
    <div className="tc-wall-opening-row">
      <span className="tc-wall-opening-row__type">
        {isWindow ? <Square size={14} /> : <DoorOpen size={14} />}
        <select value={opening.type} onChange={(e) => onChange({ ...opening, type: e.target.value, sillHeight: e.target.value === 'door' ? 0 : opening.sillHeight || 900 })}>
          <option value="door">Door</option>
          <option value="window">Window</option>
        </select>
      </span>
      <div className="tc-wall-opening-row__fields">
        <div className="tc-fencing-field">
          <label>W</label>
          <div className="tc-fencing-field-input">
            <input type="number" value={opening.width} onChange={(e) => onChange({ ...opening, width: parseInt(e.target.value) || 0 })} />
            <span>mm</span>
          </div>
        </div>
        <div className="tc-fencing-field">
          <label>H</label>
          <div className="tc-fencing-field-input">
            <input type="number" value={opening.height} onChange={(e) => onChange({ ...opening, height: parseInt(e.target.value) || 0 })} />
            <span>mm</span>
          </div>
        </div>
        <div className="tc-fencing-field">
          <label>Pos</label>
          <div className="tc-fencing-field-input">
            <input type="number" value={opening.position} onChange={(e) => onChange({ ...opening, position: parseInt(e.target.value) || 0 })} />
            <span>mm</span>
          </div>
        </div>
        {isWindow && (
          <div className="tc-fencing-field">
            <label>Sill</label>
            <div className="tc-fencing-field-input">
              <input type="number" value={opening.sillHeight} onChange={(e) => onChange({ ...opening, sillHeight: parseInt(e.target.value) || 0 })} />
              <span>mm</span>
            </div>
          </div>
        )}
      </div>
      <button onClick={onRemove} className="tc-btn tc-btn--icon" type="button"><X size={14} /></button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function WallCalculator({
  products,
  config,
  settings,
  unit,
  onCalculateStart,
  onResults,
  adjustForGst,
  showGstInclusive,
  showCosting,
  previewControlRef,
}) {
  // Wall panels (each with own openings)
  const [walls, setWalls] = useState([
    { id: 1, label: '', length: 6000, height: 2400, openings: [] },
  ]);
  const [nextWallId, setNextWallId] = useState(2);
  const [nextOpeningId, setNextOpeningId] = useState(1);
  const [focusedWallId, setFocusedWallId] = useState(1);

  // Expose preview control for PDF capture (cycle through walls)
  useEffect(() => {
    if (!previewControlRef) return;
    previewControlRef.current = {
      items: walls.map((w, i) => ({ id: w.id, label: w.label || `Wall ${i + 1}` })),
      setFocusedId: setFocusedWallId,
      currentFocusedId: focusedWallId,
    };
  }, [previewControlRef, walls, focusedWallId]);

  // Shared framing config (same for all walls)
  const [framingConfig, setFramingConfig] = useState({
    studSpacing: 600,
    doubleTopPlate: false,
    dwangRows: null, // null = auto
  });

  const [maxStockLength, setMaxStockLength] = useState(null);

  // Components
  const [components, setComponents] = useState({
    framing: { productId: '' },
    plates: { useFraming: true, productId: '' },
    lintels: { useFraming: true, productId: '' },
  });

  // Product lists
  const framingProducts = useMemo(() => getProductsByCategory(products, WALL_CATEGORIES.framing), [products]);

  // Derived product selections
  const framingProduct = framingProducts.find(p => p.id === components.framing.productId);
  const plateProduct = components.plates.useFraming
    ? framingProduct
    : framingProducts.find(p => p.id === components.plates.productId);
  const lintelProduct = components.lintels.useFraming
    ? framingProduct
    : framingProducts.find(p => p.id === components.lintels.productId);

  // Parse dimensions from selected framing product
  const studWidth = framingProduct ? parseStudDepth(framingProduct.profile) : 45;
  const studDepth = framingProduct ? parseStudDepth(framingProduct.profile) : 45;
  const lintelDepth = lintelProduct ? parseStudWidth(lintelProduct.profile) : (framingProduct ? parseStudWidth(framingProduct.profile) : 90);

  // Max plate length
  const effectivePlateProduct = plateProduct || framingProduct;
  const filteredPlateLengths = filterLengths(effectivePlateProduct?.lengths, maxStockLength);
  const maxPlateLength = filteredPlateLengths?.length
    ? Math.max(...filteredPlateLengths)
    : undefined;

  // Focused wall
  const focusedWall = walls.find(w => w.id === focusedWallId) || walls[0];
  const focusedWallIndex = walls.findIndex(w => w.id === (focusedWall?.id));

  // Compute frameData for ALL walls
  const allFrameData = useMemo(() => {
    return walls.map(w => {
      if (!w.length || !w.height) return { wall: w, frameData: null };
      const frameData = computeWallFrame(
        { ...w, ...framingConfig, studWidth, studDepth, lintelDepth, maxPlateLength },
        w.openings
      );
      return { wall: w, frameData };
    });
  }, [walls, framingConfig, studWidth, studDepth, lintelDepth, maxPlateLength]);

  // Focused wall's frameData (for preview)
  const focusedFrameEntry = allFrameData.find(e => e.wall.id === focusedWall?.id) || allFrameData[0];
  const focusedFrameData = focusedFrameEntry?.frameData;

  // Combined summary across all walls (for legend totals)
  const combinedLegendSummary = useMemo(() => {
    const zero = {
      bottomPlates: 0, topPlates: 0, fullStuds: 0, trimmerStuds: 0,
      jackStuds: 0, lintels: 0, sillTrimmers: 0, crippleStudsAbove: 0,
      crippleStudsBelow: 0, dwangs: 0, totalMembers: 0,
    };
    return allFrameData.reduce((acc, e) => {
      if (!e.frameData) return acc;
      const s = e.frameData.summary;
      return {
        bottomPlates: acc.bottomPlates + s.bottomPlates,
        topPlates: acc.topPlates + s.topPlates,
        fullStuds: acc.fullStuds + s.fullStuds,
        trimmerStuds: acc.trimmerStuds + s.trimmerStuds,
        jackStuds: acc.jackStuds + s.jackStuds,
        lintels: acc.lintels + s.lintels,
        sillTrimmers: acc.sillTrimmers + s.sillTrimmers,
        crippleStudsAbove: acc.crippleStudsAbove + s.crippleStudsAbove,
        crippleStudsBelow: acc.crippleStudsBelow + s.crippleStudsBelow,
        dwangs: acc.dwangs + s.dwangs,
        totalMembers: acc.totalMembers + s.totalMembers,
      };
    }, zero);
  }, [allFrameData]);

  // Validation for focused wall
  const validationErrors = useMemo(
    () => focusedWall ? validateOpenings(focusedWall, focusedWall.openings, studWidth) : [],
    [focusedWall, studWidth]
  );

  // Auto dwang display
  const effectiveDwangRows = framingConfig.dwangRows != null
    ? framingConfig.dwangRows
    : autoDwangRows(focusedWall?.height || 2400);

  // Total openings across all walls
  const totalOpenings = walls.reduce((s, w) => s + w.openings.length, 0);

  // ============================================
  // WALL CRUD
  // ============================================

  const addWall = () => {
    const id = nextWallId;
    setNextWallId(p => p + 1);
    setWalls(p => [...p, { id, label: '', length: 6000, height: 2400, openings: [] }]);
    setFocusedWallId(id);
  };

  const updateWall = (id, updates) => {
    setWalls(p => p.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const removeWall = (id) => {
    setWalls(p => {
      const next = p.filter(w => w.id !== id);
      if (focusedWallId === id) {
        setFocusedWallId(next[0]?.id || null);
      }
      return next;
    });
  };

  // ============================================
  // OPENING CRUD (scoped to focused wall)
  // ============================================

  const addOpening = (preset = null) => {
    if (!focusedWall) return;
    const id = nextOpeningId;
    setNextOpeningId(prev => prev + 1);

    let opening;
    if (preset) {
      const existingEnds = focusedWall.openings.map(o => o.position + o.width);
      const startPos = existingEnds.length > 0 ? Math.max(...existingEnds) + framingConfig.studSpacing : framingConfig.studSpacing;
      opening = {
        id,
        type: preset.type,
        width: preset.width,
        height: preset.height,
        position: Math.min(startPos, focusedWall.length - preset.width),
        sillHeight: preset.sillHeight || 0,
      };
    } else {
      opening = {
        id, type: 'door', width: 810, height: 2040,
        position: framingConfig.studSpacing, sillHeight: 0,
      };
    }

    setWalls(p => p.map(w =>
      w.id === focusedWall.id
        ? { ...w, openings: [...w.openings, opening] }
        : w
    ));
  };

  const updateOpening = (openingId, updated) => {
    setWalls(p => p.map(w =>
      w.id === focusedWall?.id
        ? { ...w, openings: w.openings.map(o => o.id === openingId ? updated : o) }
        : w
    ));
  };

  const removeOpening = (openingId) => {
    setWalls(p => p.map(w =>
      w.id === focusedWall?.id
        ? { ...w, openings: w.openings.filter(o => o.id !== openingId) }
        : w
    ));
  };

  // ============================================
  // CALCULATE
  // ============================================

  const calculate = useCallback(() => {
    if (!framingProduct) return;
    // Need at least one valid wall
    const validFrameData = allFrameData.filter(e => e.frameData);
    if (validFrameData.length === 0) return;

    onCalculateStart?.();
    setTimeout(() => {

    const componentPlans = [];
    const applyGst = (cost) => adjustForGst ? adjustForGst(cost) : cost;

    const multiWall = validFrameData.length > 1;

    // Run optimizer for a set of cut lengths (plain numbers or { length, source } objects)
    function runOptimizer(label, product, cutLengths, component) {
      if (!product || cutLengths.length === 0) return;

      // Normalise to { length, source } objects
      const taggedCuts = cutLengths.map(c =>
        typeof c === 'object' ? c : { length: c, source: '' }
      );

      // Build sourceMap for post-optimization annotation
      const sourceMap = new Map();
      taggedCuts.forEach(({ length, source }) => {
        if (!sourceMap.has(length)) sourceMap.set(length, []);
        const buckets = sourceMap.get(length);
        const existing = buckets.find(b => b.source === source);
        if (existing) existing.remaining++;
        else buckets.push({ source, remaining: 1 });
      });

      const cutMap = {};
      taggedCuts.forEach(({ length }) => { cutMap[length] = (cutMap[length] || 0) + 1; });
      const requiredCuts = Object.entries(cutMap).map(([len, qty]) => ({
        length: parseInt(len),
        qty,
      }));

      const stockInput = filterLengths(product.lengths, maxStockLength).map(l => ({
        length: l,
        cost: applyGst(getStockCost(product, l)),
        available: null,
      }));

      const result = calculateCuttingPlan({
        stockLengths: stockInput,
        requiredCuts,
        minOffcut: settings.minOffcut,
        kerf: settings.kerf,
        endTrim: settings.endTrim,
      });

      // Annotate cuts with source
      if (multiWall) {
        result.plan.forEach(piece => {
          piece.cuts.forEach(cut => {
            const buckets = sourceMap.get(cut.actual);
            if (buckets) {
              const bucket = buckets.find(b => b.remaining > 0);
              if (bucket) { cut.source = bucket.source; bucket.remaining--; }
            }
          });
        });
      }

      if (result.summary) {
        result.summary.totalCutsMade = result.plan.reduce((s, p) => s + p.cuts.length, 0);
        result.summary.totalCost = result.summary.totalStockCost;
      }

      // Use source-aware grouping when multi-wall
      let grouped;
      if (multiWall) {
        grouped = [];
        result.plan.forEach(piece => {
          const signature = `${piece.rawStockLength}|${piece.cuts
            .map(c => `${c.actual}:${c.source || ''}`)
            .sort()
            .join(',')}`;
          const existing = grouped.find(g => g.signature === signature);
          if (existing) existing.qty++;
          else grouped.push({ ...piece, signature, qty: 1 });
        });
        grouped.sort((a, b) =>
          b.rawStockLength !== a.rawStockLength
            ? b.rawStockLength - a.rawStockLength
            : (b.cuts[0]?.actual || 0) - (a.cuts[0]?.actual || 0)
        );
      } else {
        grouped = groupCuttingPatterns(result.plan);
      }

      componentPlans.push({
        component,
        label,
        product,
        result,
        groupedPlan: grouped,
        settings,
        unit,
      });
    }

    // Run optimizer for tagged framing cuts (component + source)
    function runTaggedOptimizer(label, product, taggedCuts, component) {
      if (!product || taggedCuts.length === 0) return;

      // Combined metadata map: component + source per length
      const metaMap = new Map();
      taggedCuts.forEach(({ length, component: comp, source: src }) => {
        if (!metaMap.has(length)) metaMap.set(length, []);
        const buckets = metaMap.get(length);
        const existing = buckets.find(b => b.component === comp && b.source === (src || ''));
        if (existing) existing.remaining++;
        else buckets.push({ component: comp, source: src || '', remaining: 1 });
      });

      const cutMap = {};
      taggedCuts.forEach(({ length }) => { cutMap[length] = (cutMap[length] || 0) + 1; });
      const requiredCuts = Object.entries(cutMap).map(([len, qty]) => ({
        length: parseInt(len),
        qty,
      }));

      const stockInput = filterLengths(product.lengths, maxStockLength).map(l => ({
        length: l,
        cost: applyGst(getStockCost(product, l)),
        available: null,
      }));

      const result = calculateCuttingPlan({
        stockLengths: stockInput,
        requiredCuts,
        minOffcut: settings.minOffcut,
        kerf: settings.kerf,
        endTrim: settings.endTrim,
      });

      result.plan.forEach(piece => {
        piece.cuts.forEach(cut => {
          const buckets = metaMap.get(cut.actual);
          if (buckets) {
            const bucket = buckets.find(b => b.remaining > 0);
            if (bucket) {
              cut.component = bucket.component;
              if (bucket.source) cut.source = bucket.source;
              bucket.remaining--;
            }
          }
        });
      });

      if (result.summary) {
        result.summary.totalCutsMade = result.plan.reduce((s, p) => s + p.cuts.length, 0);
        result.summary.totalCost = result.summary.totalStockCost;
      }

      const grouped = [];
      result.plan.forEach(piece => {
        const signature = `${piece.rawStockLength}|${piece.cuts
          .map(c => `${c.actual}:${c.component || ''}:${c.source || ''}`)
          .sort()
          .join(',')}`;
        const existing = grouped.find(g => g.signature === signature);
        if (existing) existing.qty++;
        else grouped.push({ ...piece, signature, qty: 1 });
      });
      grouped.sort((a, b) =>
        b.rawStockLength !== a.rawStockLength
          ? b.rawStockLength - a.rawStockLength
          : (b.cuts[0]?.actual || 0) - (a.cuts[0]?.actual || 0)
      );

      componentPlans.push({
        component,
        label,
        product,
        result,
        groupedPlan: grouped,
        settings,
        unit,
      });
    }

    // Aggregate cut lists across all walls, tagging with source
    const allPlateCuts = validFrameData.flatMap((e, wIdx) => {
      const src = multiWall ? `W${wIdx + 1}` : '';
      return e.frameData.cutLists.plateCuts.map(len =>
        src ? { length: len, source: src } : len
      );
    });
    const allFramingCuts = validFrameData.flatMap((e, wIdx) => {
      const src = multiWall ? `W${wIdx + 1}` : '';
      return e.frameData.cutLists.framingCuts.map(cut =>
        src ? { ...cut, source: src } : cut
      );
    });
    const allLintelCuts = validFrameData.flatMap((e, wIdx) => {
      const src = multiWall ? `W${wIdx + 1}` : '';
      return e.frameData.cutLists.lintelCuts.map(len =>
        src ? { length: len, source: src } : len
      );
    });

    const fp = getProductLabel(framingProduct);
    const pp = getProductLabel(plateProduct || framingProduct);
    const lp = getProductLabel(lintelProduct || framingProduct);

    runOptimizer(`Plates — ${pp}`, plateProduct || framingProduct, allPlateCuts, 'plates');
    runTaggedOptimizer(`Framing — ${fp}`, framingProduct, allFramingCuts, 'framing');
    runOptimizer(`Lintels — ${lp}`, lintelProduct || framingProduct, allLintelCuts, 'lintels');

    const totalCost = componentPlans.reduce((s, p) => s + (p.result.summary?.totalStockCost || 0), 0);

    onResults({
      type: 'walls',
      wallSpec: { walls, framingConfig },
      componentPlans,
      quantityItems: [],
      combinedSummary: {
        totalCost,
        wallCount: walls.length,
        openingCount: totalOpenings,
        ...combinedLegendSummary,
      },
    });
    }, 0);
  }, [allFrameData, walls, framingConfig, framingProduct, plateProduct, lintelProduct, settings, unit, adjustForGst, onCalculateStart, onResults, totalOpenings, combinedLegendSummary, maxStockLength]);

  const canCalculate = walls.some(w => w.length > 0 && w.height > 0) && !!framingProduct;

  return (
    <div className="tc-fencing">
      {/* NZS 3604 Disclaimer — always visible */}
      <div className="tc-wall-disclaimer">
        <AlertTriangle size={16} />
        <p>
          <strong>Material estimator only.</strong> This tool estimates framing materials for standard non-load-bearing timber wall frames to NZS 3604. It does not constitute engineering design. Load-bearing walls, bracing elements, and walls exceeding standard spans require specific engineering design. Always confirm framing requirements with your designer, engineer, or building consent authority.
        </p>
      </div>

      {/* Missing products warning */}
      {framingProducts.length === 0 && (
        <div className="tc-fencing-warning">
          <AlertTriangle size={14} />
          <span>No framing products found. Using demo products.</span>
        </div>
      )}

      {/* Live SVG Preview */}
      {focusedFrameData && (
        <div className="tc-fence-preview">
          {/* Wall tabs */}
          {walls.length > 1 && (
            <div className="tc-fence-preview__toolbar">
              <div className="tc-section-tabs">
                {walls.map((w, i) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`tc-section-tabs__btn ${w.id === focusedWall?.id ? 'tc-section-tabs__btn--active' : ''}`}
                    onClick={() => setFocusedWallId(w.id)}
                  >
                    {w.label || `Wall ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="tc-wall-preview-row">
            <div className="tc-fence-preview__elevation" style={{ padding: 8, flex: 1, minWidth: 0 }}>
              <WallElevation
                wall={{ ...focusedWall, ...framingConfig, studWidth, studDepth }}
                openings={focusedWall.openings}
                frameData={focusedFrameData}
              />
            </div>
            <div className="tc-wall-legend">
              {LEGEND.map((item, i) => {
                const count = item.countFn ? item.countFn(focusedFrameData?.summary || {}) : 0;
                if (count === 0) return null;
                return (
                  <div key={i} className="tc-wall-legend__item">
                    <span className="tc-wall-legend__swatch" style={{ background: item.color }} />
                    <span className="tc-wall-legend__label">{item.label}</span>
                    <span className="tc-wall-legend__count">{count}</span>
                  </div>
                );
              })}
              <div className="tc-wall-legend__item tc-wall-legend__item--total">
                <span className="tc-wall-legend__label">Total</span>
                <span className="tc-wall-legend__count">{focusedFrameData?.summary?.totalMembers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two columns: Wall Panels + Components */}
      <div className="tc-fencing-columns">
        {/* Left: Walls + Openings */}
        <div className="tc-fencing-columns__sections">
          <div className="tc-section">
            <h3 className="tc-section__title">
              <span>Wall Panels</span>
              <span className="tc-section__subtitle">
                {walls.length} wall{walls.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <p className="tc-inline-hint">Add one row per wall panel. Click a row to edit its openings below.</p>
            <div className="tc-fencing-sections-header">
              <span>Label</span>
              <span>Length</span>
              <span>Height</span>
              <span></span>
            </div>
            <div className="tc-fencing-sections">
              {walls.map(w => (
                <WallPanelRow
                  key={w.id}
                  wall={w}
                  onChange={(updates) => updateWall(w.id, updates)}
                  onRemove={() => removeWall(w.id)}
                  canRemove={walls.length > 1}
                  isFocused={w.id === focusedWall?.id}
                  onFocus={setFocusedWallId}
                />
              ))}
            </div>
            <button onClick={addWall} className="tc-add-btn" type="button">
              <Plus size={14} />
              Add Wall
            </button>
          </div>

          {/* Openings for focused wall */}
          {focusedWall && (
            <div className="tc-section">
              <h3 className="tc-section__title">
                <span>Openings{focusedWall.label ? ` — ${focusedWall.label}` : walls.length > 1 ? ` — Wall ${focusedWallIndex + 1}` : ''}</span>
                <span className="tc-section__subtitle">
                  {focusedWall.openings.length > 0 ? `${focusedWall.openings.length} opening${focusedWall.openings.length !== 1 ? 's' : ''}` : 'None'}
                </span>
              </h3>

              {/* Preset quick-add buttons */}
              <div className="tc-wall-presets">
                {OPENING_PRESETS.map((preset, i) => (
                  <button key={i} type="button" className="tc-wall-presets__btn"
                    onClick={() => addOpening(preset)}>
                    <Plus size={12} />
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Opening rows */}
              {focusedWall.openings.length > 0 && (
                <div className="tc-wall-openings">
                  {focusedWall.openings.map(o => (
                    <OpeningRow
                      key={o.id}
                      opening={o}
                      onChange={(updated) => updateOpening(o.id, updated)}
                      onRemove={() => removeOpening(o.id)}
                    />
                  ))}
                </div>
              )}

              <button onClick={() => addOpening()} className="tc-add-btn" type="button">
                <Plus size={14} />
                Add Custom Opening
              </button>

              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <div className="tc-fencing-field-warning" style={{ marginTop: 8 }}>
                  <AlertTriangle size={12} />
                  {validationErrors[0]}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Components */}
        <div className="tc-fencing-columns__components">
          <div className="tc-section">
            <h3 className="tc-section__title"><span>Framing</span></h3>

            <div className={`tc-setting-card ${maxStockLength ? 'tc-setting-card--active' : ''}`}>
              <div className="tc-setting-card__icon"><Ruler size={15} /></div>
              <div className="tc-setting-card__body">
                <span className="tc-setting-card__label">Max stock length</span>
                <span className="tc-setting-card__hint">Limit lengths to fit your trailer or vehicle</span>
                {maxStockLength && <span className="tc-setting-card__badge">{maxStockLength / 1000}m max</span>}
              </div>
              <div className="tc-setting-card__control">
                <select
                  value={maxStockLength || ''}
                  onChange={(e) => setMaxStockLength(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">No limit</option>
                  <option value="1800">1.8m</option>
                  <option value="2400">2.4m</option>
                  <option value="3000">3.0m</option>
                  <option value="3600">3.6m</option>
                  <option value="4200">4.2m</option>
                  <option value="4800">4.8m</option>
                  <option value="5400">5.4m</option>
                  <option value="6000">6.0m</option>
                </select>
                <ChevronDown size={14} className="tc-product-dropdown-icon" />
              </div>
            </div>

            {/* Framing timber product */}
            <div className="tc-fencing-component">
              <div className="tc-fencing-component-top">
                <span className="tc-fencing-component-label">Framing timber</span>
              </div>
              <div className="tc-fencing-component-body">
                <MiniProductSelector
                  products={framingProducts}
                  selectedId={components.framing.productId}
                  onChange={(id) => setComponents(c => ({ ...c, framing: { ...c.framing, productId: id } }))}
                  placeholder="Select framing…"
                />
              </div>
            </div>

            {/* Plate timber override */}
            <div className="tc-fencing-component">
              <div className="tc-fencing-component-top">
                <span className="tc-fencing-component-label">
                  <input type="checkbox" checked={!components.plates.useFraming}
                    onChange={(e) => setComponents(c => ({ ...c, plates: { ...c.plates, useFraming: !e.target.checked } }))}
                    style={{ marginRight: 6 }} />
                  Different plate timber
                </span>
              </div>
              {!components.plates.useFraming && (
                <div className="tc-fencing-component-body">
                  <MiniProductSelector
                    products={framingProducts}
                    selectedId={components.plates.productId}
                    onChange={(id) => setComponents(c => ({ ...c, plates: { ...c.plates, productId: id } }))}
                    placeholder="Select plates…"
                  />
                </div>
              )}
            </div>

            {/* Lintel timber override */}
            <div className="tc-fencing-component">
              <div className="tc-fencing-component-top">
                <span className="tc-fencing-component-label">
                  <input type="checkbox" checked={!components.lintels.useFraming}
                    onChange={(e) => setComponents(c => ({ ...c, lintels: { ...c.lintels, useFraming: !e.target.checked } }))}
                    style={{ marginRight: 6 }} />
                  Different lintel timber
                </span>
                {totalOpenings > 0 && (
                  <span className="tc-fencing-component-preview">{totalOpenings} lintel{totalOpenings !== 1 ? 's' : ''}</span>
                )}
              </div>
              {!components.lintels.useFraming && (
                <div className="tc-fencing-component-body">
                  <MiniProductSelector
                    products={framingProducts}
                    selectedId={components.lintels.productId}
                    onChange={(id) => setComponents(c => ({ ...c, lintels: { ...c.lintels, productId: id } }))}
                    placeholder="Select lintel timber…"
                  />
                  <p className="tc-inline-hint" style={{ marginTop: 4 }}>
                    Lintel size/grade must be confirmed by your engineer or designer for the specific span and load condition.
                  </p>
                </div>
              )}
            </div>

            {/* Configuration fields */}
            <div className="tc-fencing-component-extras" style={{ padding: '8px 12px' }}>
              <div className="tc-fencing-field">
                <label>Stud spacing</label>
                <div className="tc-fencing-field-input">
                  <input type="number" value={framingConfig.studSpacing} style={{ width: 60 }}
                    onChange={(e) => setFramingConfig(c => ({ ...c, studSpacing: parseInt(e.target.value) || 0 }))} />
                  <span>mm</span>
                </div>
              </div>
              <div className="tc-fencing-field">
                <label>Double top plate</label>
                <div className="tc-fencing-field-input">
                  <input type="checkbox" checked={framingConfig.doubleTopPlate}
                    onChange={(e) => setFramingConfig(c => ({ ...c, doubleTopPlate: e.target.checked }))} />
                </div>
              </div>
              <div className="tc-fencing-field" style={{ minWidth: 160 }}>
                <label>Dwang rows</label>
                <div className="tc-fencing-field-input">
                  <input type="number" min={0} max={5} value={effectiveDwangRows}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFramingConfig(c => ({
                        ...c, dwangRows: isNaN(val) ? null : (val === autoDwangRows(focusedWall?.height || 2400) ? null : val),
                      }));
                    }} />
                </div>
                {framingConfig.dwangRows == null && <span className="tc-hint"> (auto)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate */}
      <div className="tc-actions-primary">
        <button onClick={calculate}
          className="tc-btn tc-btn--primary tc-btn--lg tc-btn--full"
          disabled={!canCalculate}
          title={!canCalculate ? 'Enter wall dimensions and select a framing product' : ''}>
          Calculate Wall Frame
        </button>
      </div>
    </div>
  );
}
