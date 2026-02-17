# shmakeCut: Fencing Calculator Mode — Implementation Plan

## Context

shmakeCut is an embeddable white-label cutting calculator for independent timber yards. The current UI (see screenshot) has a product category selector (Framing Timber, Decking, Fencing, Custom) that filters a flat product list. Users manually enter required cut lengths and quantities, then the cutting algorithm optimises cuts across available stock lengths.

We're repurposing the category selector into a **mode selector** that changes the entire input UI depending on what the user is building. The cutting algorithm itself doesn't change — each mode just generates a different cut list that feeds into the same optimizer.

## Mode Architecture

The top-level tabs become functional modes:

- **General** — Default. Flat product list, manual cut entry. This is the current behaviour, unchanged. Shows ALL products regardless of category.
- **Fencing** — Smart fence builder (this task).
- **Decking** — Future. Placeholder tab only for now.
- **Walls** — Future. Placeholder tab only for now.

When "General" is selected, the UI looks exactly as it does today — product dropdown, stock lengths, required cuts, calculate button.

When "Fencing" is selected, the entire input panel below the mode tabs is replaced with the fencing-specific UI described below. The output side (cutting plan visualisation, stats, PDF export) remains identical — it just receives the generated cut list instead of manually entered cuts.

## Fencing Calculator — User Flow

### 1. Fence Sections

The user adds one or more fence sections. Each section represents a continuous run of fencing (e.g. "Front boundary", "Left side", "Back fence").

Each section has:
- **Label** (optional, free text) — e.g. "Front boundary"
- **Length** (metres) — total run length of this section
- **Finished height** (mm) — e.g. 1200, 1500, 1800
- **Style** — selected from available cladding styles (see below)

Default: one section, no label, empty length, 1800mm height, "Standard vertical" style.

Users can add/remove sections. A summary line shows total metres across all sections.

### 2. Component Selection

Below the sections, the user selects products for each fence component. These dropdowns are filtered from the tenant's product catalogue by category. Each component maps to a product category that the wholesaler has configured in their catalogue.

Components:

**Posts**
- Product dropdown (filtered to "posts" category)
- Post spacing input (mm, default 2400)
- Post length: auto-calculated from finished height using 1/3 rule (underground = finished height ÷ 3, rounded up to nearest stock length). Display as recommendation, user can override.
- Formula: `post_length = finished_height × (4/3)`, rounded up to nearest available stock length for that product
- Post count per section: `Math.ceil(section_length / post_spacing) + 1`
- Corner/end posts: for now, don't try to distinguish these. Just calculate count.

**Rails**
- Product dropdown (filtered to "rails" category)
- Number of rails: auto-suggested based on height (2 rails for ≤1500mm, 3 rails for >1500mm). User can override.
- Rail cut length = post spacing (the span between posts)
- Total rail cuts = rails_per_bay × number_of_bays_per_section, across all sections

**Cladding / Palings**
- Product dropdown (filtered to "palings" or "cladding" category)
- Style determines the quantity calculation (see Cladding Styles below)
- For vertical styles: palings are bought at finished length (not cut from longer stock), so this is a quantity calculation, not a cutting optimization
- For horizontal styles: boards span between posts and DO go through the cutting optimizer
- Gap between boards (mm, default 0 for standard, configurable)

**Capping** (optional, toggled on/off)
- Product dropdown (filtered to "capping" category)  
- Linear metres = total fence length across all sections
- These cuts go through the optimizer (cut from stock lengths)

### 3. Cladding Styles

Each style affects how paling/board quantity is calculated:

**Standard Vertical**
- Palings run vertically, side by side
- Count per section: `Math.ceil(section_length / (paling_width + gap))`
- Palings are at finished height length (not cut)

**Vertical Lapped**
- Each paling overlaps the previous by an amount (default 25mm)
- Count per section: `Math.ceil(section_length / (paling_width - overlap + gap))`
- Palings are at finished height length (not cut)

**Alternating (Hit & Miss)**
- Boards on both sides of rails, offset so gaps are covered
- Front count: `Math.ceil(section_length / (paling_width + gap))`
- Back count: same formula but offset (effectively same count for full coverage)
- Total ≈ front + back
- Palings are at finished height length (not cut)

**Horizontal Slat**
- Boards run horizontally between posts
- Rows: `Math.floor(finished_height / (board_width + gap))`
- Each row's cut length = post spacing (span between posts)
- Total cuts = rows × bays, and these DO go through the cutting optimizer
- This is the one style where cladding feeds into the algorithm

### 4. Generating the Cut List

When the user clicks "Calculate", the fencing mode translates the fence spec into a cut list, grouped by component. Each component's cuts are optimized separately against that product's available stock lengths.

The output should run the cutting algorithm once per component/product:

