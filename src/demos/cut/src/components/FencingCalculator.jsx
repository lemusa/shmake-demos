import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, X, ChevronDown, AlertTriangle, Info, Ruler, AlignHorizontalDistributeCenter, Scissors } from 'lucide-react';
import {
  calculateCuttingPlan,
  groupCuttingPatterns,
  formatLength,
} from '../lib/cuttingAlgorithm';
import {
  productToStockLengths,
  getProductLabel,
  getProductsByCategory,
  FENCING_CATEGORIES,
  CLADDING_STYLES,
} from '../config/embedConfig';
import { FenceElevation, FenceCrossSection, StylePatternIcon } from './FencePreview';

// ============================================
// HELPERS
// ============================================

function roundUpToStock(lengthMm, stockLengths) {
  if (!stockLengths || !stockLengths.length) return null;
  const sorted = [...stockLengths].sort((a, b) => a - b);
  return sorted.find(s => s >= lengthMm) || sorted[sorted.length - 1];
}

function parseBoardWidth(profile) {
  const match = profile.match(/(\d+)\s*[x×]\s*\d+/i);
  return match ? parseInt(match[1]) : 100;
}

function parseRailDepth(profile) {
  const match = profile.match(/\d+\s*[x×]\s*(\d+)/i);
  return match ? parseInt(match[1]) : 50;
}

function parseBoardThickness(profile) {
  const match = profile.match(/\d+\s*[x×]\s*(\d+)/i);
  return match ? parseInt(match[1]) : 19;
}

function getStockCost(product, lengthMm) {
  const rate = product?.pricePerMeter || 0;
  return (lengthMm / 1000) * rate;
}

function filterLengths(lengths, maxStockLength) {
  if (!lengths || !maxStockLength) return lengths;
  const filtered = lengths.filter(l => l <= maxStockLength);
  return filtered.length > 0 ? filtered : lengths;
}

/**
 * Split a continuous run (rails/capping) into spans that fit within maxStock,
 * only cutting at post positions (bay boundaries). If the full section fits
 * in one stock length, returns a single span.
 */
function splitAtPosts(numberOfBays, getBayLen, maxStock) {
  const spans = [];
  let current = 0;
  for (let i = 0; i < numberOfBays; i++) {
    const bl = getBayLen(i);
    if (current > 0 && current + bl > maxStock) {
      // Split here — current span ends at this post
      spans.push(current);
      current = bl;
    } else {
      current += bl;
    }
  }
  if (current > 0) spans.push(current);
  return spans;
}

// ============================================
// FENCE SECTION ROW
// ============================================

