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
    // Demo product catalogue — framing
    {
      id: 'treated-90x45',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '90 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4200, 4800, 6000],
      pricePerMeter: 4.50,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-140x45',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '140 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4200, 4800, 6000],
      pricePerMeter: 6.80,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-190x45',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '190 × 45',
      category: 'framing',
      lengths: [3000, 3600, 4200, 4800, 6000],
      pricePerMeter: 9.20,
      unit: 'mm',
      imageUrl: null,
    },
    // Decking
    {
      id: 'kwila-140x19',
      species: 'Kwila',
      treatment: 'None',
      profile: '140 × 19 (Decking)',
      category: 'decking',
      lengths: [1800, 2400, 3000, 3600, 4200],
      pricePerMeter: 18.50,
      unit: 'mm',
      imageUrl: null,
    },
    // Decking — additional
    {
      id: 'vitex-90x19',
      species: 'Vitex',
      treatment: 'None',
      profile: '90 × 19 (Decking)',
      category: 'decking',
      lengths: [1800, 2400, 3000, 3600],
      pricePerMeter: 22.00,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'pine-140x32-decking',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '140 × 32 (Decking)',
      category: 'decking',
      lengths: [2400, 3000, 3600, 4800],
      pricePerMeter: 11.50,
      unit: 'mm',
      imageUrl: null,
    },
    // Fencing — palings
    {
      id: 'pine-200x25',
      species: 'Radiata Pine',
      treatment: 'H3.1',
      profile: '200 × 25',
      category: 'palings',
      lengths: [1200, 1500, 1800, 2400, 3000, 3600],
      pricePerMeter: 5.20,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-150x19-paling',
      species: 'Radiata Pine',
      treatment: 'H3.1',
      profile: '150 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800],
      pricePerMeter: 3.80,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'cedar-150x19-paling',
      species: 'Western Red Cedar',
      treatment: 'None',
      profile: '150 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800, 2100],
      pricePerMeter: 8.90,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'pine-100x19-paling',
      species: 'Radiata Pine',
      treatment: 'H3.1',
      profile: '100 × 19',
      category: 'palings',
      lengths: [1200, 1500, 1800],
      pricePerMeter: 2.60,
      unit: 'mm',
      imageUrl: null,
    },
    // Fencing — posts
    {
      id: 'treated-100x100-post',
      species: 'Radiata Pine',
      treatment: 'H4',
      profile: '100 × 100',
      category: 'posts',
      lengths: [1800, 2400, 3000, 3600],
      pricePerMeter: 12.50,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-125x125-post',
      species: 'Radiata Pine',
      treatment: 'H5',
      profile: '125 × 125',
      category: 'posts',
      lengths: [2400, 3000, 3600, 4200],
      pricePerMeter: 18.80,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-75x75-post',
      species: 'Radiata Pine',
      treatment: 'H4',
      profile: '75 × 75',
      category: 'posts',
      lengths: [1800, 2400, 3000],
      pricePerMeter: 8.20,
      unit: 'mm',
      imageUrl: null,
    },
    // Fencing — rails
    {
      id: 'treated-100x50-rail',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '100 × 50',
      category: 'rails',
      lengths: [2400, 3000, 3600, 4800, 6000],
      pricePerMeter: 5.80,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-75x50-rail',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '75 × 50',
      category: 'rails',
      lengths: [2400, 3000, 3600, 4800],
      pricePerMeter: 4.40,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-150x50-rail',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '150 × 50',
      category: 'rails',
      lengths: [3000, 3600, 4800, 6000],
      pricePerMeter: 7.80,
      unit: 'mm',
      imageUrl: null,
    },
    // Fencing — capping
    {
      id: 'treated-150x50-capping',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '150 × 50',
      category: 'capping',
      lengths: [3000, 3600, 4800, 6000],
      pricePerMeter: 7.20,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-100x50-capping',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '100 × 50',
      category: 'capping',
      lengths: [3000, 3600, 4800, 6000],
      pricePerMeter: 5.80,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'cedar-150x25-capping',
      species: 'Western Red Cedar',
      treatment: 'None',
      profile: '150 × 25',
      category: 'capping',
      lengths: [2400, 3000, 3600, 4800],
      pricePerMeter: 10.50,
      unit: 'mm',
      imageUrl: null,
    },
    // General — battens / misc
    {
      id: 'treated-45x45',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '45 × 45',
      category: 'framing',
      lengths: [2400, 3000, 3600, 4800, 6000],
      pricePerMeter: 3.20,
      unit: 'mm',
      imageUrl: null,
    },
    {
      id: 'treated-240x45',
      species: 'Radiata Pine',
      treatment: 'H3.2',
      profile: '240 × 45',
      category: 'framing',
      lengths: [3600, 4800, 6000],
      pricePerMeter: 12.40,
      unit: 'mm',
      imageUrl: null,
    },
  ],
  presets: [
    {
      id: 'framing',
      name: 'Framing Timber',
      productIds: ['treated-90x45', 'treated-140x45', 'treated-190x45'],
      defaultProductId: 'treated-90x45',
      settings: {
        endTrim: 0,
        minOffcut: 200,
        kerf: 3,
      },
    },
    {
      id: 'decking',
      name: 'Decking',
      productIds: ['kwila-140x19'],
      defaultProductId: 'kwila-140x19',
      settings: {
        endTrim: 0,
        minOffcut: 300,
        kerf: 3,
      },
    },
    {
      id: 'fencing',
      name: 'Fencing',
      productIds: ['pine-200x25'],
      defaultProductId: 'pine-200x25',
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
