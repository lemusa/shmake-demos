-- ============================================
-- TIMBER CALC - MULTI-TENANT SCHEMA
-- Migration: 001_initial_schema
-- ============================================

-- ============================================
-- TENANTS (wholesaler companies)
-- ============================================

CREATE TABLE public.cut_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  embed_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  website TEXT,
  
  -- Branding
  logo_url TEXT,
  
  -- Theme (JSON so we can extend without migrations)
  theme JSONB NOT NULL DEFAULT '{
    "primary": "#1e3a5f",
    "primaryLight": "#2a5a8f",
    "accent": "#d97706",
    "success": "#22c55e",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "neutral800": "#262626",
    "background": "#ffffff",
    "surface": "#f9fafb",
    "surfaceAlt": "#f3f4f6",
    "border": "#e5e7eb",
    "textPrimary": "#111827",
    "textSecondary": "#6b7280",
    "textMuted": "#9ca3af",
    "fontFamily": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "borderRadius": "8px",
    "borderRadiusSm": "6px"
  }'::jsonb,

  -- Feature flags
  settings JSONB NOT NULL DEFAULT '{
    "showCosting": true,
    "showJobDetails": false,
    "allowPdfExport": true,
    "disclaimer": "This calculator provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing."
  }'::jsonb,

  -- Subscription
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cut_tenants_updated_at
  BEFORE UPDATE ON public.cut_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PRODUCTS (timber catalogue per tenant)
-- ============================================

CREATE TABLE public.cut_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  
  -- Product details
  name TEXT NOT NULL, -- Display name override (optional, auto-generated if blank)
  species TEXT NOT NULL, -- e.g. 'Radiata Pine', 'Douglas Fir', 'Kwila'
  treatment TEXT DEFAULT 'None', -- e.g. 'H3.2', 'H4', 'H5', 'None'
  profile TEXT NOT NULL, -- e.g. '90 × 45', '140 × 19'
  category TEXT DEFAULT 'framing', -- e.g. 'framing', 'decking', 'fencing', 'cladding', 'custom'
  
  -- Available lengths in mm
  lengths INTEGER[] NOT NULL DEFAULT '{}',
  
  -- Pricing
  price_per_meter NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'NZD',
  
  -- Cutting defaults for this product
  default_kerf INTEGER DEFAULT 3, -- mm
  default_end_trim INTEGER DEFAULT 0, -- mm
  default_min_offcut INTEGER DEFAULT 200, -- mm
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER cut_products_updated_at
  BEFORE UPDATE ON public.cut_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_cut_products_tenant ON public.cut_products(tenant_id);
CREATE INDEX idx_cut_products_category ON public.cut_products(tenant_id, category);

-- ============================================
-- PRESETS (named product groups per tenant)
-- ============================================

CREATE TABLE public.cut_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- e.g. 'Framing Timber', 'Decking', 'Fencing'
  slug TEXT NOT NULL, -- URL-safe key
  
  -- Which products belong to this preset
  product_ids UUID[] NOT NULL DEFAULT '{}',
  default_product_id UUID REFERENCES public.cut_products(id) ON DELETE SET NULL,
  
  -- Override settings for this preset
  settings JSONB NOT NULL DEFAULT '{
    "endTrim": 0,
    "minOffcut": 200,
    "kerf": 3
  }'::jsonb,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE TRIGGER cut_presets_updated_at
  BEFORE UPDATE ON public.cut_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_cut_presets_tenant ON public.cut_presets(tenant_id);

-- ============================================
-- EMBED ANALYTICS (usage tracking)
-- ============================================

CREATE TABLE public.cut_analytics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'calculation', 'pdf_export')),
  
  -- Calculation details (when event_type = 'calculation')
  total_cuts INTEGER,
  total_stock INTEGER,
  efficiency NUMERIC(5,1),
  product_id UUID REFERENCES public.cut_products(id) ON DELETE SET NULL,
  
  -- Context
  referrer TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cut_analytics_tenant ON public.cut_analytics(tenant_id, created_at DESC);
CREATE INDEX idx_cut_analytics_event ON public.cut_analytics(tenant_id, event_type, created_at DESC);

