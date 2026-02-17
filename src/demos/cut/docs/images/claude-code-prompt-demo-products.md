# Claude Code Task: Build Demo Product Catalogue with Profile Images

## Context

shmakeCut is a cutting calculator for timber yards. We need a working demo product catalogue populated with realistic NZ timber products. There is an existing image function in the codebase for product images, but nothing has been added or tested yet. This task wires it all up.

## Assets Available

24 SVG cross-section profile images have been generated and are in the project. They are named with the pattern:

```
profile-{category}-{width}x{height}.svg
```

Full list:
- `profile-framing-45x45.svg`
- `profile-framing-90x45.svg`
- `profile-framing-140x45.svg`
- `profile-framing-190x45.svg`
- `profile-framing-240x45.svg`
- `profile-framing-290x45.svg`
- `profile-post-100x100.svg`
- `profile-post-125x125.svg`
- `profile-post-150x150.svg`
- `profile-board-100x19.svg`
- `profile-board-150x19.svg`
- `profile-board-200x19.svg`
- `profile-board-150x25.svg`
- `profile-board-200x25.svg`
- `profile-rail-65x35.svg`
- `profile-rail-75x50.svg`
- `profile-decking-90x23.svg`
- `profile-decking-140x19.svg`
- `profile-decking-140x32.svg`
- `profile-batten-40x20.svg`
- `profile-batten-65x19.svg`
- `profile-capping-65x19.svg`
- `profile-capping-90x19.svg`
- `profile-capping-140x19.svg`

These are SVG files showing proportionally accurate timber cross-sections with wood grain texture. They should be placed in the appropriate assets/images directory in the project.

## Step 1: Find the Existing Image Function

Search the codebase for the existing product image function. It likely accepts a product ID or dimensions and returns an image path or component. Understand its interface before modifying anything.

Look for:
- Any `productImage`, `getProductImage`, `ProfileImage`, or similar function/component
- Image imports or asset references in product-related files
- Any placeholder or TODO comments about product images

## Step 2: Demo Product Data

Create or populate the demo product catalogue with the following products. Use whatever data structure already exists in the project. If there's a products array, seed file, or data layer, add to it. Don't create a parallel system.

Each product needs:
- `id` — unique identifier
- `name` — full product name
- `category` — one of: `framing`, `post`, `board`, `rail`, `decking`, `batten`, `capping`
- `species` — timber species
- `treatment` — treatment level (H1.2, H3.1, H3.2, H4, H5, or "Natural" for untreated)
- `grade` — structural grade where applicable (MSG8, MSG10, LVL11, or "—")
- `width` — cross-section width in mm
- `height` — cross-section height in mm (this is the thickness)
- `pricePerM` — price per lineal metre in NZD excl GST
- `stockLengths` — array of available lengths in mm
- `image` — reference to the profile SVG (path, import, or however the existing image function works)

### Product List

**Framing Timber**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| framing-90x45-h12 | Radiata Pine H1.2 90×45 | H1.2 | MSG8 | 90×45 | 3.80 | 2400, 3000, 3600, 4200, 4800, 6000 |
| framing-90x45-h32 | Radiata Pine H3.2 90×45 | H3.2 | MSG8 | 90×45 | 4.50 | 2400, 3000, 3600, 4200, 4800, 6000 |
| framing-140x45-h12 | Radiata Pine H1.2 140×45 | H1.2 | MSG8 | 140×45 | 5.95 | 2400, 3600, 4800, 6000 |
| framing-140x45-h32 | Radiata Pine H3.2 140×45 | H3.2 | MSG8 | 140×45 | 6.90 | 2400, 3000, 3600, 4800, 6000 |
| framing-190x45-h32 | Radiata Pine H3.2 190×45 | H3.2 | MSG8 | 190×45 | 9.20 | 3600, 4800, 6000 |
| framing-240x45-h32 | Radiata Pine H3.2 240×45 | H3.2 | MSG8 | 240×45 | 11.40 | 4800, 6000 |
| framing-290x45-h32 | Radiata Pine H3.2 290×45 | H3.2 | MSG8 | 290×45 | 13.80 | 4800, 6000 |
| framing-45x45-h32 | Radiata Pine H3.2 45×45 | H3.2 | MSG8 | 45×45 | 2.60 | 2400, 3000, 3600, 4800 |
| framing-lvl-200x45 | LVL Beam 200×45 | — | LVL11 | 200×45 | 14.50 | 4800, 6000, 7200 |
| framing-lvl-240x45 | LVL Beam 240×45 | — | LVL11 | 240×45 | 17.80 | 4800, 6000, 7200 |

Image mapping: All framing products use `profile-framing-{width}x{height}.svg`. LVL beams use the closest framing profile by dimensions (200×45 → `profile-framing-190x45.svg`, 240×45 → `profile-framing-240x45.svg`).

**Posts**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| post-100x100-h4 | Radiata Pine H4 100×100 | H4 | — | 100×100 | 8.90 | 2400, 3000, 3600 |
| post-100x100-h5 | Radiata Pine H5 100×100 | H5 | — | 100×100 | 12.50 | 2400, 3000, 3600 |
| post-125x125-h4 | Radiata Pine H4 125×125 | H4 | — | 125×125 | 14.20 | 2400, 3000, 3600 |
| post-150x150-h4 | Radiata Pine H4 150×150 | H4 | — | 150×150 | 19.80 | 2400, 3000, 3600 |

