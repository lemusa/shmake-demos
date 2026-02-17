# shmakeCut: Wall Framing Mode — Implementation Spec

## Context

This is the third mode in shmakeCut's mode selector (after General and Fencing). The wall framing calculator lets users define wall panels with openings (doors and windows), and generates a cut list for studs, plates, nogs, lintels, trimmers, and cripple studs. The cut list feeds into the same cutting optimizer — no algorithm changes.

This tool generates **material quantities and cut lengths**. It is NOT a structural engineering tool and must be explicit about that.

---

## Important Disclaimer — Display Prominently

The following disclaimer (or similar) must be visible at all times when the wall mode is active. Not buried in a tooltip — visible in the UI.

> **This tool estimates framing materials for standard non-load-bearing timber wall frames to NZS 3604. It does not constitute engineering design. Load-bearing walls, bracing elements, multi-storey construction, and walls exceeding standard spans require specific engineering design (PS1). Always confirm framing requirements with your designer, engineer, or building consent authority before ordering.**

### What We Can Reasonably Cover (NZS 3604 Scope)

- Standard stud spacings: 400mm or 600mm centres
- Standard framing timber sizes: 90×45mm and 140×45mm
- Single or double top plates
- Nogs/dwangs at standard centres
- Standard door and window opening framing (trimmers, jack studs, lintels, sills, cripple studs)
- Bottom plate continuous (with break at door openings)

### What We Explicitly Do NOT Cover

- Bracing design and bracing element placement
- Load-bearing wall specific requirements (post sizes, bearer connections, foundation tie-downs)
- Multi-storey load paths
- Seismic and wind zone specific detailing
- Lintel sizing for span (we provide the cut but NOT the timber grade/size selection for structural lintels)
- Portal frames, steel beams, or engineered connections
- Compliance documentation or producer statements

---

## Wall Panel — User Input

### Panel Definition

Each wall panel is a rectangle defined by:
- **Wall length** (mm) — total length of the wall
- **Wall height** (mm) — stud height, which is the height between top of bottom plate and underside of top plate. Standard options: 2400mm (standard), 2700mm (high stud). Allow custom entry.
- **Framing timber** — product dropdown filtered to "framing" category. This is the stud/nog/cripple timber (e.g. 90×45 MSG8)
- **Plate timber** — product dropdown filtered to "plates" category. May be same product as framing timber, or different (e.g. 90×45 for studs, 140×45 for plates). Could default to same as framing timber with option to override.

> **Ask the user:** Should plate timber default to the same product as framing timber, or always be a separate selection? In practice they're often the same size but sometimes plates are wider.

### Stud Configuration

- **Stud spacing** — 400mm or 600mm centres (dropdown, default 600mm)
- **Double top plate** — toggle (default: on). NZS 3604 typically requires double top plate. Single plate is acceptable in some non-load-bearing situations.

### Nog Configuration

- **Nog rows** — auto-calculated based on wall height. NZS 3604 requires nogs at max 1350mm centres for 600mm stud spacing, or can be omitted for 400mm spacing with sheet bracing. Suggest default based on stud spacing, allow override.
  - 2400mm wall at 600mm spacing → 1 row of nogs at mid-height
  - 2700mm wall at 600mm spacing → 1–2 rows of nogs
  - 400mm spacing → 0 rows (optional, for services blocking)

> **Ask the user:** Should nog count be auto-calculated with override, or always manual? Auto is friendlier but the rules depend on lining type and bracing requirements which we don't know.

### Openings

Users add openings to the wall panel. Each opening has:

- **Type** — Door or Window
- **Width** (mm) — rough opening width (e.g. 810mm for standard door, 1200mm for window)
- **Height** (mm) — rough opening height (e.g. 2040mm for standard door, 1200mm for window)
- **Position** (mm) — distance from left end of wall to left edge of opening. Or drag-position on the visual.
- **Sill height** (mm, windows only) — height from floor to bottom of opening (e.g. 900mm typical)

For doors, sill height is always 0 (opening goes to floor, bottom plate is cut).

Common presets to offer:
- Standard interior door: 810 × 2040mm
- Standard exterior door: 860 × 2040mm
- Double door / ranch slider: 1800 × 2040mm
- Standard window: 1200 × 1200mm, sill at 900mm
- Small window: 600 × 600mm, sill at 1200mm

> **Ask the user:** Should we include presets as quick-add buttons, or just have the raw dimension inputs? Presets speed things up but might imply we know exact sizes when rough opening dimensions vary by manufacturer and installation method.

---

## Framing Components — What Gets Cut

### 1. Bottom Plate

- Full wall length, minus door openings
- For a wall with a door, the bottom plate is in two pieces (left of door, right of door)
- Cut from plate timber stock
- Goes through cutting optimizer

### 2. Top Plate(s)

- Full wall length, continuous (no breaks at openings — top plate runs over lintels)
- If double top plate: two cuts at wall length
- Cut from plate timber stock
- Goes through cutting optimizer

