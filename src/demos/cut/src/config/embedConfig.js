// ============================================
// EMBED CONFIGURATION
// Replaces TeaBreak's Auth, Company, and Branding contexts
// ============================================

/**
 * Default config used for demo mode or when API is unreachable
 */
export const DEFAULT_CONFIG = {
  tenant: {
    id: 'demo',
    name: 'Demo Timber Co',
    embedKey: 'demo',
    logo: null,
    website: null,
  },
  theme: {
    primary: '#1e3a5f',
    primaryLight: '#2a5a8f',
    accent: '#d97706',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral800: '#262626',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceAlt: '#f3f4f6',
    border: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: '8px',
    borderRadiusSm: '6px',
  },
  products: [
    // ── Framing ──────────────────────────────────────────
    {
      id: 'framing-90x45-h12',
      species: 'Radiata Pine',
      treatment: 'H1.2',
      grade: 'MSG8',
      profile: '90 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4200, 4800, 6000],
      pricePerMeter: 3.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-90x45.svg',
    },
    {
      id: 'framing-90x45-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      grade: 'MSG8',
      profile: '90 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4200, 4800, 6000],
      pricePerMeter: 4.50,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-90x45.svg',
    },
    {
      id: 'framing-140x45-h12',
      species: 'Radiata Pine',
      treatment: 'H1.2',
      grade: 'MSG8',
      profile: '140 × 45',
      category: 'framing',
      lengths: [2400, 3600, 4800, 6000],
      pricePerMeter: 5.95,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-140x45.svg',
    },
    {
      id: 'framing-140x45-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      grade: 'MSG8',
      profile: '140 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4800, 6000],
      pricePerMeter: 6.90,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-140x45.svg',
    },
    {
      id: 'framing-190x45-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      grade: 'MSG8',
      profile: '190 × 45',
      category: 'framing',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 9.20,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-190x45.svg',
    },
    {
      id: 'framing-240x45-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      grade: 'MSG8',
      profile: '240 × 45',
      category: 'framing',
      lengths: [4800, 6000],
      pricePerMeter: 11.40,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-240x45.svg',
    },
    {
      id: 'framing-290x45-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      grade: 'MSG8',
      profile: '290 × 45',
      category: 'framing',
      lengths: [4800, 6000],
      pricePerMeter: 13.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-290x45.svg',
    },
    {
      id: 'framing-45x45-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      grade: 'MSG8',
      profile: '45 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4800],
      pricePerMeter: 2.60,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-45x45.svg',
    },
    {
      id: 'framing-lvl-200x45',
      species: 'LVL',
      treatment: 'None',
      grade: 'LVL11',
      profile: '200 × 45',
      category: 'framing',
      lengths: [4800, 6000, 7200],
      pricePerMeter: 14.50,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-190x45.svg',
    },
    {
      id: 'framing-lvl-240x45',
      species: 'LVL',
      treatment: 'None',
      grade: 'LVL11',
      profile: '240 × 45',
      category: 'framing',
      lengths: [4800, 6000, 7200],
      pricePerMeter: 17.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-framing-240x45.svg',
    },

    // ── Posts ─────────────────────────────────────────────
    {
      id: 'post-100x100-h4',
      species: 'Radiata Pine',
      treatment: 'H4',
      profile: '100 × 100',
      category: 'posts',
      lengths: [2400, 3000, 3600],
      pricePerMeter: 8.90,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-post-100x100.svg',
    },
    {
      id: 'post-100x100-h5',
      species: 'Radiata Pine',
      treatment: 'H5',
      profile: '100 × 100',
      category: 'posts',
      lengths: [2400, 3000, 3600],
      pricePerMeter: 12.50,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-post-100x100.svg',
    },
    {
      id: 'post-125x125-h4',
      species: 'Radiata Pine',
      treatment: 'H4',
      profile: '125 × 125',
      category: 'posts',
      lengths: [2400, 3000, 3600],
      pricePerMeter: 14.20,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-post-125x125.svg',
    },
    {
      id: 'post-150x150-h4',
      species: 'Radiata Pine',
      treatment: 'H4',
      profile: '150 × 150',
      category: 'posts',
      lengths: [2400, 3000, 3600],
      pricePerMeter: 19.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-post-150x150.svg',
    },

    // ── Boards / Palings ─────────────────────────────────
    {
      id: 'board-150x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '150 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800],
      pricePerMeter: 2.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-150x19.svg',
    },
    {
      id: 'board-100x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '100 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800],
      pricePerMeter: 2.10,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-100x19.svg',
    },
    {
      id: 'board-200x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '200 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800],
      pricePerMeter: 3.40,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-200x19.svg',
    },
    {
      id: 'board-150x25-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '150 × 25',
      category: 'palings',
      lengths: [1800, 2400, 3000, 3600],
      pricePerMeter: 3.60,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-150x25.svg',
    },
    {
      id: 'board-200x25-h31',
      species: 'Radiata Pine',
      treatment: 'H3.1',
      profile: '200 × 25',
      category: 'palings',
      lengths: [1200, 1500, 1800, 2400, 3000, 3600],
      pricePerMeter: 5.20,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-200x25.svg',
    },
    {
      id: 'board-150x19-cedar',
      species: 'Western Red Cedar',
      treatment: 'None',
      profile: '150 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800, 2000],
      pricePerMeter: 7.50,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-150x19.svg',
    },
    {
      id: 'board-200x19-cedar',
      species: 'Western Red Cedar',
      treatment: 'None',
      profile: '200 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800, 2400],
      pricePerMeter: 9.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-board-200x19.svg',
    },

    // ── Rails ────────────────────────────────────────────
    {
      id: 'rail-65x35-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '65 × 35',
      category: 'rails',
      lengths: [2400, 3000, 3600, 4800],
      pricePerMeter: 2.40,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-rail-65x35.svg',
    },
    {
      id: 'rail-75x50-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '75 × 50',
      category: 'rails',
      lengths: [2400, 3000, 3600, 4800],
      pricePerMeter: 3.90,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-rail-75x50.svg',
    },

    // ── Decking ──────────────────────────────────────────
    {
      id: 'decking-140x19-kwila',
      species: 'Kwila',
      treatment: 'None',
      profile: '140 × 19',
      category: 'decking',
      lengths: [1800, 2400, 3000, 3600],
      pricePerMeter: 18.50,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-decking-140x19.svg',
    },
    {
      id: 'decking-140x19-vitex',
      species: 'Vitex',
      treatment: 'None',
      profile: '140 × 19',
      category: 'decking',
      lengths: [1800, 2400, 3000],
      pricePerMeter: 22.00,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-decking-140x19.svg',
    },
    {
      id: 'decking-90x23-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '90 × 23',
      category: 'decking',
      lengths: [2400, 3600, 4800],
      pricePerMeter: 5.20,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-decking-90x23.svg',
    },
    {
      id: 'decking-140x32-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '140 × 32',
      category: 'decking',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 8.40,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-decking-140x32.svg',
    },

    // ── Battens ──────────────────────────────────────────
    {
      id: 'batten-40x20-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '40 × 20',
      category: 'battens',
      lengths: [2400, 3600, 4800],
      pricePerMeter: 1.40,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-batten-40x20.svg',
    },
    {
      id: 'batten-65x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '65 × 19',
      category: 'battens',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 1.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-batten-65x19.svg',
    },

    // ── Fence Capping ────────────────────────────────────
    {
      id: 'capping-65x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '65 × 19',
      category: 'capping',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 1.80,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-capping-65x19.svg',
    },
    {
      id: 'capping-90x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '90 × 19',
      category: 'capping',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 2.20,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-capping-90x19.svg',
    },
    {
      id: 'capping-140x19-h32',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '140 × 19',
      category: 'capping',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 3.10,
      unit: 'mm',
      imageUrl: '/images/profiles/profile-capping-140x19.svg',
    },
  ],
  presets: [
    {
      id: 'framing',
      name: 'Framing',
      productIds: [
        'framing-90x45-h12', 'framing-90x45-h32',
        'framing-140x45-h12', 'framing-140x45-h32',
        'framing-190x45-h32', 'framing-240x45-h32', 'framing-290x45-h32',
        'framing-45x45-h32',
        'framing-lvl-200x45', 'framing-lvl-240x45',
        'batten-40x20-h32', 'batten-65x19-h32',
      ],
      defaultProductId: 'framing-90x45-h32',
      settings: {
        endTrim: 0,
        minOffcut: 200,
        kerf: 3,
      },
    },
    {
      id: 'decking',
      name: 'Decking',
      productIds: [
        'decking-140x19-kwila', 'decking-140x19-vitex',
        'decking-90x23-h32', 'decking-140x32-h32',
      ],
      defaultProductId: 'decking-140x19-kwila',
      settings: {
        endTrim: 0,
        minOffcut: 300,
        kerf: 3,
      },
    },
    {
      id: 'fencing',
      name: 'Fencing',
      productIds: [
        'board-150x19-h32', 'board-100x19-h32', 'board-200x19-h32',
        'board-150x25-h32', 'board-200x25-h31',
        'board-150x19-cedar', 'board-200x19-cedar',
        'post-100x100-h4', 'post-100x100-h5', 'post-125x125-h4', 'post-150x150-h4',
        'rail-65x35-h32', 'rail-75x50-h32',
        'capping-65x19-h32', 'capping-90x19-h32', 'capping-140x19-h32',
      ],
      defaultProductId: 'board-150x19-h32',
      settings: {
        endTrim: 0,
        minOffcut: 150,
        kerf: 3,
      },
    },
    {
      id: 'custom',
      name: 'Custom',
      productIds: [],
      defaultProductId: null,
      settings: {
        endTrim: 0,
        minOffcut: 100,
        kerf: 3,
      },
    },
  ],
  settings: {
    showCosting: true,
    showJobDetails: false, // Wholesaler embeds probably don't need job tracking
    allowPdfExport: true,
    enableLeadCapture: true, // Gate PDF export behind email capture
    enableSendToYard: true, // Show "Send to [Yard Name]" button
    gstMode: 'excl', // 'excl' or 'incl' — whether catalogue prices are GST exclusive or inclusive
    gstRate: 0.15, // NZ GST rate
    disclaimer:
      'This calculator provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing. Actual requirements may vary based on site conditions, timber quality, cutting accuracy, and builder preference. This tool does not assess structural adequacy or building code compliance.',
  },
};