1. **Posts** — N cuts at post_length mm, optimized against post stock lengths
2. **Rails** — N cuts at rail_span mm, optimized against rail stock lengths  
3. **Cladding (horizontal only)** — N cuts at rail_span mm, optimized against cladding stock lengths
4. **Cladding (vertical)** — quantity only, no optimization needed (they're bought at length). Add to shopping list as "90 × 1800mm palings"
5. **Capping** — linear cuts optimized against capping stock lengths

Each optimization produces its own cutting plan with efficiency stats and visual bars. The output panel shows all component plans together, with a combined shopping list and total cost at the bottom.

### 5. Output / Results

The results panel should show:

- **Per-component cutting plans** — each with the existing visual bar representation (green cuts, dark kerf, amber offcuts, red scrap)
- **Quantity-only items** — vertical palings listed as "90 × Radiata Pine 150×19 1800mm" with cost
- **Combined shopping list** — all stock to purchase across all components, grouped by product
- **Total cost** — sum across everything
- **Fence summary** — total metres, total posts, total rails, total palings

The PDF export should include all of this, with a "Fence Specification" header section showing the section breakdown before the cutting plans.

## Implementation Approach

### Files to modify

**CuttingOptimizer.jsx** (main component)
- Rename/refactor the preset tabs from category filters to mode selectors
- Add state for `activeMode` ("general" | "fencing" | "decking" | "walls")
- When mode is "general": render current UI unchanged
- When mode is "fencing": render `<FencingCalculator>` component in place of the manual cut entry UI
- Keep the output/results panel shared across modes — it just receives cutting plans to display

**New: FencingCalculator.jsx**
- Self-contained component for the fencing input UI
- Manages fence sections, component selections, style picker
- Has its own "Calculate" button that:
  1. Translates fence spec → cut lists (one per component)
  2. Runs the existing `optimizeCuts()` function from `cuttingAlgorithm.js` for each component
  3. Passes results back up to the parent for display
- Props: `products` (tenant's product catalogue), `config` (tenant settings), `onResults(plans)` callback

**cuttingAlgorithm.js** — NO CHANGES. The algorithm is product-agnostic. It takes cut lengths + stock lengths and optimizes. The fencing calculator just calls it multiple times with different inputs.

**generateCuttingPlanPDF.js** — Minor additions to support:
- Multiple component plans in one PDF
- A fence specification summary section
- Quantity-only line items (vertical palings)

### Component category mapping

The fencing calculator needs to know which products are posts, which are rails, which are palings, etc. This should be driven by the existing `category` field on `cut_products`. The tenant sets up their products with categories like "posts", "rails", "palings", "capping" and the fencing calculator filters the product dropdown by category.

If the tenant doesn't have products in these categories, the fencing mode can show a message: "Your supplier hasn't configured fencing products yet."

No database schema changes should be needed — the existing `cut_products.category` field handles this.

### State structure for fencing mode

```js
{
  sections: [
    { id: "s1", label: "Front boundary", length: 12, height: 1800, style: "standard_vertical" }
  ],
  components: {
    posts: { productId: "xxx", spacing: 2400, lengthOverride: null },
    rails: { productId: "xxx", count: 3 },
    cladding: { productId: "xxx", gap: 0 },
    capping: { enabled: true, productId: "xxx" }
  }
}
```

### Visual design

- Keep the same visual language as the current calculator — same card styles, same input styling, same colour scheme
- Sections should be expandable cards (like an accordion) with a summary line when collapsed
- The style picker should be visual — small icons/illustrations showing the paling pattern for each style (can be simple SVG line drawings)
- Component selection should be a clean vertical stack: Posts → Rails → Cladding → Capping
- Show the auto-calculated values (post length, post count, rail count, paling count) as live-updating summary text as the user fills in the form, BEFORE they hit calculate

### Edge cases to handle

- Section length not evenly divisible by post spacing — last bay is shorter, rail cuts for that bay are shorter
- Zero-length sections — ignore/validate
- Missing product categories — graceful fallback, show message
- Horizontal cladding with different post spacings across sections — generate cuts per section
- Decimal lengths — work in mm internally, display in m where appropriate
- Post length recommendation exceeds available stock — show warning, let user pick manually

## What NOT to build yet

- Decking calculator — placeholder tab only, shows "Coming soon"  
- Wall framing calculator — placeholder tab only
- Gate calculations — not in scope
- Slope/stepped fence adjustments — not in scope  
- 3D or plan-view visualisation — not in scope (nice-to-have later)
- Saving/loading fence specs — not in scope for first version

## Summary

The key mental model: the fencing calculator is a **smart input form** that produces a cut list. Everything downstream — the optimisation algorithm, the visual output, the PDF export, the shopping list — already exists. We're building the translation layer that turns "I want 30m of 1.8m high standard paling fence" into "I need 14 posts at 2400mm, 39 rails at 2400mm, 180 palings at 1800mm, and 30m of capping" and then feeds each component through the existing optimizer.
