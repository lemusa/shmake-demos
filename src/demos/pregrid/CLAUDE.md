# PreGrid

Motorsport race day prep and checklist PWA. Free for solo drivers, with a planned paid Team tier.

## Stack
- React 18 + Vite 5
- Tailwind v4 (via `@tailwindcss/vite` plugin — no config file, `@import "tailwindcss"` in CSS)
- Dexie.js + dexie-react-hooks for offline-first IndexedDB
- React Router v6
- Lucide React for icons (custom SVG paths in `data/icons.js` for motorsport-specific icons)

## Architecture

### Data model (`db.js`)
All data lives in IndexedDB via Dexie. No backend in v1 — Supabase will be added for the Team tier.

Key tables:
- `vehicles` — driver's garage, multi-discipline, used for per-vehicle checklist item duplication
- `venues` — saved circuits/stages with lap length for km calculation
- `events` — race events with embedded `sessions[]` JSON and `vehicleIds[]`
- `checklistItems` — all checklist items across types (pre-event, race-day, session), discriminated by `checklistType` and `sessionId`
- `settings` — key-value for theme, preferences, and custom templates (`template_${discipline}_${type}`)

### Custom templates
- Built-in defaults live in `data/templates.js` — these are the initial content
- Users can customise templates per discipline per checklist type via Settings → Templates
- Custom templates are stored in the `settings` table with key `template_${discipline}_${checklistType}`
- `getEffectiveTemplate()` checks for custom first, falls back to built-in
- From a checklist's edit mode, "Save as default template" pushes event-specific changes back to the master template

### Checklist generation
Items are generated lazily on first open via `generateChecklist()` in `db.js`.
- Generation runs as a side-effect (`useEffect`), NOT inside `useLiveQuery` — writes inside live queries break Dexie observables
- The live query is a pure read that reacts to `checklistItems` table changes
- Items with `perVehicle: true` in templates are duplicated once per vehicle in the event
- Items with `perVehicle: false` appear once as general items (vehicleId: null)
- Users can add/remove/reorder items per-event in edit mode

### Session tracking
Sessions are embedded JSON in the events table. Each session tracks:
- `type`, `plannedLaps` — set at event creation
- `actualLaps`, `startPosition`, `finishPosition` — recorded post-session on EventDetail
- `notes` — post-session notes (inline editable on EventDetail)

### Vehicle integration
Each event has a `vehicleIds: number[]` array. On the checklist screen, items are grouped:
1. General items (vehicleId: null) shown first
2. Per-vehicle groups shown with colour-coded section headers

### Icons
Two-tier system:
1. Lucide React icons for generic items (shield, flag, book, etc.)
2. Custom SVG path icons for motorsport specifics (helmet, harness, hexnut, tyre, etc.) — defined in `CUSTOM_ICON_PATHS` in `data/icons.js` and rendered by `SvgIcon` component

### Theming
CSS custom properties scoped to `.pregrid-root` and `.pregrid-root[data-theme="light"]`. Persisted to IndexedDB via `settings` table. `useTheme` hook uses `useLiveQuery` so all consumers (PreGridApp root + Settings toggle) react to changes.

## Design tokens
Defined in `index.css`. Key vars:
- `--yellow: #F5C400` — brand accent, buttons, progress
- `--green: #22c55e` — completion state
- `--bg`, `--surface`, `--surface-2` — background hierarchy
- `--text`, `--text-muted`, `--text-dim` — text hierarchy
- `--done-*` — checked/completed item state

## Routes
```
/                              Events list (home) + season km stats
/events/new                    Create event
/events/:id                    Event detail (checklists, session results, notes)
/events/:id/edit               Edit event (reuses AddEvent form)
/events/:id/checklist/:type    Checklist (type = pre-event | race-day)
/events/:id/session/:sessionId/checklist  Session checklist
/vehicles                      Garage
/vehicles/new                  Add vehicle
/vehicles/:id/edit             Edit vehicle
/venues                        Saved venues
/venues/new                    Add venue
/venues/:id/edit               Edit venue
/settings                      Settings (theme, templates link)
/templates                     Template editor (per discipline, per type)
```

## Dev
```bash
npm install
npm run dev
```
Navigate to `/pregrid` in browser.

## TODO (v1 remaining)
- [x] Add ability to add/remove/reorder individual checklist items within a checklist
- [x] Post-session notes per session
- [x] Event edit screen (reuse AddEvent with populated form)
- [x] Season km stats summary on events screen
- [x] Custom templates editable from settings, save-as-template from checklists
- [x] Session results: start position, finish position, laps completed
- [ ] Push notifications for event reminders
- [ ] Supabase backend + auth for Team tier
- [ ] Team tier: shared events, task assignment, real-time sync