/**
 * Fetch tenant configuration from Supabase
 * Uses the get_embed_config RPC function for a single-query load
 * Falls back to defaults on failure
 */
export async function fetchEmbedConfig(embedKey) {
  if (!embedKey || embedKey === 'demo') {
    return DEFAULT_CONFIG;
  }

  try {
    // Dynamic import so embed bundle only loads supabase if needed
    const { supabasePublic } = await import('../lib/supabase');
    
    if (!supabasePublic) {
      console.warn('shmakeCut: Supabase not configured, using defaults');
      return DEFAULT_CONFIG;
    }

    const { data, error } = await supabasePublic.rpc('get_embed_config', {
      p_embed_key: embedKey,
    });

    if (error || !data) {
      console.warn(`shmakeCut: Config fetch failed for "${embedKey}"`, error);
      return DEFAULT_CONFIG;
    }

    // Deep merge with defaults so missing fields don't break anything
    return {
      tenant: { ...DEFAULT_CONFIG.tenant, ...data.tenant },
      theme: { ...DEFAULT_CONFIG.theme, ...data.theme },
      products: data.products?.length > 0 ? data.products : DEFAULT_CONFIG.products,
      presets: data.presets?.length > 0 ? data.presets : DEFAULT_CONFIG.presets,
      settings: { ...DEFAULT_CONFIG.settings, ...data.settings },
    };
  } catch (err) {
    console.warn('shmakeCut: Config fetch failed, using defaults', err);
    return DEFAULT_CONFIG;
  }
}

