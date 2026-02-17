-- ============================================
-- ANALYTICS EVENTS + LEADS
-- Migration: 003_analytics_leads
-- ============================================

-- ============================================
-- ANALYTICS EVENTS (replaces cut_analytics)
-- Richer event log with session tracking,
-- funnel steps, and device context.
-- ============================================

CREATE TABLE public.cut_analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'session_started',
    'mode_selected',
    'products_selected',
    'calculation_completed',
    'pdf_requested',
    'lead_captured',
    'send_to_yard'
  )),

  -- Mode context
  mode TEXT CHECK (mode IN ('general', 'fencing', 'walls', 'decking')),

  -- Calculation details (when event_type = 'calculation_completed')
  calc_summary JSONB,

  -- Funnel step (1=started, 2=products, 3=calculated, 4=exported)
  funnel_step INTEGER,

  -- Context
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cut_events_tenant_session ON public.cut_analytics_events(tenant_id, session_id);
CREATE INDEX idx_cut_events_tenant_time ON public.cut_analytics_events(tenant_id, created_at DESC);
CREATE INDEX idx_cut_events_type ON public.cut_analytics_events(tenant_id, event_type, created_at DESC);

-- ============================================
-- LEADS (identified contacts from embed)
-- ============================================

CREATE TABLE public.cut_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  session_id TEXT,

  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,

  -- Capture context
  capture_point TEXT NOT NULL CHECK (capture_point IN ('pdf_export', 'send_to_yard')),
  mode TEXT CHECK (mode IN ('general', 'fencing', 'walls', 'decking')),

  -- What they calculated
  summary_text TEXT,
  estimated_value NUMERIC(10,2),

  -- Full specification + results (JSON blobs for future dashboard)
  specification JSONB,
  cut_list JSONB,

  -- Lead status (managed by yard owner in dashboard)
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER cut_leads_updated_at
  BEFORE UPDATE ON public.cut_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_cut_leads_tenant ON public.cut_leads(tenant_id, created_at DESC);
CREATE INDEX idx_cut_leads_email ON public.cut_leads(tenant_id, email);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.cut_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_leads ENABLE ROW LEVEL SECURITY;

-- Analytics events: anon can insert (embed tracking), admins can read
CREATE POLICY "Anyone can insert analytics events"
  ON public.cut_analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics events"
  ON public.cut_analytics_events FOR SELECT
  TO authenticated
  USING (is_cut_admin());

-- Leads: anon can insert (embed capture), admins can read + update
CREATE POLICY "Anyone can insert leads"
  ON public.cut_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read leads"
  ON public.cut_leads FOR SELECT
  TO authenticated
  USING (is_cut_admin());

CREATE POLICY "Admins can update leads"
  ON public.cut_leads FOR UPDATE
  TO authenticated
  USING (is_cut_admin())
  WITH CHECK (is_cut_admin());

-- ============================================
-- UPDATE get_embed_config: remove old page_view insert
-- The client-side analytics service now handles
-- session_started with richer context.
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
      'defaultMinOffcut', p.default_min_offcut,
      'imageUrl', p.image_url
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

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