### 3. Full Studs

- Height = wall height (distance between plates)
- Spacing: every 400mm or 600mm on centre, measured from one end
- Studs that fall within an opening are NOT generated (replaced by trimmer/jack/cripple studs)
- Count: calculate positions, exclude any that fall within opening zones
- **Always include a stud at each end of the wall** regardless of spacing
- Goes through cutting optimizer

### 4. Trimmer Studs (King Studs)

- Full-height studs at each side of every opening
- These run bottom plate to top plate (same height as regular studs)
- 2 per opening (one each side)
- If a regular stud position coincides with a trimmer position, the trimmer replaces it (don't double up)

### 5. Jack Studs (Jamb Studs)

- Shortened studs that sit beside each trimmer, supporting the lintel
- Height = from bottom plate to underside of lintel
- For doors: jack stud height = door opening height
- For windows: jack stud height = sill height + window height (top of opening)
- 1 per side of opening = 2 per opening
- Goes through cutting optimizer

### 6. Lintels (Headers)

- Horizontal timber spanning the top of each opening
- Length = opening width + bearing on each side (typically 50mm each side, so lintel length = opening width + 100mm). But this depends on the lintel sitting on the jack studs, so lintel length = distance between trimmers (which is opening width + 2 × jack stud thickness... but the jack studs sit inside the trimmers).

Let me be precise:
- Trimmer studs are at each edge of the rough opening
- Jack studs sit between the trimmers, hard up against them
- Lintel sits on top of the jack studs, spanning between trimmers
- So lintel length = rough opening width (it spans the gap between jack studs)

> **Ask the user:** Confirm lintel length = rough opening width, or rough opening width + some bearing? NZS 3604 requires minimum 50mm bearing each side. If jack studs provide the bearing, lintel just spans between them at opening width. If lintel sits on trimmers, it's opening width + 2 × stud thickness. Confirm the framing detail assumed here.

- **Critical:** We generate the lintel CUT but we do NOT specify the lintel timber size or grade. Lintel sizing depends on span, load, and wind zone — this requires engineering or NZS 3604 Table 8.1 lookup. The tool should note: *"Lintel size/grade must be confirmed by your engineer or designer for the specific span and load condition."*
- Goes through cutting optimizer (cut from whatever stock the user selects)

> **Ask the user:** Should there be a separate "lintel timber" product dropdown? Lintels are often a different size (e.g. 190×45, 240×45, or LVL) than the framing timber. Or should the user just select from the framing product?

### 7. Sill Trimmers (Windows Only)

- Horizontal timber at the bottom of window openings
- Length = same as lintel length (rough opening width)
- One per window opening
- Goes through cutting optimizer (same timber as framing)

### 8. Cripple Studs

- Short studs that maintain the stud spacing grid above and below openings
- **Above openings (doors and windows):** between lintel and top plate, at the regular stud spacing grid
  - Height = wall height − (opening top height) − lintel depth
  - For doors: height = wall height − door height − lintel depth
  - For windows: height = wall height − sill height − window height − lintel depth
- **Below windows:** between bottom plate and sill trimmer, at the regular stud spacing grid
  - Height = sill height
- Count: however many regular stud positions fall within the opening width
- Goes through cutting optimizer

### 9. Nogs / Dwangs

- Horizontal blocking between studs
- Length = stud spacing − stud thickness (they fit between studs)
- Installed at each nog row height
- Run through entire wall length including through openings where studs exist
- Nogs that fall within an opening zone (between trimmer studs, between sill and lintel) are skipped
- Count: (number of stud bays) × (number of nog rows), minus nogs within openings
- Goes through cutting optimizer (same timber as framing)

---

## Visualisation — Build Alongside, Not After

**Do not defer the visual.** The wall frame SVG is the primary verification tool for the calculation logic. Without it, validating cut positions against a table of 30+ members is slow and error-prone. Wall framing is just rectangles in a grid with holes — simpler to render than fencing (no overlapping layers, no angles, no front/back views).

### Approach

Build a bare-bones wireframe SVG alongside the calculation functions. Every time you calculate a member's position and length, draw it. If the drawing looks wrong, the maths is wrong. Iterate on both together.

**Phase 1 — Debug wireframe (build first, keep forever):**
- Bottom plate: horizontal bar at base, breaks at doors
- Top plate(s): horizontal bar(s) at top
- Full studs: vertical bars at spacing positions
- Trimmer studs: vertical bars in a different colour at opening edges
- Jack studs: shorter verticals, different colour, beside trimmers
- Lintels: horizontal bar at top of openings, highlighted
- Sill trimmers: horizontal bar at bottom of windows
- Cripple studs: short verticals above/below openings, different colour
- Nogs: horizontal lines between studs, gaps at openings
- Openings: shaded or outlined zones

Each member type gets a distinct colour. No polish — just enough to look at it and confirm "that's right" or "that nog shouldn't be there."

**Phase 2 — Polish (after calculations are verified):**
- Dimension lines (wall length, height, opening positions and sizes)
- Labels for member types
- Hover/click to highlight a member and show its cut length
- Cleaner colour palette consistent with fencing preview
- Opening type indicators (door vs window)

### What to Show

The visual is a front-on elevation of the wall frame — you're looking at the face of the studs. Every member is a rectangle at a known position:

- X position = along the wall length
- Y position = height from floor
- Width = member thickness (studs) or member length (plates, nogs, lintels)
- Height = member length (studs, cripples) or member depth (plates, nogs, lintels)

### Interaction (Phase 2)

- Openings could be drag-positioned on the visual (stretch goal)
- The visual updates live as parameters change (same pattern as fence preview)
- Click a member to see: type, timber product, cut length

---

## Cut List Generation

When the user clicks Calculate, the wall spec translates to a cut list grouped by component:

1. **Bottom plates** — N cuts at various lengths (wall length pieces, split at doors)
2. **Top plates** — N cuts at wall length (×2 if double top plate)
3. **Full studs** — N cuts at stud height
4. **Trimmer studs** — N cuts at stud height (same as full studs, but counted separately for the materials list)
5. **Jack studs** — N cuts at jack height (varies per opening)
6. **Lintels** — N cuts at lintel length (varies per opening) — **flagged with engineering note**
7. **Sill trimmers** — N cuts at sill length (varies per opening)
8. **Cripple studs (above)** — N cuts at cripple height (varies per opening)
9. **Cripple studs (below windows)** — N cuts at sill height
10. **Nogs** — N cuts at nog length (consistent within a stud spacing, but may vary if openings disrupt spacing)

Each group is optimised separately against its stock timber. Plates optimise against plate stock, everything else against framing stock (unless lintels have a separate product).

### Output

- Per-component cutting plans (same visual bars as existing optimizer output)
- Wall frame summary: total studs, plates, nogs, lintels, openings
- Shopping list: total metres/pieces per product
- Total cost
- PDF export with wall diagram, cut lists, engineering disclaimer

---

## State Structure

```js
{
  wall: {
    length: 6000,        // mm
    height: 2400,        // mm (stud height between plates)
    studSpacing: 600,    // mm
    doubleTopPlate: true,
    nogRows: 1,          // auto-calculated or manual
    framingProductId: "xxx",
    plateProductId: "xxx",
    lintelProductId: "xxx",  // if separate
  },
  openings: [
    {
      id: "o1",
      type: "door",        // "door" or "window"
      width: 810,          // mm rough opening
      height: 2040,        // mm rough opening
      position: 1500,      // mm from left edge of wall
      sillHeight: 0,       // mm (always 0 for doors)
    },
    {
      id: "o2",
      type: "window",
      width: 1200,
      height: 1200,
      position: 3500,
      sillHeight: 900,
    },
  ],
}
```

---

## Implementation Files

### Modifications

- **CuttingOptimizer.jsx** — Add "Walls" to mode selector tabs. When active, render `<WallCalculator>` component.

### New Files

- **WallCalculator.jsx** — Self-contained wall framing input UI. Manages wall dimensions, openings, product selection. Calculate button translates wall spec → cut lists → runs `optimizeCuts()` per component → passes results to parent.
- **WallPreview.jsx** — SVG wall frame visualisation (if building the visual for v1).
- **wallCalculations.js** — Pure calculation functions: stud positions, opening framing, nog layout, cripple studs. Separated from UI for testability.

### No Changes

- **cuttingAlgorithm.js** — Untouched. Product-agnostic.
- **generateCuttingPlanPDF.js** — Minor additions for wall summary section and engineering disclaimer. Same pattern as fencing additions.

---

## Edge Cases to Handle

- **Opening wider than stud spacing** — multiple stud positions fall within opening. All replaced by cripple studs.
- **Opening at wall edge** — trimmer stud coincides with end stud. Don't double up.
- **Overlapping openings** — validate that openings don't overlap. Show error if they do.
- **Opening wider than wall** — validate opening fits within wall length with minimum framing each side (at least one stud bay width from each end).
- **Opening taller than wall** — validate opening height + sill height doesn't exceed wall height.
- **Zero openings** — simple wall, no trimmers/jacks/lintels/cripples. Just studs, plates, nogs.
- **Very short wall** — minimum wall length should be at least 2 × stud spacing (need at least one bay).

---

## Questions to Resolve Before Building

1. Should plate timber default to same as framing timber?
2. Should nog count be auto-calculated or manual?
3. Include opening presets (standard door, standard window) as quick-add buttons?
4. Confirm lintel length assumption (rough opening width vs. opening width + bearing)
5. Separate lintel timber product dropdown?
6. Where do these product dimension values (stud thickness, width) come from — product catalogue metadata or manual input?

Do not assume answers. Ask the user and wait for direction.