function FenceSectionRow({ section, onChange, onRemove, canRemove, onFocus }) {
  return (
    <div className="tc-fencing-section-row" onClick={() => onFocus(section.id)} onFocus={() => onFocus(section.id)}>
      <input
        type="text"
        className="tc-fencing-section-label"
        value={section.label}
        onChange={(e) => onChange({ ...section, label: e.target.value })}
        placeholder="Label (optional)"
      />
      <div className="tc-fencing-section-field">
        <input
          type="number"
          step="0.1"
          value={section.length}
          onChange={(e) => onChange({ ...section, length: e.target.value })}
          placeholder="0"
        />
        <span className="tc-fencing-section-unit">m</span>
      </div>
      <div className="tc-fencing-section-field">
        <input
          type="number"
          min={300}
          max={3000}
          step={100}
          value={section.height}
          onChange={(e) => onChange({ ...section, height: parseInt(e.target.value) || 1800 })}
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
// FENCE COMPONENT ROW
// ============================================

function FenceComponentRow({ label, products, selectedId, onChange, preview, children, optional, enabled, onToggle }) {
  const selectedProduct = products.find(p => p.id === selectedId);
  return (
    <div className={`tc-fencing-component ${optional && !enabled ? 'tc-fencing-component--disabled' : ''}`}>
      <div className="tc-fencing-component-top">
        <span className="tc-fencing-component-label">
          {optional && (
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              style={{ marginRight: 6 }}
            />
          )}
          {label}
        </span>
        {preview && <span className="tc-fencing-component-preview">{preview}</span>}
      </div>
      {(!optional || enabled) && (
        <div className="tc-fencing-component-body">
          <div className="tc-fencing-component-select-row">
            {selectedProduct?.imageUrl && (
              <img src={selectedProduct.imageUrl} alt="" className="tc-product-thumb" />
            )}
            <div className="tc-fencing-component-select">
              <select
                value={selectedId || ''}
                onChange={(e) => onChange({ productId: e.target.value })}
              >
                <option value="">Select {label.toLowerCase()}...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{getProductLabel(p)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="tc-product-dropdown-icon" />
            </div>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// PREVIEW COMPUTATION
// ============================================

function computeFencePreview(sections, components, postProducts, railProducts, claddingProducts, maxStockLength) {
  const validSections = sections.filter(s => parseFloat(s.length) > 0);
  const totalLengthM = validSections.reduce((sum, s) => sum + parseFloat(s.length || 0), 0);

  const postProduct = postProducts.find(p => p.id === components.posts.productId);
  const claddingProduct = claddingProducts.find(p => p.id === components.cladding.productId);

  const sectionDetails = validSections.map(section => {
    const lengthMm = parseFloat(section.length) * 1000;
    const height = section.height;
    const spacing = components.posts.spacing;

    // Posts
    let numberOfBays, bayWidth, lastBayLength;
    if (components.posts.equalSpacing) {
      numberOfBays = Math.max(1, Math.ceil(lengthMm / spacing));
      bayWidth = Math.round(lengthMm / numberOfBays);
      lastBayLength = bayWidth;
    } else {
      numberOfBays = Math.max(1, Math.ceil(lengthMm / spacing));
      bayWidth = spacing;
      lastBayLength = numberOfBays > 1
        ? lengthMm - (numberOfBays - 1) * spacing
        : lengthMm;
    }
    const postCount = numberOfBays + 1;

    // Post length: height + underground depth, rounded up to nearest stock
    const depth = components.posts.depthOverride != null
      ? components.posts.depthOverride
      : Math.round(height / 3);
    const rawPostLength = height + depth;
    const postLength = components.posts.lengthOverride
      || roundUpToStock(rawPostLength, filterLengths(postProduct?.lengths, maxStockLength));

    // Rails
    const railCount = components.rails.countOverride ?? (height <= 1500 ? 2 : 3);

    // Rail cuts
    const railProduct = railProducts.find(p => p.id === components.rails.productId);
    const railCuts = [];

    // Helper: get bay length for bay index
    const getBayLen = (i) => (i < numberOfBays - 1) ? bayWidth : Math.round(lastBayLength);

    {
      // Rails span continuously, only splitting at posts where stock isn't long enough.
      // In mitre mode, 45° overlaps are added at each join point (not at fence ends).
      const mitreAllowance = components.rails.mitre && railProduct
        ? parseRailDepth(railProduct.profile) : 0;
      const filteredRailLengths = filterLengths(railProduct?.lengths, maxStockLength);
      const maxStock = filteredRailLengths ? Math.max(...filteredRailLengths) : Infinity;
      // Reserve room for mitre allowances when determining split points
      const effectiveMax = mitreAllowance > 0 ? maxStock - mitreAllowance * 2 : maxStock;
      const spans = splitAtPosts(numberOfBays, getBayLen, effectiveMax);

      for (let r = 0; r < railCount; r++) {
        spans.forEach((span, i) => {
          let cut = span;
          let mitreLeft = false, mitreRight = false;
          // Add mitre overlap at join points only (where two rails meet at a post)
          if (mitreAllowance > 0 && spans.length > 1) {
            if (i === 0) { cut += mitreAllowance; mitreRight = true; }
            else if (i === spans.length - 1) { cut += mitreAllowance; mitreLeft = true; }
            else { cut += mitreAllowance * 2; mitreLeft = true; mitreRight = true; }
          }
          railCuts.push({ length: cut, mitreLeft, mitreRight });
        });
      }
    }

    // Cladding
    let palingData = null;
    if (claddingProduct) {
      const boardWidth = parseBoardWidth(claddingProduct.profile);
      const style = CLADDING_STYLES[section.style];
      const gap = components.cladding.gap;

      if (style?.horizontal) {
        const rows = Math.floor(height / (boardWidth + gap));
        const cuts = [];
        for (let i = 0; i < numberOfBays; i++) {
          for (let r = 0; r < rows; r++) {
            cuts.push(getBayLen(i));
          }
        }
        palingData = { type: 'optimized', cuts, totalPieces: cuts.length };
      } else {
        let palingCount;
        if (section.style === 'standard_vertical') {
          palingCount = Math.ceil(lengthMm / (boardWidth + gap || boardWidth));
        } else if (section.style === 'vertical_lapped') {
          const overlap = components.cladding.overlap || 25;
          palingCount = Math.ceil(lengthMm / (boardWidth - overlap + gap));
        } else if (section.style === 'hit_and_miss') {
          const frontCount = Math.ceil(lengthMm / (boardWidth + gap || boardWidth));
          palingCount = frontCount * 2;
        } else {
          palingCount = Math.ceil(lengthMm / (boardWidth + gap || boardWidth));
        }
        palingData = { type: 'quantity_only', qty: palingCount, length: height };
      }
    }

    return {
      section,
      postCount,
      postLength,
      rawPostLength,
      depth,
      railCount,
      railCuts,
      numberOfBays,
      bayWidth,
      lastBayLength,
      palingData,
    };
  });

  // Aggregate totals
  const totalPosts = sectionDetails.reduce((s, d) => s + d.postCount, 0);
  const totalRailCuts = sectionDetails.reduce((s, d) => s + d.railCuts.length, 0);

  let totalPalings = 0;
  let totalCladdingCuts = 0;
  sectionDetails.forEach(d => {
    if (d.palingData?.type === 'quantity_only') totalPalings += d.palingData.qty;
    if (d.palingData?.type === 'optimized') totalCladdingCuts += d.palingData.totalPieces;
  });

  const filteredPostLengths = filterLengths(postProduct?.lengths, maxStockLength);
  const maxPostStock = filteredPostLengths ? Math.max(...filteredPostLengths) : 0;
  const hasPostLengthWarning = sectionDetails.some(d =>
    d.rawPostLength > maxPostStock && maxPostStock > 0
  );

  return {
    totalLengthM,
    sectionDetails,
    totalPosts,
    totalRailCuts,
    totalPalings,
    totalCladdingCuts,
    hasPostLengthWarning,
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function FencingCalculator({
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
  // Sections
  const [sections, setSections] = useState([
    { id: 1, label: '', length: '', height: 1800, style: 'standard_vertical' },
  ]);
  const [nextSectionId, setNextSectionId] = useState(2);

  // Components
  const [components, setComponents] = useState({
    posts: { productId: '', spacing: 2400, lengthOverride: null, depthOverride: null, equalSpacing: true },
    rails: { productId: '', countOverride: null, mitre: true },
    cladding: { productId: '', gap: 0, overlap: 25 },
    capping: { enabled: false, productId: '' },
  });

  // Preview state
  const [focusedSectionId, setFocusedSectionId] = useState(null);
  const [viewSide, setViewSide] = useState('front');
  const [previewBays, setPreviewBays] = useState(2);
  const [maxStockLength, setMaxStockLength] = useState(null);

  // Expose preview control for PDF capture (cycle through sections)
  useEffect(() => {
    if (!previewControlRef) return;
    const validSections = sections.filter(s => parseFloat(s.length) > 0);
    previewControlRef.current = {
      items: validSections.map((s, i) => ({ id: s.id, label: s.label || `Section ${i + 1}` })),
      setFocusedId: setFocusedSectionId,
      currentFocusedId: focusedSectionId,
    };
  }, [previewControlRef, sections, focusedSectionId]);
  const [showInstructions, setShowInstructions] = useState(() => {
    try { return localStorage.getItem('shmakecut-fence-howto-dismissed') !== 'true'; }
    catch { return true; }
  });

  // Filter products by fencing category
  const postProducts = useMemo(() => getProductsByCategory(products, FENCING_CATEGORIES.posts), [products]);
  const railProducts = useMemo(() => getProductsByCategory(products, FENCING_CATEGORIES.rails), [products]);
  const claddingProducts = useMemo(() => getProductsByCategory(products, FENCING_CATEGORIES.cladding), [products]);
  const cappingProducts = useMemo(() => getProductsByCategory(products, FENCING_CATEGORIES.capping), [products]);

  // Live preview
  const preview = useMemo(
    () => computeFencePreview(sections, components, postProducts, railProducts, claddingProducts, maxStockLength),
    [sections, components, postProducts, railProducts, claddingProducts, maxStockLength]
  );

  // Focused section for visual preview
  const focusedSection = sections.find(s => s.id === focusedSectionId) || sections[0];

  // Derive preview props from product selections
  const previewProps = useMemo(() => {
    const claddingProduct = claddingProducts.find(p => p.id === components.cladding.productId);
    const railProduct = railProducts.find(p => p.id === components.rails.productId);
    const postProduct = postProducts.find(p => p.id === components.posts.productId);

    return {
      boardW: claddingProduct ? parseBoardWidth(claddingProduct.profile) : 150,
      boardThickness: claddingProduct ? parseBoardThickness(claddingProduct.profile) : 19,
      railW: railProduct ? parseBoardWidth(railProduct.profile) : 90,
      railH: railProduct ? parseRailDepth(railProduct.profile) : 45,
      postW: postProduct ? parseBoardWidth(postProduct.profile) : 100,
    };
  }, [components.cladding.productId, components.rails.productId, components.posts.productId, claddingProducts, railProducts, postProducts]);

  // Check if any fencing categories are missing
  const missingCategories = [];
  if (postProducts.length === 0) missingCategories.push('posts');
  if (railProducts.length === 0) missingCategories.push('rails');
  if (claddingProducts.length === 0) missingCategories.push('palings');

  // Section CRUD
  const addSection = () => {
    setSections(prev => [...prev, { id: nextSectionId, label: '', length: '', height: 1800, style: 'standard_vertical' }]);
    setNextSectionId(prev => prev + 1);
  };
  const updateSection = (id, updated) => {
    setSections(prev => prev.map(s => s.id === id ? updated : s));
  };
  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  // Calculate
  const calculate = useCallback(() => {
    onCalculateStart?.();
    setTimeout(() => {
    const componentPlans = [];
    const quantityItems = [];

    const applyGst = (cost) => adjustForGst ? adjustForGst(cost) : cost;

    const multiSection = preview.sectionDetails.length > 1;

    // Source-aware grouping helper (includes source in signature so cuts from different sections stay separate)
    function groupWithSource(plan) {
      const grouped = [];
      plan.forEach(piece => {
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
      return grouped;
    }

    // 1. POSTS
    const postProduct = postProducts.find(p => p.id === components.posts.productId);
    if (postProduct && preview.totalPosts > 0) {
      // Collect post cuts from all sections (heights may differ → different post lengths)
      const allPostCuts = [];
      preview.sectionDetails.forEach((d, sIdx) => {
        if (d.postLength) {
          const src = multiSection ? `S${sIdx + 1}` : '';
          for (let i = 0; i < d.postCount; i++) {
            allPostCuts.push({ length: d.postLength, source: src });
          }
        }
      });

      // Build sourceMap for post-optimization annotation
      const postSourceMap = new Map();
      allPostCuts.forEach(({ length, source }) => {
        if (!postSourceMap.has(length)) postSourceMap.set(length, []);
        const buckets = postSourceMap.get(length);
        const existing = buckets.find(b => b.source === source);
        if (existing) existing.remaining++;
        else buckets.push({ source, remaining: 1 });
      });

      const cutMap = {};
      allPostCuts.forEach(({ length }) => { cutMap[length] = (cutMap[length] || 0) + 1; });
      const requiredCuts = Object.entries(cutMap).map(([len, qty]) => ({
        length: parseInt(len),
        qty,
      }));

      if (requiredCuts.length > 0) {
        const stockInput = filterLengths(postProduct.lengths, maxStockLength).map(l => ({
          length: l,
          cost: applyGst(getStockCost(postProduct, l)),
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
        if (multiSection) {
          result.plan.forEach(piece => {
            piece.cuts.forEach(cut => {
              const buckets = postSourceMap.get(cut.actual);
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

        componentPlans.push({
          component: 'posts',
          label: `Posts — ${getProductLabel(postProduct)}`,
          product: postProduct,
          result,
          groupedPlan: multiSection ? groupWithSource(result.plan) : groupCuttingPatterns(result.plan),
          settings,
          unit,
        });
      }
    }

    // 2. RAILS
    const railProduct = railProducts.find(p => p.id === components.rails.productId);
    if (railProduct) {
      // Flatten rail cuts with source tags
      const allRailCuts = preview.sectionDetails.flatMap((d, sIdx) => {
        const src = multiSection ? `S${sIdx + 1}` : '';
        return d.railCuts.map(rc =>
          typeof rc === 'object' ? { ...rc, source: src } : { length: rc, source: src }
        );
      });

      // Build combined mitre+source lookup
      const metaMap = new Map(); // length -> [{ mitreLeft, mitreRight, source, remaining }]
      allRailCuts.forEach(rc => {
        const len = typeof rc === 'object' ? rc.length : rc;
        const ml = typeof rc === 'object' ? rc.mitreLeft : false;
        const mr = typeof rc === 'object' ? rc.mitreRight : false;
        const src = typeof rc === 'object' ? rc.source : '';
        if (!metaMap.has(len)) metaMap.set(len, []);
        const buckets = metaMap.get(len);
        const existing = buckets.find(b => b.mitreLeft === ml && b.mitreRight === mr && b.source === src);
        if (existing) existing.remaining++;
        else buckets.push({ mitreLeft: ml, mitreRight: mr, source: src, remaining: 1 });
      });

      const cutMap = {};
      allRailCuts.forEach(rc => {
        const len = typeof rc === 'object' ? rc.length : rc;
        cutMap[len] = (cutMap[len] || 0) + 1;
      });
      const requiredCuts = Object.entries(cutMap).map(([len, qty]) => ({
        length: parseInt(len),
        qty,
      }));

      if (requiredCuts.length > 0) {
        const stockInput = filterLengths(railProduct.lengths, maxStockLength).map(l => ({
          length: l,
          cost: applyGst(getStockCost(railProduct, l)),
          available: null,
        }));

        const result = calculateCuttingPlan({
          stockLengths: stockInput,
          requiredCuts,
          minOffcut: settings.minOffcut,
          kerf: settings.kerf,
          endTrim: settings.endTrim,
        });

        // Tag each cut with its mitre config + source
        result.plan.forEach(piece => {
          piece.cuts.forEach(cut => {
            const buckets = metaMap.get(cut.actual);
            if (buckets) {
              const bucket = buckets.find(b => b.remaining > 0);
              if (bucket) {
                cut.mitreLeft = bucket.mitreLeft;
                cut.mitreRight = bucket.mitreRight;
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

        // Group patterns — include mitre config + source in signature
        const groupedPlan = [];
        result.plan.forEach(piece => {
          const signature = `${piece.rawStockLength}|${piece.cuts
            .map(c => `${c.actual}:${c.mitreLeft ? 'L' : ''}${c.mitreRight ? 'R' : ''}:${c.source || ''}`)
            .sort()
            .join(',')}`;
          const existing = groupedPlan.find(g => g.signature === signature);
          if (existing) existing.qty++;
          else groupedPlan.push({ ...piece, signature, qty: 1 });
        });

        componentPlans.push({
          component: 'rails',
          label: `Rails — ${getProductLabel(railProduct)}`,
          product: railProduct,
          result,
          groupedPlan,
          settings,
          unit,
          mitreEnabled: components.rails.mitre,
        });
      }
    }

    // 3. CLADDING
    const claddingProduct = claddingProducts.find(p => p.id === components.cladding.productId);
    if (claddingProduct) {
      const allOptimizedCuts = [];
      let totalQuantityOnly = 0;
      let quantityLength = 0;

      preview.sectionDetails.forEach((d, sIdx) => {
        const src = multiSection ? `S${sIdx + 1}` : '';
        if (d.palingData?.type === 'optimized') {
          d.palingData.cuts.forEach(len => allOptimizedCuts.push({ length: len, source: src }));
        } else if (d.palingData?.type === 'quantity_only') {
          totalQuantityOnly += d.palingData.qty;
          quantityLength = d.palingData.length;
        }
      });

      // Horizontal cuts go through optimizer
      if (allOptimizedCuts.length > 0) {
        // Build sourceMap for cladding
        const claddingSourceMap = new Map();
        allOptimizedCuts.forEach(({ length, source }) => {
          if (!claddingSourceMap.has(length)) claddingSourceMap.set(length, []);
          const buckets = claddingSourceMap.get(length);
          const existing = buckets.find(b => b.source === source);
          if (existing) existing.remaining++;
          else buckets.push({ source, remaining: 1 });
        });

        const cutMap = {};
        allOptimizedCuts.forEach(({ length }) => { cutMap[length] = (cutMap[length] || 0) + 1; });
        const requiredCuts = Object.entries(cutMap).map(([len, qty]) => ({
          length: parseInt(len),
          qty,
        }));

        const stockInput = filterLengths(claddingProduct.lengths, maxStockLength).map(l => ({
          length: l,
          cost: applyGst(getStockCost(claddingProduct, l)),
          available: null,
        }));

        const result = calculateCuttingPlan({
          stockLengths: stockInput,
          requiredCuts,
          minOffcut: settings.minOffcut,
          kerf: settings.kerf,
          endTrim: settings.endTrim,
        });

        // Annotate cladding cuts with source
        if (multiSection) {
          result.plan.forEach(piece => {
            piece.cuts.forEach(cut => {
              const buckets = claddingSourceMap.get(cut.actual);
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

        componentPlans.push({
          component: 'cladding',
          label: `Cladding — ${getProductLabel(claddingProduct)}`,
          product: claddingProduct,
          result,
          groupedPlan: multiSection ? groupWithSource(result.plan) : groupCuttingPatterns(result.plan),
          settings,
          unit,
        });
      }

      // Vertical palings — quantity only
      if (totalQuantityOnly > 0) {
        const costPerPiece = applyGst((quantityLength / 1000) * (claddingProduct.pricePerMeter || 0));
        quantityItems.push({
          component: 'cladding',
          type: 'quantity_only',
          product: claddingProduct,
          label: `${getProductLabel(claddingProduct)} at ${formatLength(quantityLength, unit)}`,
          cutLength: quantityLength,
          qty: totalQuantityOnly,
          costPerPiece,
          totalCost: costPerPiece * totalQuantityOnly,
          note: 'Purchase at length — no cutting required',
        });
      }
    }

    // 4. CAPPING
    if (components.capping.enabled) {
      const cappingProduct = cappingProducts.find(p => p.id === components.capping.productId);
      if (cappingProduct && preview.totalLengthM > 0) {
        const filteredCappingLengths = filterLengths(cappingProduct.lengths, maxStockLength);
        const maxCappingStock = filteredCappingLengths ? Math.max(...filteredCappingLengths) : Infinity;

        // Flatten capping cuts with source tags
        const allCappingCuts = [];
        preview.sectionDetails.forEach((d, sIdx) => {
          const src = multiSection ? `S${sIdx + 1}` : '';
          const getBayLen = (i) => (i < d.numberOfBays - 1) ? d.bayWidth : Math.round(d.lastBayLength);
          splitAtPosts(d.numberOfBays, getBayLen, maxCappingStock).forEach(len => {
            allCappingCuts.push({ length: len, source: src });
          });
        });

        // Build sourceMap for capping
        const cappingSourceMap = new Map();
        allCappingCuts.forEach(({ length, source }) => {
          if (!cappingSourceMap.has(length)) cappingSourceMap.set(length, []);
          const buckets = cappingSourceMap.get(length);
          const existing = buckets.find(b => b.source === source);
          if (existing) existing.remaining++;
          else buckets.push({ source, remaining: 1 });
        });

        const cutMap = {};
        allCappingCuts.forEach(({ length }) => { cutMap[length] = (cutMap[length] || 0) + 1; });
        const requiredCuts = Object.entries(cutMap).map(([len, qty]) => ({
          length: parseInt(len),
          qty,
        }));

        if (requiredCuts.length > 0) {
          const stockInput = filterLengths(cappingProduct.lengths, maxStockLength).map(l => ({
            length: l,
            cost: applyGst(getStockCost(cappingProduct, l)),
            available: null,
          }));

          const result = calculateCuttingPlan({
            stockLengths: stockInput,
            requiredCuts,
            minOffcut: settings.minOffcut,
            kerf: settings.kerf,
            endTrim: settings.endTrim,
          });

          // Annotate capping cuts with source
          if (multiSection) {
            result.plan.forEach(piece => {
              piece.cuts.forEach(cut => {
                const buckets = cappingSourceMap.get(cut.actual);
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

          componentPlans.push({
            component: 'capping',
            label: `Capping — ${getProductLabel(cappingProduct)}`,
            product: cappingProduct,
            result,
            groupedPlan: multiSection ? groupWithSource(result.plan) : groupCuttingPatterns(result.plan),
            settings,
            unit,
          });
        }
      }
    }

    // Combine
    const totalCost =
      componentPlans.reduce((s, p) => s + (p.result.summary?.totalStockCost || 0), 0) +
      quantityItems.reduce((s, q) => s + q.totalCost, 0);

    onResults({
      type: 'fencing',
      fenceSpec: { sections, components },
      componentPlans,
      quantityItems,
      combinedSummary: {
        totalCost,
        totalLengthM: preview.totalLengthM,
        totalPosts: preview.totalPosts,
        totalRailCuts: preview.totalRailCuts,
        totalPalings: preview.totalPalings,
        totalCladdingCuts: preview.totalCladdingCuts,
      },
    });
    }, 0);
  }, [sections, components, preview, postProducts, railProducts, claddingProducts, cappingProducts, settings, unit, adjustForGst, onCalculateStart, onResults, maxStockLength]);

  // Can calculate?
  const hasValidSections = sections.some(s => parseFloat(s.length) > 0);
  const hasPostProduct = !!components.posts.productId;
  const hasRailProduct = !!components.rails.productId;
  const canCalculate = hasValidSections && hasPostProduct && hasRailProduct;

  return (
    <div className="tc-fencing">
      {/* How-to banner */}
      {showInstructions && (
        <div className="tc-howto-banner">
          <div className="tc-howto-banner__header">
            <span className="tc-howto-banner__title"><Info size={14} /> How to use the Fencing Calculator</span>
            <button type="button" className="tc-btn tc-btn--icon" onClick={() => {
              setShowInstructions(false);
              try { localStorage.setItem('shmakecut-fence-howto-dismissed', 'true'); } catch {}
            }}><X size={14} /></button>
          </div>
          <ol className="tc-howto-banner__steps">
            <li>Add your fence sections below — one row per continuous fence run (length, height, and cladding style).</li>
            <li>Choose products for posts, rails, and cladding from the Components panel.</li>
            <li>Adjust spacing, depth, and style options as needed.</li>
            <li>Hit <strong>Calculate Fence Plan</strong> to see your optimised cutting plan and shopping list.</li>
          </ol>
        </div>
      )}

      {/* Disclaimer */}
      <div className="tc-wall-disclaimer">
        <AlertTriangle size={16} />
        <p>
          <strong>Material estimator only.</strong> This tool estimates fencing materials based on your inputs. It does not account for site-specific conditions such as ground slope, soil type, wind zones, or boundary setbacks. Fences over 2m high or in high wind zones may require building consent and specific engineering design under the NZ Building Code. Always confirm requirements with your local council or a licensed building practitioner.
        </p>
      </div>

      {/* Missing categories warning */}
      {missingCategories.length > 0 && (
        <div className="tc-fencing-warning">
          <AlertTriangle size={14} />
          <span>
            Missing fencing products: {missingCategories.join(', ')}.
            {missingCategories.length === 3 ? ' Using demo products.' : ' Some components may be unavailable.'}
          </span>
        </div>
      )}

      {/* Full-width Visual Preview */}
      {focusedSection && (() => {
        const focusedDetail = preview.sectionDetails.find(d => d.section.id === focusedSection.id);
        const actualBays = focusedDetail?.numberOfBays || 1;
        const displayBays = Math.min(previewBays, actualBays);
        return (
        <div className="tc-fence-preview">
          {/* Toolbar: section tabs + controls */}
          <div className="tc-fence-preview__toolbar">
            {sections.length > 1 && (
              <div className="tc-section-tabs">
                {sections.map((sec, i) => (
                  <button
                    key={sec.id}
                    type="button"
                    className={`tc-section-tabs__btn ${sec.id === focusedSection.id ? 'tc-section-tabs__btn--active' : ''}`}
                    onClick={() => setFocusedSectionId(sec.id)}
                  >
                    {sec.label || `Section ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
            <div className="tc-bays-control">
              <span className="tc-bays-control__prefix">Preview bays</span>
              <button
                type="button"
                className="tc-bays-control__btn"
                disabled={displayBays <= 1}
                onClick={() => setPreviewBays(b => Math.max(1, b - 1))}
              >
                −
              </button>
              <span className="tc-bays-control__label">{displayBays} of {actualBays}</span>
              <button
                type="button"
                className="tc-bays-control__btn"
                disabled={displayBays >= actualBays}
                onClick={() => setPreviewBays(b => Math.min(actualBays, b + 1))}
              >
                +
              </button>
            </div>
            <div className="tc-view-toggle">
              <button
                type="button"
                className={`tc-view-toggle__btn ${viewSide === 'front' ? 'tc-view-toggle__btn--active' : ''}`}
                onClick={() => setViewSide('front')}
              >
                Front
              </button>
              <button
                type="button"
                className={`tc-view-toggle__btn ${viewSide === 'back' ? 'tc-view-toggle__btn--active' : ''}`}
                onClick={() => setViewSide('back')}
              >
                Back
              </button>
            </div>
          </div>
          {/* Body: sidebar + elevation */}
          <div className="tc-fence-preview__body">
            <div className="tc-fence-preview__sidebar">
              <div className="tc-fencing-style-tabs">
                {Object.entries(CLADDING_STYLES).map(([key, s]) => (
                  <button
                    key={key}
                    className={`tc-fencing-style-tab ${focusedSection.style === key ? 'tc-fencing-style-tab--active' : ''}`}
                    onClick={() => {
                      const id = focusedSection.id;
                      setSections(prev => prev.map(sec => sec.id === id ? { ...sec, style: key } : sec));
                    }}
                    title={s.label}
                    type="button"
                  >
                    <StylePatternIcon type={key} active={focusedSection.style === key} />
                    <span>{s.label}</span>
                    {key !== 'horizontal_slat' && (
                      <div className="tc-fencing-style-tab__popover" aria-hidden="true">
                        <FenceCrossSection
                          style={key}
                          palingWidth={previewProps.boardW}
                          palingThickness={previewProps.boardThickness}
                          gap={components.cladding.gap}
                          overlap={components.cladding.overlap}
                          railWidth={previewProps.railW}
                          railThickness={previewProps.railH}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="tc-fence-preview__elevation">
              <FenceElevation
                height={focusedSection.height}
                undergroundDepth={components.posts.depthOverride}
                postSpacing={focusedDetail?.bayWidth || components.posts.spacing}
                lastBayWidth={displayBays === actualBays && focusedDetail?.lastBayLength ? Math.round(focusedDetail.lastBayLength) : null}
                postWidth={previewProps.postW}
                railWidth={previewProps.railW}
                railHeight={previewProps.railH}
                railCount={components.rails.countOverride ?? (focusedSection.height <= 1500 ? 2 : 3)}
                palingWidth={previewProps.boardW}
                palingThickness={previewProps.boardThickness}
                gap={components.cladding.gap}
                overlap={components.cladding.overlap}
                boardWidth={previewProps.boardW}
                boardGap={components.cladding.gap}
                style={focusedSection.style}
                showCapping={components.capping.enabled}
                bays={displayBays}
                viewSide={viewSide}
              />
            </div>
          </div>
        </div>
        );
      })()}

      {/* Sections + Components side by side */}
      <div className="tc-fencing-columns">
        {/* Left: Fence Sections */}
        <div className="tc-fencing-columns__sections">
          <div className="tc-section">
            <h3 className="tc-section__title">
              <span>Fence Sections</span>
              <span className="tc-section__subtitle">
                {preview.totalLengthM > 0 ? `${preview.totalLengthM.toFixed(1)}m total` : 'Enter fence runs'}
              </span>
            </h3>
            <p className="tc-inline-hint">Add one row per continuous fence run. Click a row to preview it above.</p>
            <div className="tc-fencing-sections-header">
              <span>Label</span>
              <span>Length</span>
              <span>Height</span>
              <span></span>
            </div>
            <div className="tc-fencing-sections">
              {sections.map(section => (
                <FenceSectionRow
                  key={section.id}
                  section={section}
                  onChange={(updated) => updateSection(section.id, updated)}
                  onRemove={() => removeSection(section.id)}
                  canRemove={sections.length > 1}
                  onFocus={setFocusedSectionId}
                />
              ))}
            </div>
            <button onClick={addSection} className="tc-add-btn">
              <Plus size={14} />
              Add Section
            </button>
          </div>
        </div>

        {/* Right: Components */}
        <div className="tc-fencing-columns__components">
          <div className="tc-section">
            <h3 className="tc-section__title">
              <span>Components</span>
            </h3>
            <p className="tc-inline-hint">Select a product for each fence component. Posts and rails are required.</p>

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

            {/* Posts */}
            <FenceComponentRow
              label="Posts"
              products={postProducts}
              selectedId={components.posts.productId}
              onChange={(v) => setComponents(c => ({ ...c, posts: { ...c.posts, ...v } }))}
              preview={preview.totalPosts > 0 ? `${preview.totalPosts} posts` : null}
            >
              <div className="tc-fencing-component-extras">
                <div className="tc-fencing-field">
                  <label>Spacing</label>
                  <div className="tc-fencing-field-input">
                    <input
                      type="number"
                      value={components.posts.spacing}
                      onChange={(e) => setComponents(c => ({
                        ...c, posts: { ...c.posts, spacing: parseInt(e.target.value) || 2400 }
                      }))}
                    />
                    <span>mm</span>
                  </div>
                </div>
                <div className="tc-fencing-field">
                  <label>Depth</label>
                  <div className="tc-fencing-field-input">
                    <input
                      type="number"
                      min={0}
                      value={components.posts.depthOverride ?? Math.round((focusedSection?.height || 1800) / 3)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const autoDepth = Math.round((focusedSection?.height || 1800) / 3);
                        setComponents(c => ({
                          ...c,
                          posts: {
                            ...c.posts,
                            depthOverride: (isNaN(val) || val === autoDepth) ? null : val,
                          },
                        }));
                      }}
                    />
                    <span>mm</span>
                  </div>
                  {components.posts.depthOverride == null && (
                    <span className="tc-hint"> (auto)</span>
                  )}
                </div>
                <div className={`tc-setting-pill ${components.posts.equalSpacing ? 'tc-setting-pill--active' : ''}`}
                  onClick={() => setComponents(c => ({
                    ...c, posts: { ...c.posts, equalSpacing: !c.posts.equalSpacing }
                  }))}
                  role="button" tabIndex={0}
                >
                  <AlignHorizontalDistributeCenter size={13} />
                  <span>Equal spacing</span>
                  {components.posts.equalSpacing && preview.sectionDetails[0] && (
                    <span className="tc-setting-pill__badge">{preview.sectionDetails[0].bayWidth}mm</span>
                  )}
                </div>
                {preview.sectionDetails[0]?.postLength && (
                  <div className="tc-setting-pill tc-setting-pill--readonly">
                    <Ruler size={13} />
                    <span>Post length</span>
                    <span className="tc-setting-pill__badge">{formatLength(preview.sectionDetails[0].postLength, unit)}</span>
                  </div>
                )}
                {preview.hasPostLengthWarning && (
                  <div className="tc-fencing-field-warning">
                    <AlertTriangle size={12} />
                    Post length exceeds available stock
                  </div>
                )}
              </div>
            </FenceComponentRow>

            {/* Rails */}
            <FenceComponentRow
              label="Rails"
              products={railProducts}
              selectedId={components.rails.productId}
              onChange={(v) => setComponents(c => ({ ...c, rails: { ...c.rails, ...v } }))}
              preview={preview.totalRailCuts > 0 ? `${preview.totalRailCuts} rail cuts` : null}
            >
              <div className="tc-fencing-component-extras">
                <div className="tc-fencing-field">
                  <label>Rails per bay</label>
                  <div className="tc-fencing-field-input">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={components.rails.countOverride ?? (sections[0]?.height <= 1500 ? 2 : 3)}
                      onChange={(e) => setComponents(c => ({
                        ...c, rails: { ...c.rails, countOverride: parseInt(e.target.value) || 2 }
                      }))}
                    />
                  </div>
                </div>
                <div className={`tc-setting-pill ${components.rails.mitre ? 'tc-setting-pill--active' : ''}`}
                  onClick={() => setComponents(c => ({
                    ...c, rails: { ...c.rails, mitre: !c.rails.mitre }
                  }))}
                  role="button" tabIndex={0}
                >
                  <Scissors size={13} />
                  <span>45° mitre</span>
                  {components.rails.mitre && railProducts.find(p => p.id === components.rails.productId) && (
                    <span className="tc-setting-pill__badge">
                      {parseRailDepth(railProducts.find(p => p.id === components.rails.productId).profile)}mm nesting
                    </span>
                  )}
                </div>
              </div>
            </FenceComponentRow>

            {/* Cladding */}
            <FenceComponentRow
              label="Cladding"
              products={claddingProducts}
              selectedId={components.cladding.productId}
              onChange={(v) => setComponents(c => ({ ...c, cladding: { ...c.cladding, ...v } }))}
              preview={
                preview.totalPalings > 0 ? `${preview.totalPalings} palings` :
                preview.totalCladdingCuts > 0 ? `${preview.totalCladdingCuts} board cuts` : null
              }
            >
              <div className="tc-fencing-component-extras">
                <div className="tc-fencing-field">
                  <label>Gap between boards</label>
                  <div className="tc-fencing-field-input">
                    <input
                      type="number"
                      min={0}
                      value={components.cladding.gap}
                      onChange={(e) => setComponents(c => ({
                        ...c, cladding: { ...c.cladding, gap: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <span>mm</span>
                  </div>
                </div>
                {sections.some(s => s.style === 'vertical_lapped') && (
                  <div className="tc-fencing-field">
                    <label>Overlap</label>
                    <div className="tc-fencing-field-input">
                      <input
                        type="number"
                        min={0}
                        value={components.cladding.overlap}
                        onChange={(e) => setComponents(c => ({
                          ...c, cladding: { ...c.cladding, overlap: parseInt(e.target.value) || 25 }
                        }))}
                      />
                      <span>mm</span>
                    </div>
                  </div>
                )}
              </div>
            </FenceComponentRow>

            {/* Capping */}
            <FenceComponentRow
              label="Capping"
              products={cappingProducts}
              selectedId={components.capping.productId}
              onChange={(v) => setComponents(c => ({ ...c, capping: { ...c.capping, ...v } }))}
              optional
              enabled={components.capping.enabled}
              onToggle={(v) => setComponents(c => ({ ...c, capping: { ...c.capping, enabled: v } }))}
            />
          </div>
        </div>
      </div>

      {/* Live Preview stats — full width */}
      {preview.totalLengthM > 0 && (
        <div className="tc-fencing-preview">
          <div className="tc-fencing-preview-item">
            <span className="tc-fencing-preview-label">Fence</span>
            <span>{preview.totalLengthM.toFixed(1)}m</span>
          </div>
          <div className="tc-fencing-preview-item">
            <span className="tc-fencing-preview-label">Posts</span>
            <span>{preview.totalPosts}</span>
          </div>
          <div className="tc-fencing-preview-item">
            <span className="tc-fencing-preview-label">Rails</span>
            <span>{preview.totalRailCuts}</span>
          </div>
          {preview.totalPalings > 0 && (
            <div className="tc-fencing-preview-item">
              <span className="tc-fencing-preview-label">Palings</span>
              <span>{preview.totalPalings}</span>
            </div>
          )}
          {preview.totalCladdingCuts > 0 && (
            <div className="tc-fencing-preview-item">
              <span className="tc-fencing-preview-label">Boards</span>
              <span>{preview.totalCladdingCuts}</span>
            </div>
          )}
        </div>
      )}

      {/* Calculate — full width */}
      <div className="tc-actions-primary">
        <button
          onClick={calculate}
          className="tc-btn tc-btn--primary tc-btn--lg tc-btn--full"
          disabled={!canCalculate}
          title={!canCalculate ? 'Enter at least one section and select post + rail products' : ''}
        >
          Calculate Fence Plan
        </button>
      </div>
    </div>
  );
}