-- ============================================
-- ADMIN USERS (who can manage tenants)
-- ============================================

CREATE TABLE public.cut_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL, -- References auth.users
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.cut_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_admin_users ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is a TC admin
CREATE OR REPLACE FUNCTION is_cut_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cut_admin_users
    WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TENANTS: Admins can CRUD, anon can read active tenants by embed_key
CREATE POLICY "Admins can manage tenants"
  ON public.cut_tenants FOR ALL
  TO authenticated
  USING (is_cut_admin())
  WITH CHECK (is_cut_admin());

CREATE POLICY "Anyone can read active tenants by embed_key"
  ON public.cut_tenants FOR SELECT
  TO anon, authenticated
  USING (status IN ('trial', 'active'));

-- PRODUCTS: Admins can CRUD, anon can read active products for active tenants
CREATE POLICY "Admins can manage products"
  ON public.cut_products FOR ALL
  TO authenticated
  USING (is_cut_admin())
  WITH CHECK (is_cut_admin());

CREATE POLICY "Anyone can read active products"
  ON public.cut_products FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND tenant_id IN (SELECT id FROM public.cut_tenants WHERE status IN ('trial', 'active'))
  );

-- PRESETS: Same pattern
CREATE POLICY "Admins can manage presets"
  ON public.cut_presets FOR ALL
  TO authenticated
  USING (is_cut_admin())
  WITH CHECK (is_cut_admin());

CREATE POLICY "Anyone can read active presets"
  ON public.cut_presets FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND tenant_id IN (SELECT id FROM public.cut_tenants WHERE status IN ('trial', 'active'))
  );

-- ANALYTICS: Admins can read, anon can insert (embed tracking)
CREATE POLICY "Admins can read analytics"
  ON public.cut_analytics FOR SELECT
  TO authenticated
  USING (is_cut_admin());

CREATE POLICY "Anyone can insert analytics"
  ON public.cut_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ADMIN USERS: Only super admins can manage, admins can read self
CREATE POLICY "Admins can read own record"
  ON public.cut_admin_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- ============================================
-- PUBLIC FUNCTION: Fetch embed config
-- Called by the embed script with anon key
-- Single RPC call instead of multiple queries
-- ============================================

CREATE OR REPLACE FUNCTION public.get_embed_config(p_embed_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_tenant RECORD;
  v_products JSONB;
  v_presets JSONB;
  v_result JSONB;
BEGIN
  -- Get tenant
  SELECT * INTO v_tenant
  FROM public.cut_tenants
  WHERE embed_key = p_embed_key
    AND status IN ('trial', 'active');
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Check trial expiry
  IF v_tenant.status = 'trial' AND v_tenant.trial_ends_at < NOW() THEN
    RETURN NULL;
  END IF;

  -- Get active products
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'species', p.species,
      'treatment', p.treatment,
      'profile', p.profile,
      'category', p.category,
      'lengths', p.lengths,
      'pricePerMeter', p.price_per_meter,
      'currency', p.currency,
      'defaultKerf', p.default_kerf,
      'defaultEndTrim', p.default_end_trim,
      'defaultMinOffcut', p.default_min_offcut
    ) ORDER BY p.sort_order, p.species, p.profile
  ), '[]'::jsonb) INTO v_products
  FROM public.cut_products p
  WHERE p.tenant_id = v_tenant.id AND p.is_active = true;

  -- Get active presets
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pr.slug,
      'name', pr.name,
      'productIds', pr.product_ids,
      'defaultProductId', pr.default_product_id,
      'settings', pr.settings
    ) ORDER BY pr.sort_order, pr.name
  ), '[]'::jsonb) INTO v_presets
  FROM public.cut_presets pr
  WHERE pr.tenant_id = v_tenant.id AND pr.is_active = true;

  -- Build response
  v_result := jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id,
      'name', v_tenant.name,
      'embedKey', v_tenant.embed_key,
      'logo', v_tenant.logo_url,
      'website', v_tenant.website
    ),
    'theme', v_tenant.theme,
    'products', v_products,
    'presets', v_presets,
    'settings', v_tenant.settings
  );

  -- Track page view
  INSERT INTO public.cut_analytics (tenant_id, event_type)
  VALUES (v_tenant.id, 'page_view');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: Demo tenant
