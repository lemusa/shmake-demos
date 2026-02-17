-- ============================================
-- SEED: Full demo product catalogue
-- Run against a Supabase instance to populate
-- a test tenant with 32 products + 4 presets.
--
-- Usage:
--   1. Set @tenant_slug below to target an existing tenant,
--      or leave as 'demo-test' to create a new one.
--   2. Run in the Supabase SQL editor.
--   3. The embed_key is returned at the end — use it
--      to load the calculator: ?embed=<key>
-- ============================================

DO $$
DECLARE
  v_tenant_id   UUID;
  v_embed_key   TEXT;

  -- Framing product IDs
  v_framing_90x45_h12   UUID;
  v_framing_90x45_h32   UUID;
  v_framing_140x45_h12  UUID;
  v_framing_140x45_h32  UUID;
  v_framing_190x45_h32  UUID;
  v_framing_240x45_h32  UUID;
  v_framing_290x45_h32  UUID;
  v_framing_45x45_h32   UUID;
  v_framing_lvl_200x45  UUID;
  v_framing_lvl_240x45  UUID;

  -- Post product IDs
  v_post_100x100_h4  UUID;
  v_post_100x100_h5  UUID;
  v_post_125x125_h4  UUID;
  v_post_150x150_h4  UUID;

  -- Board / paling product IDs
  v_board_150x19_h32   UUID;
  v_board_100x19_h32   UUID;
  v_board_200x19_h32   UUID;
  v_board_150x25_h32   UUID;
  v_board_200x25_h31   UUID;
  v_board_150x19_cedar  UUID;
  v_board_200x19_cedar  UUID;

  -- Rail product IDs
  v_rail_65x35_h32  UUID;
  v_rail_75x50_h32  UUID;

  -- Decking product IDs
  v_deck_140x19_kwila  UUID;
  v_deck_140x19_vitex  UUID;
  v_deck_90x23_h32     UUID;
  v_deck_140x32_h32    UUID;

  -- Batten product IDs
  v_batten_40x20_h32  UUID;
  v_batten_65x19_h32  UUID;

  -- Capping product IDs
  v_cap_65x19_h32   UUID;
  v_cap_90x19_h32   UUID;
  v_cap_140x19_h32  UUID;