/**
 * Apply theme config as CSS custom properties on the embed container
 */
export function applyTheme(containerEl, theme) {
  if (!containerEl || !theme) return;

  const map = {
    '--tc-primary': theme.primary,
    '--tc-primary-light': theme.primaryLight,
    '--tc-accent': theme.accent,
    '--tc-success': theme.success,
    '--tc-warning': theme.warning,
    '--tc-error': theme.error,
    '--tc-neutral-800': theme.neutral800,
    '--tc-bg': theme.background,
    '--tc-surface': theme.surface,
    '--tc-surface-alt': theme.surfaceAlt,
    '--tc-border': theme.border,
    '--tc-text': theme.textPrimary,
    '--tc-text-secondary': theme.textSecondary,
    '--tc-text-muted': theme.textMuted,
    '--tc-font': theme.fontFamily,
    '--tc-radius': theme.borderRadius,
    '--tc-radius-sm': theme.borderRadiusSm,
  };

  Object.entries(map).forEach(([prop, value]) => {
    if (value) containerEl.style.setProperty(prop, value);
  });
}

/**
 * Build stock lengths array from a product in the catalogue
 */
export function productToStockLengths(product) {
  if (!product) return [];
  return product.lengths.map((length, i) => ({
    id: i + 1,
    length,
    costOverride: null,
    available: null,
  }));
}

/**
 * Get display label for a product
 */
export function getProductLabel(product) {
  if (!product) return '';
  const parts = [product.species];
  if (product.treatment && product.treatment !== 'None') parts.push(product.treatment);
  parts.push(product.profile);
  return parts.join(' ');
}

/**
 * Filter products by category
 */
export function getProductsByCategory(products, category) {
  return products.filter(p => p.category === category);
}

// ============================================
// FENCING MODE CONSTANTS
// ============================================

export const FENCING_CATEGORIES = {
  posts: 'posts',
  rails: 'rails',
  cladding: 'palings',
  capping: 'capping',
};

export const WALL_CATEGORIES = {
  framing: 'framing',
  plates: 'framing',
  lintels: 'framing',
};

export const CLADDING_STYLES = {
  standard_vertical: { label: 'Standard Vertical', horizontal: false },
  vertical_lapped: { label: 'Vertical Lapped', horizontal: false, defaultOverlap: 25 },
  hit_and_miss: { label: 'Hit & Miss', horizontal: false },
  horizontal_slat: { label: 'Horizontal Slat', horizontal: true },
};
