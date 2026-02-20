import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Settings, Plus, X, Upload, Download, ChevronDown, AlertTriangle, ClipboardList, Check, Ruler, Maximize2, Minimize2 } from 'lucide-react';
import {
  calculateCuttingPlan,
  groupCuttingPatterns,
  UNITS,
  toDisplayValue,
  toMmValue,
  formatLength,
} from '../lib/cuttingAlgorithm';
import { generateCuttingPlanPDF } from '../lib/generateCuttingPlanPDF';
import html2canvas from 'html2canvas';
import { productToStockLengths, getProductLabel } from '../config/embedConfig';
import FencingCalculator from './FencingCalculator';
import FencingResults from './FencingResults';
import WallCalculator from './WallCalculator';
import WallResults from './WallResults';
import LeadCaptureModal from './LeadCaptureModal';
import { initAnalytics, trackModeSelected, trackProductsSelected, trackCalculationCompleted, trackPdfRequested, trackLeadCaptured, trackSendToYard, getAnalyticsSessionId } from '../lib/analytics';
import { supabasePublic } from '../lib/supabase';
import './CuttingOptimizer.css';

// ============================================
// MODE ICONS
// ============================================
const modeIcons = {
  general: (color) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={9} />
      <circle cx={12} cy={12} r={3} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const rad = (a * Math.PI) / 180;
        const radN = ((a + 20) * Math.PI) / 180;
        return <path key={a} d={`M${12 + 9 * Math.cos(rad)},${12 + 9 * Math.sin(rad)} L${12 + 11 * Math.cos(radN)},${12 + 11 * Math.sin(radN)}`} strokeWidth={1.5} />;
      })}
    </svg>
  ),
  fencing: (color) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={4} width={3} height={17} rx={0.5} />
      <rect x={10.5} y={4} width={3} height={17} rx={0.5} />
      <rect x={18} y={4} width={3} height={17} rx={0.5} />
      <line x1={3} y1={9} x2={21} y2={9} strokeWidth={2} />
      <line x1={3} y1={16} x2={21} y2={16} strokeWidth={2} />
    </svg>
  ),
  walls: (color) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2} y={3} width={20} height={18} rx={0.5} />
      <line x1={2} y1={5.5} x2={22} y2={5.5} />
      <line x1={7} y1={5.5} x2={7} y2={21} />
      <line x1={12} y1={5.5} x2={12} y2={21} />
      <line x1={17} y1={5.5} x2={17} y2={21} />
      <line x1={2} y1={13} x2={22} y2={13} />
    </svg>
  ),
  decking: (color) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1={2} y1={6} x2={22} y2={6} />
      <line x1={2} y1={10} x2={22} y2={10} />
      <line x1={2} y1={14} x2={22} y2={14} />
      <line x1={2} y1={18} x2={22} y2={18} />
      <line x1={7} y1={5} x2={7} y2={19} strokeWidth={1} strokeDasharray="2 2" opacity={0.4} />
      <line x1={17} y1={5} x2={17} y2={19} strokeWidth={1} strokeDasharray="2 2" opacity={0.4} />
    </svg>
  ),
};

// ============================================
// CALCULATING OVERLAY
// ============================================

const CALC_HINTS = [
  'Doing the maths so you don\'t have to',
  'Saving you a trip back to the yard',
  'Working harder than your apprentice',
  'Squeezing every last mm out of your stock',
  'Making sure nothing goes to waste',
];

function CalculatingOverlay() {
  const [hint] = useState(() => CALC_HINTS[Math.floor(Math.random() * CALC_HINTS.length)]);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="tc-calculating-overlay">
      <div className="tc-calculating-spinner" />
      <span>Calculating…</span>
      {showHint && (
        <span className="tc-calculating-hint">{hint}</span>
      )}
    </div>
  );
}

// ============================================
// SETTINGS POPOVER
// ============================================

