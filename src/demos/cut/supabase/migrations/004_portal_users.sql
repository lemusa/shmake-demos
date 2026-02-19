-- Migration 004: Portal users
-- Adds tenant-scoped user accounts for the client portal (portal.shmake.nz)
-- Portal users can manage their own tenant's products, leads, and settings.

-- ============================================================
-- Table: cut_portal_users
-- ============================================================

CREATE TABLE public.cut_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.cut_tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_users_tenant ON public.cut_portal_users(tenant_id);
CREATE INDEX idx_portal_users_auth ON public.cut_portal_users(auth_user_id);

ALTER TABLE public.cut_portal_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get tenant_id for current portal user
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_portal_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.cut_portal_users
  WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- RLS Policies: cut_portal_users
-- ============================================================

CREATE POLICY "Portal users read own record"
  ON public.cut_portal_users FOR SELECT
  USING (auth_user_id = auth.uid());

-- ============================================================
-- RLS Policies: cut_tenants (additive — existing admin policies remain)
-- ============================================================

CREATE POLICY "Portal users read own tenant"
  ON public.cut_tenants FOR SELECT
  USING (id = public.get_portal_tenant_id());

CREATE POLICY "Portal users update own tenant"
  ON public.cut_tenants FOR UPDATE
  USING (id = public.get_portal_tenant_id());

-- ============================================================
-- RLS Policies: cut_products
-- ============================================================

CREATE POLICY "Portal users manage own products"
  ON public.cut_products FOR ALL
  USING (tenant_id = public.get_portal_tenant_id());

-- ============================================================
-- RLS Policies: cut_presets
-- ============================================================

CREATE POLICY "Portal users manage own presets"
  ON public.cut_presets FOR ALL
  USING (tenant_id = public.get_portal_tenant_id());

-- ============================================================
-- RLS Policies: cut_analytics_events
-- ============================================================

CREATE POLICY "Portal users read own analytics"
  ON public.cut_analytics_events FOR SELECT
  USING (tenant_id = public.get_portal_tenant_id());

-- ============================================================
-- RLS Policies: cut_leads
-- ============================================================

CREATE POLICY "Portal users read own leads"
  ON public.cut_leads FOR SELECT
  USING (tenant_id = public.get_portal_tenant_id());

CREATE POLICY "Portal users update own leads"
  ON public.cut_leads FOR UPDATE
  USING (tenant_id = public.get_portal_tenant_id());
