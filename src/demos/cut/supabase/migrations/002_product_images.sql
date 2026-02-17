-- ============================================
-- Migration: 002_product_images
-- Add image_url to cut_products + storage bucket
-- ============================================

-- Add image column
ALTER TABLE public.cut_products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (SELECT is_cut_admin()));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT is_cut_admin()));

-- Update get_embed_config to return imageUrl
CREATE OR REPLACE FUNCTION public.get_embed_config(p_embed_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_tenant RECORD;
  v_products JSONB;
  v_presets JSONB;
  v_result JSONB;
BEGIN
  SELECT * INTO v_tenant
  FROM public.cut_tenants
  WHERE embed_key = p_embed_key
    AND status IN ('trial', 'active');

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_tenant.status = 'trial' AND v_tenant.trial_ends_at < NOW() THEN
    RETURN NULL;
  END IF;

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

  INSERT INTO public.cut_analytics (tenant_id, event_type)
  VALUES (v_tenant.id, 'page_view');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