Image mapping: `profile-post-{width}x{height}.svg`

**Boards / Palings**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| board-150x19-h32 | Treated Pine Paling 150×19 | H3.2 | — | 150×19 | 2.80 | 1200, 1500, 1800 |
| board-100x19-h32 | Treated Pine Paling 100×19 | H3.2 | — | 100×19 | 2.10 | 1200, 1500, 1800 |
| board-200x19-h32 | Treated Pine Paling 200×19 | H3.2 | — | 200×19 | 3.40 | 1200, 1500, 1800 |
| board-150x25-h32 | Treated Pine Board 150×25 | H3.2 | — | 150×25 | 3.60 | 1800, 2400, 3000, 3600 |
| board-200x25-h31 | Radiata Pine H3.1 200×25 | H3.1 | — | 200×25 | 5.20 | 1200, 1500, 1800, 2400, 3000, 3600 |
| board-150x19-cedar | Cedar Paling 150×19 | Natural | — | 150×19 | 7.50 | 1200, 1500, 1800, 2000 |
| board-200x19-cedar | Cedar Board 200×19 | Natural | — | 200×19 | 9.80 | 1200, 1500, 1800, 2400 |

Image mapping: `profile-board-{width}x{height}.svg`. Cedar and treated use the same profile image (different product, same dimensions).

**Rails**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| rail-65x35-h32 | Treated Rail 65×35 | H3.2 | — | 65×35 | 2.40 | 2400, 3000, 3600, 4800 |
| rail-75x50-h32 | Treated Rail 75×50 | H3.2 | — | 75×50 | 3.90 | 2400, 3000, 3600, 4800 |

Image mapping: `profile-rail-{width}x{height}.svg`

**Decking**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| decking-140x19-kwila | Kwila Decking 140×19 | Natural | — | 140×19 | 18.50 | 1800, 2400, 3000, 3600 |
| decking-140x19-vitex | Vitex Decking 140×19 | Natural | — | 140×19 | 22.00 | 1800, 2400, 3000 |
| decking-90x23-h32 | Pine Decking H3.2 90×23 | H3.2 | — | 90×23 | 5.20 | 2400, 3600, 4800 |
| decking-140x32-h32 | Pine Decking H3.2 140×32 | H3.2 | — | 140×32 | 8.40 | 3600, 4800, 6000 |

Image mapping: `profile-decking-{width}x{height}.svg`

**Battens**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| batten-40x20-h32 | Treated Batten 40×20 | H3.2 | — | 40×20 | 1.40 | 2400, 3600, 4800 |
| batten-65x19-h32 | Treated Batten 65×19 | H3.2 | — | 65×19 | 1.80 | 3600, 4800, 6000 |

Image mapping: `profile-batten-{width}x{height}.svg`

**Fence Capping**

| ID | Name | Treatment | Grade | Dims | $/m | Stock Lengths (mm) |
|----|------|-----------|-------|------|-----|-------------------|
| capping-65x19-h32 | Fence Capping 65×19 | H3.2 | — | 65×19 | 1.80 | 3600, 4800, 6000 |
| capping-90x19-h32 | Fence Capping 90×19 | H3.2 | — | 90×19 | 2.20 | 3600, 4800, 6000 |
| capping-140x19-h32 | Fence Capping 140×19 | H3.2 | — | 140×19 | 3.10 | 3600, 4800, 6000 |

Image mapping: `profile-capping-{width}x{height}.svg`

## Step 3: Wire Up Images

Connect each product to its profile SVG using whatever image function already exists in the codebase. The mapping logic is simple:

1. Use the product's `category`, `width`, and `height` to construct the filename: `profile-{category}-{width}x{height}.svg`
2. LVL products are an exception — they don't have an exact match. Map them to the nearest framing profile.
3. Products with the same dimensions but different treatments/species share the same profile image (e.g. cedar 150×19 and treated 150×19 both use `profile-board-150x19.svg`).

If the existing image function works by product ID, add the SVG path to each product record. If it works by dimensions/category lookup, implement the filename construction above.

**Test the image function** — render a product card or the product selector dropdown and verify that:
- Images display at the right size (they're SVGs, so they scale cleanly)
- Every product has an image (no broken references)
- The proportions look correct (a 150×19 board should look thin, a 100×100 post should look square)

## Step 4: Integrate with Product Selector

The product selector component (ProductSelector.jsx or equivalent) should show the profile image for each product. The image should appear:
- In the collapsed/selected state — the profile image replaces or sits alongside the dims badge
- In the dropdown rows — small profile thumbnail to the left of each product

The profile images are already proportionally correct, so they work at small sizes (24–40px height). They don't need additional scaling logic.

## Step 5: Category Filtering

Ensure the product catalogue supports filtering by category. The fencing calculator needs to filter to:
- `post` category for post selection
- `rail` category for rail selection  
- `board` category for cladding/paling selection
- `capping` category for capping selection

The wall framing calculator will filter to:
- `framing` category for studs, plates, and nogs
- `framing` category (including LVL) for lintels

The general mode shows all categories.

## Notes

- All prices are NZD excl GST. These are demo/placeholder prices, not real retail prices.
- Stock lengths are in mm internally. Display as metres in the UI (e.g. 2400 → "2.4m").
- The `treatment` field is important for NZ building compliance — H3.2 for exterior exposed, H4 for ground contact, H5 for marine/severe. The product selector should show treatment badges.
- Don't create a separate data layer for this. Use whatever product storage already exists in the project.