BEGIN
  -- ============================================
  -- 1. CREATE OR FIND TENANT
  -- ============================================

  -- Try to find existing tenant
  SELECT id, embed_key INTO v_tenant_id, v_embed_key
  FROM public.cut_tenants WHERE slug = 'demo-test';

  IF v_tenant_id IS NULL THEN
    INSERT INTO public.cut_tenants (name, slug, status, settings)
    VALUES (
      'Demo Timber Co (Test)',
      'demo-test',
      'active',
      '{
        "showCosting": true,
        "showJobDetails": false,
        "allowPdfExport": true,
        "enableLeadCapture": true,
        "enableSendToYard": true,
        "gstMode": "excl",
        "gstRate": 0.15,
        "disclaimer": "This calculator provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing."
      }'::jsonb
    )
    RETURNING id, embed_key INTO v_tenant_id, v_embed_key;
  ELSE
    -- Clear existing products & presets for a clean re-seed
    DELETE FROM public.cut_presets WHERE tenant_id = v_tenant_id;
    DELETE FROM public.cut_products WHERE tenant_id = v_tenant_id;
  END IF;

  -- ============================================
  -- 2. INSERT PRODUCTS
  -- ============================================

  -- ── Framing ──────────────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H1.2 90×45', 'Radiata Pine', 'H1.2', '90 × 45', 'framing',
    ARRAY[2400,3000,3600,4200,4800,6000], 3.80, '/images/profiles/profile-framing-90x45.svg', 10)
  RETURNING id INTO v_framing_90x45_h12;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.2 90×45', 'Radiata Pine', 'H3.2', '90 × 45', 'framing',
    ARRAY[2400,3000,3600,4200,4800,6000], 4.50, '/images/profiles/profile-framing-90x45.svg', 11)
  RETURNING id INTO v_framing_90x45_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H1.2 140×45', 'Radiata Pine', 'H1.2', '140 × 45', 'framing',
    ARRAY[2400,3600,4800,6000], 5.95, '/images/profiles/profile-framing-140x45.svg', 12)
  RETURNING id INTO v_framing_140x45_h12;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.2 140×45', 'Radiata Pine', 'H3.2', '140 × 45', 'framing',
    ARRAY[2400,3000,3600,4800,6000], 6.90, '/images/profiles/profile-framing-140x45.svg', 13)
  RETURNING id INTO v_framing_140x45_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.2 190×45', 'Radiata Pine', 'H3.2', '190 × 45', 'framing',
    ARRAY[3600,4800,6000], 9.20, '/images/profiles/profile-framing-190x45.svg', 14)
  RETURNING id INTO v_framing_190x45_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.2 240×45', 'Radiata Pine', 'H3.2', '240 × 45', 'framing',
    ARRAY[4800,6000], 11.40, '/images/profiles/profile-framing-240x45.svg', 15)
  RETURNING id INTO v_framing_240x45_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.2 290×45', 'Radiata Pine', 'H3.2', '290 × 45', 'framing',
    ARRAY[4800,6000], 13.80, '/images/profiles/profile-framing-290x45.svg', 16)
  RETURNING id INTO v_framing_290x45_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.2 45×45', 'Radiata Pine', 'H3.2', '45 × 45', 'framing',
    ARRAY[2400,3000,3600,4800], 2.60, '/images/profiles/profile-framing-45x45.svg', 17)
  RETURNING id INTO v_framing_45x45_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'LVL Beam 200×45', 'LVL', 'None', '200 × 45', 'framing',
    ARRAY[4800,6000,7200], 14.50, '/images/profiles/profile-framing-190x45.svg', 18)
  RETURNING id INTO v_framing_lvl_200x45;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'LVL Beam 240×45', 'LVL', 'None', '240 × 45', 'framing',
    ARRAY[4800,6000,7200], 17.80, '/images/profiles/profile-framing-240x45.svg', 19)
  RETURNING id INTO v_framing_lvl_240x45;

  -- ── Posts ────────────────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H4 100×100', 'Radiata Pine', 'H4', '100 × 100', 'posts',
    ARRAY[2400,3000,3600], 8.90, '/images/profiles/profile-post-100x100.svg', 20)
  RETURNING id INTO v_post_100x100_h4;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H5 100×100', 'Radiata Pine', 'H5', '100 × 100', 'posts',
    ARRAY[2400,3000,3600], 12.50, '/images/profiles/profile-post-100x100.svg', 21)
  RETURNING id INTO v_post_100x100_h5;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H4 125×125', 'Radiata Pine', 'H4', '125 × 125', 'posts',
    ARRAY[2400,3000,3600], 14.20, '/images/profiles/profile-post-125x125.svg', 22)
  RETURNING id INTO v_post_125x125_h4;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H4 150×150', 'Radiata Pine', 'H4', '150 × 150', 'posts',
    ARRAY[2400,3000,3600], 19.80, '/images/profiles/profile-post-150x150.svg', 23)
  RETURNING id INTO v_post_150x150_h4;

  -- ── Boards / Palings ────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Pine Paling 150×19', 'Radiata Pine', 'H3.2', '150 × 19', 'palings',
    ARRAY[1200,1500,1800], 2.80, '/images/profiles/profile-board-150x19.svg', 30)
  RETURNING id INTO v_board_150x19_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Pine Paling 100×19', 'Radiata Pine', 'H3.2', '100 × 19', 'palings',
    ARRAY[1200,1500,1800], 2.10, '/images/profiles/profile-board-100x19.svg', 31)
  RETURNING id INTO v_board_100x19_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Pine Paling 200×19', 'Radiata Pine', 'H3.2', '200 × 19', 'palings',
    ARRAY[1200,1500,1800], 3.40, '/images/profiles/profile-board-200x19.svg', 32)
  RETURNING id INTO v_board_200x19_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Pine Board 150×25', 'Radiata Pine', 'H3.2', '150 × 25', 'palings',
    ARRAY[1800,2400,3000,3600], 3.60, '/images/profiles/profile-board-150x25.svg', 33)
  RETURNING id INTO v_board_150x25_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Radiata Pine H3.1 200×25', 'Radiata Pine', 'H3.1', '200 × 25', 'palings',
    ARRAY[1200,1500,1800,2400,3000,3600], 5.20, '/images/profiles/profile-board-200x25.svg', 34)
  RETURNING id INTO v_board_200x25_h31;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Cedar Paling 150×19', 'Western Red Cedar', 'None', '150 × 19', 'palings',
    ARRAY[1200,1500,1800,2000], 7.50, '/images/profiles/profile-board-150x19.svg', 35)
  RETURNING id INTO v_board_150x19_cedar;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Cedar Board 200×19', 'Western Red Cedar', 'None', '200 × 19', 'palings',
    ARRAY[1200,1500,1800,2400], 9.80, '/images/profiles/profile-board-200x19.svg', 36)
  RETURNING id INTO v_board_200x19_cedar;

  -- ── Rails ───────────────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Rail 65×35', 'Radiata Pine', 'H3.2', '65 × 35', 'rails',
    ARRAY[2400,3000,3600,4800], 2.40, '/images/profiles/profile-rail-65x35.svg', 40)
  RETURNING id INTO v_rail_65x35_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Rail 75×50', 'Radiata Pine', 'H3.2', '75 × 50', 'rails',
    ARRAY[2400,3000,3600,4800], 3.90, '/images/profiles/profile-rail-75x50.svg', 41)
  RETURNING id INTO v_rail_75x50_h32;

  -- ── Decking ─────────────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Kwila Decking 140×19', 'Kwila', 'None', '140 × 19', 'decking',
    ARRAY[1800,2400,3000,3600], 18.50, '/images/profiles/profile-decking-140x19.svg', 50)
  RETURNING id INTO v_deck_140x19_kwila;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Vitex Decking 140×19', 'Vitex', 'None', '140 × 19', 'decking',
    ARRAY[1800,2400,3000], 22.00, '/images/profiles/profile-decking-140x19.svg', 51)
  RETURNING id INTO v_deck_140x19_vitex;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Pine Decking H3.2 90×23', 'Radiata Pine', 'H3.2', '90 × 23', 'decking',
    ARRAY[2400,3600,4800], 5.20, '/images/profiles/profile-decking-90x23.svg', 52)
  RETURNING id INTO v_deck_90x23_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Pine Decking H3.2 140×32', 'Radiata Pine', 'H3.2', '140 × 32', 'decking',
    ARRAY[3600,4800,6000], 8.40, '/images/profiles/profile-decking-140x32.svg', 53)
  RETURNING id INTO v_deck_140x32_h32;

  -- ── Battens ─────────────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Batten 40×20', 'Radiata Pine', 'H3.2', '40 × 20', 'battens',
    ARRAY[2400,3600,4800], 1.40, '/images/profiles/profile-batten-40x20.svg', 60)
  RETURNING id INTO v_batten_40x20_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Treated Batten 65×19', 'Radiata Pine', 'H3.2', '65 × 19', 'battens',
    ARRAY[3600,4800,6000], 1.80, '/images/profiles/profile-batten-65x19.svg', 61)
  RETURNING id INTO v_batten_65x19_h32;

  -- ── Fence Capping ───────────────────────────

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Fence Capping 65×19', 'Radiata Pine', 'H3.2', '65 × 19', 'capping',
    ARRAY[3600,4800,6000], 1.80, '/images/profiles/profile-capping-65x19.svg', 70)
  RETURNING id INTO v_cap_65x19_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Fence Capping 90×19', 'Radiata Pine', 'H3.2', '90 × 19', 'capping',
    ARRAY[3600,4800,6000], 2.20, '/images/profiles/profile-capping-90x19.svg', 71)
  RETURNING id INTO v_cap_90x19_h32;

  INSERT INTO public.cut_products (tenant_id, name, species, treatment, profile, category, lengths, price_per_meter, image_url, sort_order)
  VALUES (v_tenant_id, 'Fence Capping 140×19', 'Radiata Pine', 'H3.2', '140 × 19', 'capping',
    ARRAY[3600,4800,6000], 3.10, '/images/profiles/profile-capping-140x19.svg', 72)
  RETURNING id INTO v_cap_140x19_h32;

  -- ============================================
  -- 3. INSERT PRESETS
  -- ============================================

  INSERT INTO public.cut_presets (tenant_id, name, slug, product_ids, default_product_id, settings, sort_order)
  VALUES
    -- Framing (includes battens)
    (v_tenant_id, 'Framing', 'framing',
      ARRAY[
        v_framing_90x45_h12, v_framing_90x45_h32,
        v_framing_140x45_h12, v_framing_140x45_h32,
        v_framing_190x45_h32, v_framing_240x45_h32, v_framing_290x45_h32,
        v_framing_45x45_h32,
        v_framing_lvl_200x45, v_framing_lvl_240x45,
        v_batten_40x20_h32, v_batten_65x19_h32
      ],
      v_framing_90x45_h32,
      '{"endTrim": 0, "minOffcut": 200, "kerf": 3}'::jsonb,
      1),

    -- Decking
    (v_tenant_id, 'Decking', 'decking',
      ARRAY[v_deck_140x19_kwila, v_deck_140x19_vitex, v_deck_90x23_h32, v_deck_140x32_h32],
      v_deck_140x19_kwila,
      '{"endTrim": 0, "minOffcut": 300, "kerf": 3}'::jsonb,
      2),

    -- Fencing (all fence-related categories)
    (v_tenant_id, 'Fencing', 'fencing',
      ARRAY[
        v_board_150x19_h32, v_board_100x19_h32, v_board_200x19_h32,
        v_board_150x25_h32, v_board_200x25_h31,
        v_board_150x19_cedar, v_board_200x19_cedar,
        v_post_100x100_h4, v_post_100x100_h5, v_post_125x125_h4, v_post_150x150_h4,
        v_rail_65x35_h32, v_rail_75x50_h32,
        v_cap_65x19_h32, v_cap_90x19_h32, v_cap_140x19_h32
      ],
      v_board_150x19_h32,
      '{"endTrim": 0, "minOffcut": 150, "kerf": 3}'::jsonb,
      3),

    -- Custom (shows all products)
    (v_tenant_id, 'Custom', 'custom',
      '{}',
      NULL,
      '{"endTrim": 0, "minOffcut": 100, "kerf": 3}'::jsonb,
      99);

  -- ============================================
  -- 4. OUTPUT
  -- ============================================

  RAISE NOTICE '✓ Tenant: % (slug: demo-test)', v_tenant_id;
  RAISE NOTICE '✓ Embed key: %', v_embed_key;
  RAISE NOTICE '✓ 32 products inserted';
  RAISE NOTICE '✓ 4 presets inserted';
  RAISE NOTICE '';
  RAISE NOTICE 'Load with: ?embed=%', v_embed_key;

END $$;