function SettingsPopover({ settings, setSettings, unit, setUnit, onClose }) {
  const toDisplay = (mm) => toDisplayValue(mm, unit);
  const handleNumberInput = (value) => (value === '' ? 0 : toMmValue(parseFloat(value) || 0, unit));

  return (
    <>
      <div className="tc-settings-backdrop" onClick={onClose} />
      <div className="tc-settings-popover">
        <h3>Settings</h3>

        <div className="tc-settings-field">
          <label>Units</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="mm">Millimeters (mm)</option>
            <option value="m">Meters (m)</option>
            <option value="inch">Inches (in)</option>
            <option value="foot">Feet (ft)</option>
          </select>
        </div>

        <div className="tc-settings-row">
          <div className="tc-settings-field">
            <label>Min Offcut</label>
            <input
              type="number"
              step="any"
              value={toDisplay(settings.minOffcut)}
              onChange={(e) =>
                setSettings({ ...settings, minOffcut: handleNumberInput(e.target.value) })
              }
            />
          </div>
          <div className="tc-settings-field">
            <label>Saw Kerf</label>
            <input
              type="number"
              step="any"
              value={toDisplay(settings.kerf)}
              onChange={(e) =>
                setSettings({ ...settings, kerf: handleNumberInput(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="tc-settings-field">
          <label>End Trim (per end)</label>
          <input
            type="number"
            step="any"
            value={toDisplay(settings.endTrim)}
            onChange={(e) =>
              setSettings({ ...settings, endTrim: handleNumberInput(e.target.value) })
            }
          />
          <span className="tc-hint">Unusable material at each end</span>
        </div>

        <button onClick={onClose} className="tc-btn tc-btn--secondary tc-settings-done">
          Done
        </button>
      </div>
    </>
  );
}

// ============================================
// IMPORT MODAL
// ============================================

function ImportModal({ onImport, onClose, unit }) {
  const [mode, setMode] = useState('paste');
  const [importText, setImportText] = useState('');
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const parseImportText = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsed = [];

    for (const line of lines) {
      let length, qty;

      if (line.match(/^[a-zA-Z]/)) continue;

      const xMatch = line.match(/^\s*([\d.]+)\s*[x×X]\s*(\d+)\s*$/);
      if (xMatch) {
        length = parseFloat(xMatch[1]);
        qty = parseInt(xMatch[2]);
      }

      if (!length) {
        const csvMatch = line.match(/^\s*([\d.]+)\s*,\s*(\d+)\s*$/);
        if (csvMatch) {
          length = parseFloat(csvMatch[1]);
          qty = parseInt(csvMatch[2]);
        }
      }

      if (!length) {
        const tabMatch = line.match(/^\s*([\d.]+)\s+(\d+)\s*$/);
        if (tabMatch) {
          length = parseFloat(tabMatch[1]);
          qty = parseInt(tabMatch[2]);
        }
      }

      if (!length) {
        const singleMatch = line.match(/^\s*([\d.]+)\s*$/);
        if (singleMatch) {
          length = parseFloat(singleMatch[1]);
          qty = 1;
        }
      }

      if (length && length > 0) {
        parsed.push({ length, qty: qty || 1 });
      }
    }

    return parsed;
  };

  const processText = (text) => {
    setImportText(text);
    setError('');

    if (text.trim()) {
      const parsed = parseImportText(text);
      if (parsed.length === 0) {
        setError('Could not parse any valid cuts from the input');
        setPreview([]);
      } else {
        setPreview(parsed);
      }
    } else {
      setPreview([]);
    }
  };

  const handleFileRead = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a CSV or TXT file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      processText(e.target.result);
      setMode('paste');
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileRead(e.dataTransfer.files[0]);
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview);
      onClose();
    }
  };

  return (
    <div className="tc-modal-overlay">
      <div className="tc-modal">
        <div className="tc-modal-header">
          <h2>Import Cut List</h2>
          <button onClick={onClose} className="tc-btn tc-btn--icon">
            <X size={16} />
          </button>
        </div>

        <div className="tc-import-tabs">
          <button
            className={`tc-import-tab ${mode === 'upload' ? 'tc-import-tab--active' : ''}`}
            onClick={() => setMode('upload')}
          >
            <Upload size={16} />
            Upload File
          </button>
          <button
            className={`tc-import-tab ${mode === 'paste' ? 'tc-import-tab--active' : ''}`}
            onClick={() => setMode('paste')}
          >
            Paste Text
          </button>
        </div>

        <div className="tc-modal-body">
          {mode === 'upload' ? (
            <>
              <div
                className={`tc-dropzone ${isDragging ? 'tc-dropzone--active' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => document.getElementById('tc-csv-input').click()}
              >
                <Upload size={32} strokeWidth={1.5} />
                <p className="tc-dropzone-title">Drop your CSV file here</p>
                <p className="tc-dropzone-hint">or click to browse</p>
                <span className="tc-dropzone-badge">Supports .csv and .txt files</span>
                <input
                  id="tc-csv-input"
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => handleFileRead(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
              <p className="tc-hint" style={{ marginTop: '0.5rem' }}>
                CSV should have columns: <code>length</code>, <code>qty</code>
              </p>
            </>
          ) : (
            <>
              <p className="tc-hint">
                Paste your cut list below. Formats: <code>1200 x 4</code> · <code>1200,4</code> · <code>1200</code>
              </p>
              <textarea
                className="tc-import-textarea"
                value={importText}
                onChange={(e) => processText(e.target.value)}
                placeholder={`Enter cuts here...\n1200 x 4\n1500 x 2\n800 x 6`}
                rows={8}
              />
            </>
          )}

          {error && <div className="tc-error-msg">{error}</div>}

          {preview.length > 0 && (
            <div className="tc-import-preview">
              <h4>Preview ({preview.length} cuts, {preview.reduce((sum, c) => sum + c.qty, 0)} total pieces)</h4>
              <div className="tc-import-preview-list">
                {preview.map((cut, idx) => (
                  <span key={idx} className="tc-import-preview-item">
                    {cut.length} × {cut.qty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="tc-modal-footer">
          <button onClick={onClose} className="tc-btn tc-btn--secondary">Cancel</button>
          <button
            onClick={handleImport}
            className="tc-btn tc-btn--primary"
            disabled={preview.length === 0}
          >
            <Upload size={16} />
            Import {preview.length > 0 && `(${preview.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCT SELECTOR
// ============================================

function TreatmentBadge({ treatment }) {
  if (!treatment || treatment === 'None') return null;
  const isH = treatment.startsWith('H');
  return (
    <span className={`tc-ps-badge ${isH ? 'tc-ps-badge--h' : 'tc-ps-badge--natural'}`}>
      {treatment}
    </span>
  );
}

function ProductSelector({ products, presets, activePreset, selectedProduct, onPresetChange, onProductChange, adjustForGst, showGstInclusive }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Derive category chips from presets
  const categoryChips = useMemo(() => {
    return [
      { key: 'custom', label: 'All' },
      ...presets.filter(p => p.id !== 'custom').map(p => ({ key: p.id, label: p.name })),
    ];
  }, [presets]);

  // Filter products by active preset + search
  const filtered = useMemo(() => {
    const activePresetData = presets.find(p => p.id === activePreset);
    let pool = activePresetData?.productIds?.length > 0
      ? products.filter(p => activePresetData.productIds.includes(p.id))
      : products;

    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(p =>
        getProductLabel(p).toLowerCase().includes(q) ||
        p.profile?.toLowerCase().includes(q) ||
        p.treatment?.toLowerCase().includes(q) ||
        p.species?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.grade?.toLowerCase().includes(q)
      );
    }
    return pool;
  }, [products, presets, activePreset, search]);

  // Close on click-outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (product) => {
    onProductChange(product);
    setIsOpen(false);
    setSearch('');
  };

  const fmtPrice = (p) => {
    const price = adjustForGst ? adjustForGst(p.pricePerMeter) : p.pricePerMeter;
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="tc-ps" ref={containerRef}>
      {/* Trigger button */}
      <button
        className={`tc-ps-trigger ${isOpen ? 'tc-ps-trigger--open' : ''}`}
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 60); }}
      >
        {selectedProduct ? (
          <>
            {selectedProduct.imageUrl && (
              <img src={selectedProduct.imageUrl} alt="" className="tc-ps-trigger__thumb" />
            )}
            <div className="tc-ps-trigger__dims">{selectedProduct.profile}</div>
            <div className="tc-ps-trigger__info">
              <div className="tc-ps-trigger__name">{getProductLabel(selectedProduct)}</div>
              <div className="tc-ps-trigger__meta">
                <TreatmentBadge treatment={selectedProduct.treatment} />
                {selectedProduct.grade && selectedProduct.grade !== '—' && (
                  <span className="tc-ps-badge tc-ps-badge--grade">{selectedProduct.grade}</span>
                )}
                <span>{selectedProduct.lengths?.map(l => `${l / 1000}m`).join(' · ')}</span>
              </div>
            </div>
            {selectedProduct.pricePerMeter > 0 && (
              <div className="tc-ps-trigger__price">
                <span className="tc-ps-trigger__price-value">{fmtPrice(selectedProduct)}/m</span>
                {adjustForGst && <span className="tc-ps-trigger__price-gst">{showGstInclusive ? 'incl' : 'excl'} GST</span>}
              </div>
            )}
          </>
        ) : (
          <div className="tc-ps-trigger__placeholder">Select a product…</div>
        )}
        <ChevronDown size={14} className="tc-ps-trigger__chevron" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="tc-ps-dropdown">
          {/* Search + category chips */}
          <div className="tc-ps-dropdown__header">
            <div className="tc-ps-search">
              <svg width={14} height={14} viewBox="0 0 16 16" fill="none" className="tc-ps-search__icon">
                <circle cx={7} cy={7} r={5} stroke="currentColor" strokeWidth={1.5} />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search size, treatment, name…"
                className="tc-ps-search__input"
              />
            </div>
            <div className="tc-ps-chips">
              {categoryChips.map(c => (
                <button
                  key={c.key}
                  className={`tc-ps-chip ${activePreset === c.key ? 'tc-ps-chip--active' : ''}`}
                  onClick={() => onPresetChange(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="tc-ps-columns">
            <div className="tc-ps-col-dims">Size</div>
            <div className="tc-ps-col-name">Product</div>
            <div className="tc-ps-col-price">$/m</div>
            <div className="tc-ps-col-lengths">Lengths</div>
          </div>

          {/* Product rows */}
          <div className="tc-ps-list">
            {filtered.length === 0 ? (
              <div className="tc-ps-empty">No products found</div>
            ) : (
              filtered.map(p => {
                const isSel = p.id === selectedProduct?.id;
                return (
                  <button
                    key={p.id}
                    className={`tc-ps-row ${isSel ? 'tc-ps-row--selected' : ''}`}
                    onClick={() => handleSelect(p)}
                  >
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" className="tc-ps-row__thumb" />
                    )}
                    <div className={`tc-ps-row__dims ${isSel ? 'tc-ps-row__dims--selected' : ''}`}>
                      {p.profile}
                    </div>
                    <div className="tc-ps-row__info">
                      <div className="tc-ps-row__name">{getProductLabel(p)}</div>
                      <div className="tc-ps-row__meta">
                        <TreatmentBadge treatment={p.treatment} />
                        {p.grade && p.grade !== '—' && (
                          <span className="tc-ps-badge tc-ps-badge--grade">{p.grade}</span>
                        )}
                      </div>
                    </div>
                    <div className={`tc-ps-row__price ${isSel ? 'tc-ps-row__price--selected' : ''}`}>
                      {fmtPrice(p)}
                    </div>
                    <div className="tc-ps-row__lengths">
                      {p.lengths?.map(l => `${l / 1000}m`).join('  ')}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="tc-ps-footer">
            <span>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
            {search && <span>matching "{search}"</span>}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================
// MAIN COMPONENT
// ============================================

export default function CuttingOptimizer({ config }) {
  const { tenant, theme, products, presets, settings: configSettings } = config;

  // State
  const [unit, setUnit] = useState('mm');
  const [activePreset, setActivePreset] = useState('custom');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockLengths, setStockLengths] = useState([
    { id: 1, length: 6000, costOverride: null, available: null },
    { id: 2, length: 4800, costOverride: null, available: null },
    { id: 3, length: 3600, costOverride: null, available: null },
  ]);
  const [requiredCuts, setRequiredCuts] = useState([
    { id: 1, length: 2400, qty: 2 },
    { id: 2, length: 1800, qty: 3 },
    { id: 3, length: 1200, qty: 4 },
  ]);
  const [settings, setSettings] = useState({
    minOffcut: 200,
    kerf: 3,
    endTrim: 0,
  });
  const [jobDetails, setJobDetails] = useState({
    jobNumber: '',
    productName: '',
    customer: '',
  });
  const [result, setResult] = useState(null);
  const [nextStockId, setNextStockId] = useState(4);
  const [nextCutId, setNextCutId] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const showCosting = configSettings.showCosting ?? true;
  const [showImport, setShowImport] = useState(false);
  const [showGstInclusive, setShowGstInclusive] = useState(false);
  const [maxStockLength, setMaxStockLength] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [activeMode, setActiveMode] = useState('general');
  const [fencingResults, setFencingResults] = useState(null);
  const [wallResults, setWallResults] = useState(null);
  const previewControlRef = useRef(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadCapturedThisSession, setLeadCapturedThisSession] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shmakecutRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = shmakecutRef.current || document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Feature flags (on by default, tenant can disable)
  const enableLeadCapture = configSettings.enableLeadCapture !== false;
  const enableSendToYard = configSettings.enableSendToYard !== false;

  // GST config from tenant settings
  const gstMode = configSettings.gstMode || 'excl';
  const gstRate = configSettings.gstRate || 0.15;

  // Initialize analytics + first preset
  useEffect(() => {
    initAnalytics(tenant.id);
    if (presets.length > 0) {
      applyPreset(presets[0].id);
    }
  }, []);

  // Auto-recalculate when GST toggle changes (if results exist)
  useEffect(() => {
    if (result) calculate();
  }, [showGstInclusive]);

  const currentUnit = UNITS[unit];
  const toDisplay = (mm) => toDisplayValue(mm, unit);
  const handleNumberInput = (value) => (value === '' ? 0 : toMmValue(parseFloat(value) || 0, unit));
  const formatCurrency = (value) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // GST adjustment: convert base price to display price
  const adjustForGst = useCallback((basePrice) => {
    if (gstMode === 'excl' && showGstInclusive) {
      return basePrice * (1 + gstRate);
    } else if (gstMode === 'incl' && !showGstInclusive) {
      return basePrice / (1 + gstRate);
    }
    return basePrice;
  }, [gstMode, gstRate, showGstInclusive]);

  // Stock cost calculation
  const getStockCost = (lengthMm, costOverride) => {
    // Manual overrides are assumed to be in the user's current display mode — no GST adjustment
    if (costOverride !== null && costOverride !== undefined && costOverride !== '') {
      return parseFloat(costOverride) || 0;
    }
    const rate = selectedProduct?.pricePerMeter || 0;
    return adjustForGst((lengthMm / 1000) * rate);
  };

  // Apply a preset - load its settings and auto-select default product
  const applyPreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);

    // Apply preset settings
    if (preset.settings) {
      setSettings(s => ({
        ...s,
        minOffcut: preset.settings.minOffcut ?? s.minOffcut,
        kerf: preset.settings.kerf ?? s.kerf,
        endTrim: preset.settings.endTrim ?? s.endTrim,
      }));
    }

    // Auto-select default product
    if (preset.defaultProductId) {
      const product = products.find(p => p.id === preset.defaultProductId);
      if (product) {
        selectProduct(product);
      }
    } else if (presetId === 'custom') {
      setSelectedProduct(null);
    }
  };

  // Select a product and populate stock lengths from its catalogue
  const selectProduct = (product) => {
    setSelectedProduct(product);
    if (product) {
      trackProductsSelected(activeMode);
      const newStock = productToStockLengths(product);
      setStockLengths(newStock);
      setNextStockId(newStock.length + 1);

      // Update job product name
      setJobDetails(j => ({
        ...j,
        productName: getProductLabel(product),
      }));
    }
  };

  // Stock length CRUD
  const addStockLength = () => {
    setStockLengths([
      ...stockLengths,
      { id: nextStockId, length: 2400, costOverride: null, available: null },
    ]);
    setNextStockId(nextStockId + 1);
  };
  const removeStockLength = (id) => setStockLengths(stockLengths.filter(s => s.id !== id));
  const updateStockLength = (id, field, value) =>
    setStockLengths(stockLengths.map(s => (s.id === id ? { ...s, [field]: value } : s)));

  // Cut CRUD
  const addCut = () => {
    setRequiredCuts([...requiredCuts, { id: nextCutId, length: 500, qty: 1 }]);
    setNextCutId(nextCutId + 1);
  };
  const removeCut = (id) => setRequiredCuts(requiredCuts.filter(c => c.id !== id));
  const updateCut = (id, field, value) =>
    setRequiredCuts(requiredCuts.map(c => (c.id === id ? { ...c, [field]: value } : c)));

  // Calculate (general mode)
  const calculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const filteredStock = maxStockLength
        ? stockLengths.filter(s => s.length <= maxStockLength)
        : stockLengths;
      const stockInput = (filteredStock.length > 0 ? filteredStock : stockLengths).map(s => ({
        length: s.length,
        cost: getStockCost(s.length, s.costOverride),
        available: s.available,
      }));

      const res = calculateCuttingPlan({
        stockLengths: stockInput,
        requiredCuts: requiredCuts.map(c => ({ length: c.length, qty: c.qty })),
        minOffcut: settings.minOffcut,
        kerf: settings.kerf,
        endTrim: settings.endTrim,
      });

      if (res.summary) {
        const totalCuts = res.plan.reduce((sum, piece) => sum + piece.cuts.length, 0);
        res.summary.totalCutsMade = totalCuts;
        res.summary.totalCost = res.summary.totalStockCost;
      }
      setResult(res);
      setIsCalculating(false);
      trackCalculationCompleted('general', {
        totalCuts: res.summary?.totalCutsMade,
        stockRequired: res.summary?.stockRequired,
        efficiency: res.summary?.overallEfficiency,
        estimatedCost: res.summary?.totalCost,
      });
    }, 0);
  };

  // Import
  const handleImport = (importedCuts) => {
    const newCuts = importedCuts.map((cut, idx) => ({
      id: nextCutId + idx,
      length: toMmValue(cut.length, unit),
      qty: cut.qty,
    }));
    setRequiredCuts([...requiredCuts, ...newCuts]);
    setNextCutId(nextCutId + importedCuts.length);
  };

  // Save current plan and reset for next product
  const saveCurrentPlan = () => {
    if (!result) return;
    setSavedPlans(prev => [...prev, {
      id: Date.now(),
      label: getProductLabel(selectedProduct) || jobDetails.productName || `Plan ${prev.length + 1}`,
      product: selectedProduct,
      stockLengths: structuredClone(stockLengths),
      requiredCuts: structuredClone(requiredCuts),
      settings: { ...settings },
      result: structuredClone(result),
      groupedPlan: structuredClone(groupedPlan),
      unit,
    }]);
    // Reset for next product
    setResult(null);
    setRequiredCuts([{ id: 1, length: 500, qty: 1 }]);
    setNextCutId(2);
  };

  const removeSavedPlan = (id) => {
    setSavedPlans(prev => prev.filter(p => p.id !== id));
  };

  // Capture preview visuals as images for PDF (cycles through all sections/walls)
  const capturePreviewImages = async () => {
    const images = [];
    const ctrl = previewControlRef.current;

    const captureCurrentPreview = async (label) => {
      const el = document.querySelector('.tc-fence-preview');
      if (!el) return;
      try {
        const canvas = await html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        images.push({
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
          label,
        });
      } catch (e) {
        console.warn('Failed to capture preview:', e);
      }
    };

    if (ctrl && ctrl.items.length > 1) {
      // Multiple sections/walls — cycle through each
      const originalId = ctrl.currentFocusedId;
      for (const item of ctrl.items) {
        ctrl.setFocusedId(item.id);
        await new Promise(resolve => setTimeout(resolve, 300));
        await captureCurrentPreview(item.label);
      }
      // Restore original focus
      ctrl.setFocusedId(originalId);
    } else if (ctrl && ctrl.items.length === 1) {
      await captureCurrentPreview(ctrl.items[0].label);
    } else {
      // Fallback for general mode or no ref
      const defaultLabel = activeMode === 'fencing' ? 'Fence Elevation' : activeMode === 'walls' ? 'Wall Frame' : 'Preview';
      await captureCurrentPreview(defaultLabel);
    }

    return images;
  };

  // PDF export — combines saved plans + current (if calculated)
  const handleDownloadPDF = async () => {
    const previewImages = await capturePreviewImages();

    const pdfCommon = {
      jobDetails,
      unit,
      settings,
      companyData: { name: tenant.name },
      brandingData: { letterhead: tenant.logo, pdfColors: { primary: theme.primary } },
      disclaimer: configSettings.disclaimer,
      formatLength,
      gstLabel: showCosting ? (showGstInclusive ? 'Prices incl. GST' : 'Prices excl. GST') : null,
      previewImages,
    };

    // Fencing mode — use component plans
    if (activeMode === 'fencing' && fencingResults) {
      await generateCuttingPlanPDF({
        ...pdfCommon,
        plans: fencingResults.componentPlans,
        fenceSpec: fencingResults.fenceSpec,
        quantityItems: fencingResults.quantityItems,
        combinedSummary: fencingResults.combinedSummary,
      });
      return;
    }

    // Walls mode — use component plans
    if (activeMode === 'walls' && wallResults) {
      await generateCuttingPlanPDF({
        ...pdfCommon,
        plans: wallResults.componentPlans,
        wallSpec: wallResults.wallSpec,
        combinedSummary: wallResults.combinedSummary,
      });
      return;
    }

    // General mode
    const allPlans = [...savedPlans];
    if (result) {
      allPlans.push({
        id: 'current',
        label: getProductLabel(selectedProduct) || jobDetails.productName || 'Current',
        product: selectedProduct,
        stockLengths,
        requiredCuts,
        settings,
        result,
        groupedPlan,
        unit,
      });
    }
    if (allPlans.length === 0) return;

    await generateCuttingPlanPDF({
      ...pdfCommon,
      plans: allPlans,
    });
  };

  // Build lead payload from current mode's results
  const buildLeadPayload = () => {
    let summaryText = '';
    let estimatedValue = null;
    let specification = {};
    let cutList = {};

    if (activeMode === 'general' && result) {
      const productLabel = getProductLabel(selectedProduct) || 'Custom';
      summaryText = `${productLabel} — ${result.summary?.totalCutsMade || 0} pieces, ${result.summary?.overallEfficiency || 0}% efficiency`;
      estimatedValue = showCosting ? (result.summary?.totalCost || null) : null;
      specification = { selectedProduct, stockLengths, requiredCuts, settings, jobDetails };
      cutList = { result, savedPlans };
    } else if (activeMode === 'fencing' && fencingResults) {
      const cs = fencingResults.combinedSummary;
      summaryText = `${cs.totalLengthM?.toFixed(1) || '?'}m fence, ${fencingResults.fenceSpec?.sections?.length || 1} section${(fencingResults.fenceSpec?.sections?.length || 1) !== 1 ? 's' : ''}`;
      estimatedValue = showCosting ? (cs.totalCost || null) : null;
      specification = { fenceSpec: fencingResults.fenceSpec };
      cutList = { componentPlans: fencingResults.componentPlans, combinedSummary: cs };
    } else if (activeMode === 'walls' && wallResults) {
      const cs = wallResults.combinedSummary;
      const wallCount = wallResults.wallSpec?.walls?.length || 1;
      summaryText = `Wall frame — ${wallCount} wall${wallCount !== 1 ? 's' : ''}`;
      estimatedValue = showCosting ? (cs.totalCost || null) : null;
      specification = { wallSpec: wallResults.wallSpec };
      cutList = { componentPlans: wallResults.componentPlans, combinedSummary: cs };
    }

    return { summaryText, estimatedValue, specification, cutList };
  };

  // Gate function: show lead capture modal or download directly
  const handleExportAction = () => {
    trackPdfRequested(activeMode);

    if (!enableLeadCapture || leadCapturedThisSession) {
      handleDownloadPDF();
      return;
    }

    setShowLeadCapture(true);
  };

  // Handle lead capture form submission (action comes from modal: 'pdf' or 'send_to_yard')
  const handleLeadSubmit = async (leadData) => {
    const { action, email, name, phone, notes } = leadData;
    const capturePoint = action === 'send_to_yard' ? 'send_to_yard' : 'pdf_export';
    const { summaryText, estimatedValue, specification, cutList } = buildLeadPayload();

    if (supabasePublic && tenant.id !== 'demo') {
      try {
        await supabasePublic.from('cut_leads').insert({
          tenant_id: tenant.id,
          session_id: getAnalyticsSessionId(),
          name,
          email,
          phone,
          notes,
          capture_point: capturePoint,
          mode: activeMode,
          summary_text: summaryText,
          estimated_value: estimatedValue,
          specification,
          cut_list: cutList,
        });
      } catch (e) {
        console.warn('shmakeCut: Failed to save lead', e);
      }
    }

    if (action === 'send_to_yard') {
      trackSendToYard(activeMode);
      trackLeadCaptured(activeMode, 'send_to_yard');
    } else {
      trackLeadCaptured(activeMode, 'pdf_export');
    }

    setLeadCapturedThisSession(true);
    setShowLeadCapture(false);

    // PDF downloads in both paths
    handleDownloadPDF();

    // Show send confirmation if they sent to yard
    if (action === 'send_to_yard') {
      setShowSendConfirmation(true);
    }
  };

  const groupedPlan = useMemo(
    () => (result?.plan ? groupCuttingPatterns(result.plan) : []),
    [result]
  );

  // Visual bar renderer
  const renderStockBar = (piece) => {
    const segments = [];
    piece.cuts.forEach((cut, idx) => {
      const widthPercent = (cut.actual / piece.stockLength) * 100;
      const mitreClasses = [
        'tc-bar__cut',
        cut.mitreLeft ? 'tc-bar__cut--mitre-left' : '',
        cut.mitreRight ? 'tc-bar__cut--mitre-right' : '',
      ].filter(Boolean).join(' ');
      segments.push(
        <div key={`cut-${idx}`} className={mitreClasses} style={{ width: `${widthPercent}%` }}>
          {toDisplay(cut.actual)}
        </div>
      );
      if (idx < piece.cuts.length - 1 && piece.kerfLoss > 0) {
        const kerfPercent = (settings.kerf / piece.stockLength) * 100;
        segments.push(
          <div key={`kerf-${idx}`} className="tc-bar__kerf" style={{ width: `${kerfPercent}%` }} />
        );
      }
    });
    if (piece.offcut > 0) {
      const offcutPercent = (piece.offcut / piece.stockLength) * 100;
      segments.push(
        <div
          key="offcut"
          className={`tc-bar__offcut ${piece.isUsableOffcut ? 'tc-bar__offcut--usable' : 'tc-bar__offcut--scrap'}`}
          style={{ width: `${offcutPercent}%` }}
        >
          {toDisplay(piece.offcut)}
        </div>
      );
    }
    return segments;
  };

  return (
    <div ref={shmakecutRef} className={`shmakecut${isFullscreen ? ' tc-fullscreen' : ''}`}>
      {isCalculating && (
        <CalculatingOverlay />
      )}
      {showImport && (
        <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} unit={unit} />
      )}

      {showLeadCapture && (
        <LeadCaptureModal
          tenantName={tenant.name}
          enableSendToYard={enableSendToYard}
          onSubmit={handleLeadSubmit}
          onClose={() => setShowLeadCapture(false)}
        />
      )}

      {showSendConfirmation && (
        <div className="tc-modal-overlay" onClick={() => setShowSendConfirmation(false)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-body">
              <div className="tc-send-confirmation">
                <div className="tc-send-confirmation__icon"><Check size={32} /></div>
                <div className="tc-send-confirmation__title">Sent!</div>
                <div className="tc-send-confirmation__text">
                  {tenant.name} will be in touch about your cutting plan.
                </div>
              </div>
            </div>
            <div className="tc-modal-footer" style={{ justifyContent: 'center' }}>
              <button onClick={() => setShowSendConfirmation(false)} className="tc-btn tc-btn--primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode + Config bar */}
      <div className="tc-topbar">
        <div className="tc-mode-selector">
          {[
            { id: 'general', label: 'General' },
            { id: 'fencing', label: 'Fencing' },
            { id: 'walls', label: 'Walls' },
            { id: 'decking', label: 'Decking', disabled: true },
          ].map(mode => {
            const isActive = activeMode === mode.id;
            const isDisabled = mode.disabled;
            const color = isActive ? '#fff' : isDisabled ? '#B0B8C4' : '#4A5568';
            return (
              <button
                key={mode.id}
                className={`tc-mode-tab ${isActive ? 'tc-mode-tab--active' : ''} ${isDisabled ? 'tc-mode-tab--disabled' : ''}`}
                onClick={() => { if (!isDisabled) { setActiveMode(mode.id); trackModeSelected(mode.id); } }}
                disabled={isDisabled}
              >
                <span className="tc-mode-tab__icon">{modeIcons[mode.id](color)}</span>
                <span className="tc-mode-tab__label">{mode.label}</span>
                {isDisabled && <span className="tc-mode-tab__badge">Soon</span>}
              </button>
            );
          })}
        </div>
        <div className="tc-topbar__config">
          {showCosting && (
            <div className="tc-gst-segmented">
              <button
                className={`tc-gst-seg ${!showGstInclusive ? 'tc-gst-seg--active' : ''}`}
                onClick={() => setShowGstInclusive(false)}
              >Excl</button>
              <button
                className={`tc-gst-seg ${showGstInclusive ? 'tc-gst-seg--active' : ''}`}
                onClick={() => setShowGstInclusive(true)}
              >Incl GST</button>
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="tc-btn tc-btn--icon"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className="tc-settings-trigger">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="tc-btn tc-btn--icon"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            {showSettings && (
              <SettingsPopover
                settings={settings}
                setSettings={setSettings}
                unit={unit}
                setUnit={setUnit}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ============ GENERAL MODE ============ */}
      {activeMode === 'general' && (<>

      {/* Saved Plans Panel */}
      {savedPlans.length > 0 && (
        <div className="tc-saved-plans">
          <div className="tc-saved-plans__header">
            <ClipboardList size={14} />
            <span>Project Plans ({savedPlans.length} saved)</span>
          </div>
          <div className="tc-saved-plans__list">
            {savedPlans.map((plan) => (
              <div key={plan.id} className="tc-saved-plan-item">
                <Check size={14} className="tc-saved-plan-item__check" />
                <span className="tc-saved-plan-item__label">{plan.label}</span>
                <span className="tc-saved-plan-item__stats">
                  {plan.result.summary?.totalCutsMade ?? 0} pcs &middot; {plan.result.summary?.overallEfficiency ?? 0}% eff
                </span>
                <button
                  onClick={() => removeSavedPlan(plan.id)}
                  className="tc-btn tc-btn--icon tc-saved-plan-item__remove"
                  title="Remove plan"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Selector */}
      <ProductSelector
        products={products}
        presets={presets}
        activePreset={activePreset}
        selectedProduct={selectedProduct}
        onPresetChange={applyPreset}
        onProductChange={selectProduct}
        adjustForGst={showCosting ? adjustForGst : null}
        showGstInclusive={showGstInclusive}
      />

      {/* Job Details - optional via config */}
      {configSettings.showJobDetails && (
        <div className="tc-job-details">
          <div className="tc-job-field">
            <label>Job #</label>
            <input
              type="text"
              value={jobDetails.jobNumber}
              onChange={(e) => setJobDetails({ ...jobDetails, jobNumber: e.target.value })}
            />
          </div>
          <div className="tc-job-field">
            <label>Product</label>
            <input
              type="text"
              value={jobDetails.productName}
              onChange={(e) => setJobDetails({ ...jobDetails, productName: e.target.value })}
            />
          </div>
          <div className="tc-job-field">
            <label>Customer</label>
            <input
              type="text"
              value={jobDetails.customer}
              onChange={(e) => setJobDetails({ ...jobDetails, customer: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="tc-layout">
        {/* LEFT - Inputs */}
        <div className="tc-layout__left">
          {/* Stock Lengths */}
          <div className="tc-section">
            <h3 className="tc-section__title">
              <span>Stock Lengths</span>
              <span className="tc-section__subtitle">{maxStockLength ? stockLengths.filter(s => s.length <= maxStockLength).length : stockLengths.length} available</span>
            </h3>

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
            <div className="tc-table-header tc-table-header--stock">
              <span className="tc-col-length">Length ({currentUnit.label})</span>
              {showCosting && <span className="tc-col-cost">Cost ($)</span>}
              <span className="tc-col-avail" title="Leave empty for unlimited">Avail.</span>
              <span className="tc-col-action"></span>
            </div>
            <div className="tc-table-body">
              {stockLengths.filter(s => !maxStockLength || s.length <= maxStockLength).map((s) => {
                const calculatedCost = getStockCost(s.length, s.costOverride);
                const isOverridden = s.costOverride !== null && s.costOverride !== '';
                return (
                  <div key={s.id} className="tc-table-row">
                    <input
                      type="number"
                      step="any"
                      className="tc-col-length"
                      value={toDisplay(s.length)}
                      onChange={(e) =>
                        updateStockLength(s.id, 'length', handleNumberInput(e.target.value))
                      }
                      placeholder="Length"
                    />
                    {showCosting && (
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`tc-col-cost ${!isOverridden && selectedProduct?.pricePerMeter > 0 ? 'tc-auto-calc' : ''}`}
                        value={s.costOverride !== null ? s.costOverride : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            updateStockLength(s.id, 'costOverride', val === '' ? null : val);
                          }
                        }}
                        placeholder={selectedProduct?.pricePerMeter > 0 ? calculatedCost.toFixed(2) : '–'}
                        title={isOverridden ? 'Override cost' : 'Auto-calculated from product rate'}
                      />
                    )}
                    <input
                      type="number"
                      className="tc-col-avail"
                      value={s.available === null ? '' : s.available}
                      onChange={(e) =>
                        updateStockLength(
                          s.id,
                          'available',
                          e.target.value === '' ? null : parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="∞"
                    />
                    <button onClick={() => removeStockLength(s.id)} className="tc-btn tc-btn--icon tc-col-action">
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={addStockLength} className="tc-add-btn">
              <Plus size={14} />
              Add Stock
            </button>
          </div>

          {/* Required Cuts */}
          <div className="tc-section">
            <h3 className="tc-section__title">
              <span>Required Cuts</span>
              <span className="tc-section__subtitle">{requiredCuts.length} piece{requiredCuts.length !== 1 ? 's' : ''}</span>
            </h3>
            <div className="tc-table-header">
              <span className="tc-col-length">Length ({currentUnit.label})</span>
              <span className="tc-col-qty">Qty</span>
              <span className="tc-col-action"></span>
            </div>
            <div className="tc-table-body">
              {requiredCuts.map((c) => (
                <div key={c.id} className="tc-table-row">
                  <input
                    type="number"
                    step="any"
                    className="tc-col-length"
                    value={toDisplay(c.length)}
                    onChange={(e) => updateCut(c.id, 'length', handleNumberInput(e.target.value))}
                  />
                  <div className="tc-col-qty-wrapper">
                    <span className="tc-qty-multiply">×</span>
                    <input
                      type="number"
                      className="tc-col-qty"
                      value={c.qty === 0 ? '' : c.qty}
                      onChange={(e) =>
                        updateCut(c.id, 'qty', e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))
                      }
                    />
                  </div>
                  <button onClick={() => removeCut(c.id)} className="tc-btn tc-btn--icon tc-col-action">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="tc-section-actions">
              <button onClick={addCut} className="tc-add-btn">
                <Plus size={14} />
                Add Cut
              </button>
              <button onClick={() => setShowImport(true)} className="tc-add-btn">
                <Upload size={14} />
                Import
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="tc-actions-primary">
            <button onClick={calculate} className="tc-btn tc-btn--primary tc-btn--lg tc-btn--full">
              Calculate Cutting Plan
            </button>
          </div>
          {result && (
            <div className="tc-actions-secondary">
              <button onClick={saveCurrentPlan} className="tc-btn tc-btn--save tc-btn--full">
                <Plus size={16} />
                Save &amp; Add Another
              </button>
              {configSettings.allowPdfExport && (
                <button onClick={handleExportAction} className="tc-btn tc-btn--secondary tc-btn--full">
                  <Download size={16} />
                  Export PDF{savedPlans.length > 0 ? ` (${savedPlans.length + 1} plans)` : ''}
                </button>
              )}
            </div>
          )}
          {!result && savedPlans.length > 0 && configSettings.allowPdfExport && (
            <button onClick={handleExportAction} className="tc-btn tc-btn--secondary tc-btn--full">
              <Download size={16} />
              Export PDF ({savedPlans.length} plan{savedPlans.length !== 1 ? 's' : ''})
            </button>
          )}
        </div>

        {/* RIGHT - Results */}
        <div className="tc-layout__right">
          {/* Summary Stats */}
          <div className="tc-summary">
            <div className="tc-stat">
              <div className="tc-stat__value">{result?.summary?.totalCutsMade ?? '–'}</div>
              <div className="tc-stat__label">Pieces</div>
            </div>
            <div className="tc-stat tc-stat--success">
              <div className="tc-stat__value">
                {result?.summary?.overallEfficiency ? `${result.summary.overallEfficiency}%` : '–'}
              </div>
              <div className="tc-stat__label">Efficiency</div>
            </div>
            <div className="tc-stat">
              <div className="tc-stat__value">
                {result?.summary ? formatLength(result.summary.totalCutLength, unit, true) : '–'}
              </div>
              <div className="tc-stat__label">Used</div>
            </div>
            <div className="tc-stat tc-stat--warning">
              <div className="tc-stat__value">
                {result?.summary ? formatLength(result.summary.usableOffcuts, unit, true) : '–'}
              </div>
              <div className="tc-stat__label">Offcuts</div>
            </div>
            <div className="tc-stat tc-stat--error">
              <div className="tc-stat__value">
                {result?.summary ? formatLength(result.summary.scrap, unit, true) : '–'}
              </div>
              <div className="tc-stat__label">Scrap</div>
            </div>
          </div>

          {/* Stock Used */}
          <div className="tc-stock-used">
            <div className="tc-stock-used__label">Stock Required</div>
            {result?.summary ? (
              <div className="tc-stock-used__list">
                {Object.entries(result.summary.stockUsed).map(([l, q]) => (
                  <div key={l} className="tc-stock-used__item">
                    <span className="tc-stock-used__qty">{q}×</span>
                    <span className="tc-stock-used__length">{formatLength(Number(l), unit)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tc-stock-used__list">
                <span style={{ color: 'var(--tc-text-muted)' }}>–</span>
              </div>
            )}
          </div>

          {/* Cost Summary */}
          {result?.summary && result.summary.totalCost > 0 && (
            <div className="tc-cost-summary">
              <div className="tc-cost-total">
                <span className="tc-cost-label">Stock Cost:</span>{' '}
                <strong>{formatCurrency(result.summary.totalCost)}</strong>
                {showCosting && <span className="tc-gst-badge">{showGstInclusive ? 'incl' : 'excl'} GST</span>}
              </div>
            </div>
          )}

          {result ? (
            <div className="tc-results">
              {result.error && <div className="tc-error-msg">{result.error}</div>}

              {/* Cutting Plan */}
              <div className="tc-plan-title-row">
                <h3 className="tc-plan__title">Cutting Plan</h3>
                <div className="tc-legend">
                  <div className="tc-legend__item">
                    <div className="tc-legend__color tc-legend__color--cut" />
                    <span>Cut</span>
                  </div>
                  <div className="tc-legend__item">
                    <div className="tc-legend__color tc-legend__color--kerf" />
                    <span>Kerf</span>
                  </div>
                  <div className="tc-legend__item">
                    <div className="tc-legend__color tc-legend__color--usable" />
                    <span>Usable</span>
                  </div>
                  <div className="tc-legend__item">
                    <div className="tc-legend__color tc-legend__color--scrap" />
                    <span>Scrap</span>
                  </div>
                </div>
              </div>
              <div className="tc-plan">
                <div className="tc-plan-header">
                  <div className="tc-col-plan-qty">Qty</div>
                  <div className="tc-col-plan-stock">Stock</div>
                  <div className="tc-col-plan-bar">Cuts</div>
                  <div className="tc-col-plan-eff">Eff.</div>
                </div>
                <div className="tc-plan-body">
                  {groupedPlan.map((piece, idx) => (
                    <div key={idx} className="tc-plan-row">
                      <div className="tc-col-plan-qty">{piece.qty}×</div>
                      <div className="tc-col-plan-stock">{formatLength(piece.rawStockLength, unit)}</div>
                      <div className="tc-col-plan-bar">
                        <div className="tc-bar">{renderStockBar(piece)}</div>
                      </div>
                      <div className="tc-col-plan-eff">{piece.efficiency}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="tc-results-empty">
              <div className="tc-results-empty__icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="12" width="48" height="8" rx="2" fill="currentColor" opacity="0.2"/>
                  <rect x="8" y="24" width="48" height="8" rx="2" fill="currentColor" opacity="0.15"/>
                  <rect x="8" y="36" width="48" height="8" rx="2" fill="currentColor" opacity="0.1"/>
                  <rect x="8" y="48" width="32" height="8" rx="2" fill="currentColor" opacity="0.05"/>
                </svg>
              </div>
              <p className="tc-results-empty__text">
                Select a product, enter your required cuts, then click <strong>Calculate</strong>.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          {configSettings.disclaimer && (
            <div className="tc-disclaimer">
              <AlertTriangle size={14} />
              <p>{configSettings.disclaimer}</p>
            </div>
          )}
        </div>
      </div>

      </>)}

      {/* ============ FENCING MODE ============ */}
      {activeMode === 'fencing' && (
        <div className="tc-layout--fencing">
          <div className="tc-layout--fencing__designer">
            <FencingCalculator
              products={products}
              config={config}
              settings={settings}
              unit={unit}
              onCalculateStart={() => setIsCalculating(true)}
              onResults={(r) => {
                setFencingResults(r);
                setIsCalculating(false);
                trackCalculationCompleted('fencing', r.combinedSummary);
              }}
              adjustForGst={showCosting ? adjustForGst : null}
              showGstInclusive={showGstInclusive}
              showCosting={showCosting}
              previewControlRef={previewControlRef}
            />
          </div>
          <div className="tc-layout--fencing__results">
            {fencingResults ? (
              <FencingResults
                fencingResults={fencingResults}
                renderStockBar={renderStockBar}
                unit={unit}
                showCosting={showCosting}
                showGstInclusive={showGstInclusive}
                configSettings={configSettings}
                formatCurrency={formatCurrency}
              />
            ) : (
              <div className="tc-results-empty">
                <div className="tc-results-empty__icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="4" y="40" width="6" height="20" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="14" y="40" width="6" height="20" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="24" y="40" width="6" height="20" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="34" y="40" width="6" height="20" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="54" y="40" width="6" height="20" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="0" y="32" width="64" height="3" rx="1" fill="currentColor" opacity="0.1"/>
                    <rect x="0" y="38" width="64" height="3" rx="1" fill="currentColor" opacity="0.1"/>
                  </svg>
                </div>
                <p className="tc-results-empty__text">
                  Configure your fence sections and components, then click <strong>Calculate Fence Plan</strong>.
                </p>
              </div>
            )}
            {fencingResults && configSettings.allowPdfExport && (
              <button onClick={handleExportAction} className="tc-btn tc-btn--secondary tc-btn--full" style={{ marginTop: 8 }}>
                <Download size={16} />
                Export PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ WALLS MODE ============ */}
      {activeMode === 'walls' && (
        <div className="tc-layout--fencing">
          <div className="tc-layout--fencing__designer">
            <WallCalculator
              products={products}
              config={config}
              settings={settings}
              unit={unit}
              onCalculateStart={() => setIsCalculating(true)}
              onResults={(r) => {
                setWallResults(r);
                setIsCalculating(false);
                trackCalculationCompleted('walls', r.combinedSummary);
              }}
              adjustForGst={showCosting ? adjustForGst : null}
              showGstInclusive={showGstInclusive}
              showCosting={showCosting}
              previewControlRef={previewControlRef}
            />
          </div>
          <div className="tc-layout--fencing__results">
            {wallResults ? (
              <WallResults
                wallResults={wallResults}
                unit={unit}
                showCosting={showCosting}
                showGstInclusive={showGstInclusive}
                configSettings={configSettings}
                formatCurrency={formatCurrency}
              />
            ) : (
              <div className="tc-results-empty">
                <div className="tc-results-empty__icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="2" y="56" width="60" height="4" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="2" y="4" width="60" height="4" rx="1" fill="currentColor" opacity="0.15"/>
                    <rect x="2" y="8" width="4" height="48" rx="1" fill="currentColor" opacity="0.1"/>
                    <rect x="20" y="8" width="4" height="48" rx="1" fill="currentColor" opacity="0.1"/>
                    <rect x="38" y="8" width="4" height="48" rx="1" fill="currentColor" opacity="0.1"/>
                    <rect x="58" y="8" width="4" height="48" rx="1" fill="currentColor" opacity="0.1"/>
                  </svg>
                </div>
                <p className="tc-results-empty__text">
                  Configure your wall dimensions and openings, then click <strong>Calculate Wall Frame</strong>.
                </p>
              </div>
            )}
            {wallResults && configSettings.allowPdfExport && (
              <button onClick={handleExportAction} className="tc-btn tc-btn--secondary tc-btn--full" style={{ marginTop: 8 }}>
                <Download size={16} />
                Export PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ COMING SOON ============ */}
      {activeMode === 'decking' && (
        <div className="tc-coming-soon">
          <p>Decking Calculator</p>
          <span>Coming soon</span>
        </div>
      )}

      {/* Powered by */}
      <div className="tc-footer">
        <span>Powered by</span>
        <a href="https://shmake.nz" target="_blank" rel="noopener noreferrer">
          <img src="https://mymeca.nz/images/shmake-logo-dark.png" alt="shmake" className="tc-footer__logo" />
        </a>
      </div>
    </div>
  );
}
