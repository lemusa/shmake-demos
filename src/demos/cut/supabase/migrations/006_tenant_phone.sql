-- ============================================
-- Add phone number to tenants
-- ============================================

ALTER TABLE public.cut_tenants
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================
-- Update get_embed_config to return contact details
-- for PDF output (phone, email, website)
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
      'website', v_tenant.website,
      'phone', v_tenant.phone,
      'email', v_tenant.contact_email
    ),
    'theme', v_tenant.theme,
    'products', v_products,
    'presets', v_presets,
    'settings', v_tenant.settings
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