-- ============================================

INSERT INTO public.cut_tenants (name, slug, embed_key, theme, settings)
VALUES (
  'Demo Timber Co',
  'demo',
  'demo',
  '{
    "primary": "#1e3a5f",
    "primaryLight": "#2a5a8f",
    "accent": "#d97706",
    "success": "#22c55e",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "neutral800": "#262626",
    "background": "#ffffff",
    "surface": "#f9fafb",
    "surfaceAlt": "#f3f4f6",
    "border": "#e5e7eb",
    "textPrimary": "#111827",
    "textSecondary": "#6b7280",
    "textMuted": "#9ca3af",
    "fontFamily": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "borderRadius": "8px",
    "borderRadiusSm": "6px"
  }'::jsonb,
  '{
    "showCosting": true,
    "showJobDetails": false,
    "allowPdfExport": true,
    "disclaimer": "This calculator provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing."
  }'::jsonb
);

-- Seed products for demo tenant
DO $$
DECLARE
  v_tenant_id UUID;
  v_prod_1 UUID;
  v_prod_2 UUID;
  v_prod_3 UUID;
  v_prod_4 UUID;
  v_prod_5 UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.cut_tenants WHERE slug = 'demo';

  INSERT INTO public.cut_products (id, tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, sort_order)
  VALUES
    (gen_random_uuid(), v_tenant_id, '', 'Radiata Pine', 'H3.2', '90 × 45', 'framing',
     ARRAY[2400,3000,3600,4200,4800,6000], 4.50, 1)
  RETURNING id INTO v_prod_1;

  INSERT INTO public.cut_products (id, tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, sort_order)
  VALUES
    (gen_random_uuid(), v_tenant_id, '', 'Radiata Pine', 'H3.2', '140 × 45', 'framing',
     ARRAY[2400,3000,3600,4200,4800,6000], 6.80, 2)
  RETURNING id INTO v_prod_2;

  INSERT INTO public.cut_products (id, tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, sort_order)
  VALUES
    (gen_random_uuid(), v_tenant_id, '', 'Radiata Pine', 'H3.2', '190 × 45', 'framing',
     ARRAY[3000,3600,4200,4800,6000], 9.20, 3)
  RETURNING id INTO v_prod_3;

  INSERT INTO public.cut_products (id, tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, sort_order)
  VALUES
    (gen_random_uuid(), v_tenant_id, '', 'Kwila', 'None', '140 × 19 (Decking)', 'decking',
     ARRAY[1800,2400,3000,3600,4200], 18.50, 4)
  RETURNING id INTO v_prod_4;

  INSERT INTO public.cut_products (id, tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, sort_order)
  VALUES
    (gen_random_uuid(), v_tenant_id, '', 'Radiata Pine', 'H3.1', '200 × 25 (Fence)', 'fencing',
     ARRAY[1200,1500,1800,2400,3000,3600], 5.20, 5)
  RETURNING id INTO v_prod_5;

  -- Seed presets
  INSERT INTO public.cut_presets (tenant_id, name, slug, product_ids, default_product_id, settings, sort_order)
  VALUES
    (v_tenant_id, 'Framing', 'framing', ARRAY[v_prod_1, v_prod_2, v_prod_3], v_prod_1,
     '{"endTrim": 0, "minOffcut": 200, "kerf": 3}'::jsonb, 1),
    (v_tenant_id, 'Decking', 'decking', ARRAY[v_prod_4], v_prod_4,
     '{"endTrim": 0, "minOffcut": 300, "kerf": 3}'::jsonb, 2),
    (v_tenant_id, 'Fencing', 'fencing', ARRAY[v_prod_5], v_prod_5,
     '{"endTrim": 0, "minOffcut": 150, "kerf": 3}'::jsonb, 3),
    (v_tenant_id, 'Custom', 'custom', '{}', NULL,
     '{"endTrim": 0, "minOffcut": 100, "kerf": 3}'::jsonb, 99);
END $$;
