# Fence Preview Integration Guide

## What This Is

You're integrating a fence elevation preview and cross-section visualisation into the shmakeCut fencing calculator. The preview component already exists as a standalone file (`FencePreview.jsx`). Your job is to wire it into the main calculator so the preview updates live as the user configures their fence.

**Before you start coding, read this entire document. Several sections require you to ask the user questions before proceeding.**

---

## Reference Files

- `FencePreview.jsx` — Contains four exportable components:
  - `FenceElevation` — SVG elevation view (front/back toggle, posts, rails, cladding, capping, dimensions)
  - `FenceCrossSection` — SVG plan-section showing board layering per style
  - `StylePatternIcon` — Mini pattern icons for style tab buttons
  - `FencePreviewDemo` — Interactive demo wrapper (NOT used in integration — this is the standalone demo only)
- `shmakecut-fencing-mode-spec.md` — Full spec for the fencing calculator mode (sections, components, cut list generation, algorithm integration)

---

## What You're Building

When the user is in Fencing mode, the preview panel shows a live visualisation of their fence that updates as they change parameters. It replaces the need to mentally picture the output.

The preview needs to be fed by the same state the calculator uses — height, post spacing, rail count, paling width, gap, overlap, style, capping toggle. It does NOT have its own controls — it reads from the calculator form state.

---

## Questions to Ask Before Starting

### Layout & Position

> **Ask the user:** Where should the preview sit relative to the calculator form?
> Options to suggest:
> - Above the form (user sees the fence first, scrolls to configure)
> - Side-by-side on desktop, stacked on mobile (form left, preview right)
> - Below the sections but above the component dropdowns
> - Collapsible panel that the user can toggle open/close
>
> This affects responsive behaviour significantly. Get a clear answer.

### Style Selector Ownership

The standalone demo has a combined style-selector + cross-section tabbed component. In the calculator context:

> **Ask the user:** Should the tabbed style selector (pattern icons + cross section) replace whatever style selection currently exists in the fence section form? Or should the style be set per-section in the section row, with the preview/cross-section sitting separately as a read-only visualisation of the currently selected/focused section?
>
> This matters because:
> - The spec says each section has its own style
> - If you have 3 sections with different styles, which one does the preview show?
> - Multi-section preview is a different problem to single-section preview

### Multi-Section Behaviour

> **Ask the user:** When there are multiple fence sections with different configurations, what should the preview show?
> Options to suggest:
> - Always show the currently focused/selected section
> - Show all sections side by side (complex, may not be worth it yet)
> - Show the first section, with a dropdown to switch between sections
>
> The FenceElevation component currently renders N bays of a single configuration. It doesn't handle mixed sections.

### View Toggle

> **Ask the user:** Should the Front/Back view toggle stay in the preview, or is front-only sufficient for the customer-facing calculator? The back view shows structural detail (posts, rails, underground depth) that might be more relevant to the timber yard staff than the end customer.
>
> Consider: the embedded widget on a timber yard's website is customer-facing. The admin/staff view might want different defaults.

---

## Integration Architecture

Once you have answers to the above, follow this approach:

### 1. Extract Components

From `FencePreview.jsx`, extract into your component structure:
- `FenceElevation` — the SVG renderer (pure, stateless, prop-driven)
- `FenceCrossSection` — the SVG cross-section renderer (pure, stateless, prop-driven)
- `StylePatternIcon` — used by the style tabs
- `STYLES` constant — the style key/label map
- `COLORS` constant — shared colour palette

Do NOT import `FencePreviewDemo` — that's the standalone wrapper with its own state. The calculator form IS the state owner.

### 2. Props Interface

`FenceElevation` accepts:

```
height          - Finished fence height (mm)
postSpacing     - Centre-to-centre post spacing (mm)
postWidth       - Post width (mm, default 100)
railCount       - Number of rails (2-4)
railHeight      - Rail height (mm, default 45)
palingWidth     - Paling face width (mm)
palingThickness - Paling thickness (mm, default 19)
gap             - Gap between palings (mm)
overlap         - Lap overlap (mm, for lapped/hit-and-miss styles)
boardWidth      - Horizontal slat board width (mm)
boardGap        - Horizontal slat gap (mm)
style           - One of: standard_vertical, vertical_lapped, hit_and_miss, horizontal_slat
showCapping     - Boolean
capHeight       - Capping height (mm, default 19)
bays            - Number of bays to render (integer, 1-3)
viewSide        - "front" or "back"
```

`FenceCrossSection` accepts:

```
style           - Same style key
palingWidth     - Paling face width (mm)
palingThickness - Paling thickness (mm, default 19)
gap             - Gap between palings (mm)
overlap         - Lap overlap (mm)
railWidth       - Rail width (mm, default 90)
railThickness   - Rail thickness (mm, default 45)
```

### 3. State Mapping

Map from your fencing calculator form state to preview props. The calculator state (per the spec) looks like:

```js
{
  sections: [
    { id, label, length, height, style }
  ],
  components: {
    posts:    { productId, spacing, lengthOverride },
    rails:    { productId, count },
    cladding: { productId, gap },
    capping:  { enabled, productId }
  }
}
```

The preview needs a flattened view of ONE section's config merged with component settings:

```js
// For whichever section is "active" in the preview
const activeSection = sections[activeSectionIndex];

<FenceElevation
  height={activeSection.height}
  postSpacing={components.posts.spacing}
  railCount={components.rails.count}
  palingWidth={???}       // See question below
  gap={components.cladding.gap}
  overlap={???}           // See question below
  style={activeSection.style}
  showCapping={components.capping.enabled}
  bays={2}                // Or calculate from section length
  viewSide={viewSide}
/>
```

> **Ask the user:** Where do `palingWidth` and `overlap` come from? These aren't in the current spec state. Options:
> - Derive from the selected cladding product's metadata (does the product catalogue store board width?)
> - Add explicit fields to the cladding component config
> - Use sensible defaults (150mm width, 25mm overlap) with an advanced options toggle
>
> Same question for `boardWidth` and `boardGap` when horizontal slat is selected.

### 4. Bays Calculation

The preview renders a fixed number of bays for illustration. In the standalone demo it's a user control (1-3).

> **Ask the user:** Should the preview always show 2 bays as a representative sample? Or calculate from the section length (e.g. a 6m section at 2400mm spacing = 2.5 bays, show 2)? Showing the real number of bays won't work visually for long runs (a 20m fence would be 8+ bays — too compressed).

### 5. Style Selector Integration

The tabbed component (style icons + cross section) currently lives outside the per-section form. You need to decide how it connects.

If style is per-section (as per spec):
- The tabbed style selector could sit inside each section's expandable row
- Or it could be a shared component that edits the currently focused section's style
- The cross-section always shows the active section's style

If style is global (simpler, may be sufficient for v1):
- One style for the whole fence
- Tabbed selector sits at the top of the fencing form
- All sections inherit the same style

> **Ask the user:** For the first version, is style-per-section important, or can we simplify to one style for the whole fence? Most residential fences use one style throughout. Per-section can be added later.

---

## What NOT to Change

- `cuttingAlgorithm.js` — No modifications. It's product-agnostic.
- Output panel — The cutting plan visualisation, stats, and PDF export stay as-is. They receive generated cut lists regardless of input mode.
- Product catalogue schema — No changes. Category filtering already exists.

---

## File Organisation

> **Ask the user:** What's the current component file structure? Specifically:
> - Where do shared components live?
> - Is there a components directory structure (e.g. `components/fencing/`)?
> - Are you using any component library or just raw React + Tailwind?
> - The preview uses inline styles — should these be converted to Tailwind classes for consistency?

---

## Testing

After integration, verify:

1. **Preview updates live** — changing any form field immediately reflects in the elevation
2. **Style tab changes** — switching style updates both the elevation AND the cross-section
3. **Front/Back toggle** — if included, switches between customer view (front) and structural view (back)
4. **Capping toggle** — capping appears/disappears on the elevation without layout shift
5. **No layout jumping** — elevation height stays constant between front/back views, cross-section container stays constant between styles
6. **Responsive** — preview scales down on mobile without breaking
7. **Performance** — SVG re-renders on every form change; confirm no lag with rapid slider/dropdown changes

---

## Summary of Questions to Resolve

Before writing any integration code, get answers to:

1. Where does the preview sit in the layout?
2. Does the style tab replace the per-section style selector, or sit separately?
3. What does the preview show when multiple sections have different configs?
4. Is the front/back toggle needed in the embedded widget?
5. Where do `palingWidth`, `overlap`, `boardWidth`, `boardGap` values come from?
6. Fixed 2 bays or calculated from section length?
7. Style per-section or global for v1?
8. What's the component file structure and styling approach?

Do not assume answers to these. Ask the user and wait for direction.
