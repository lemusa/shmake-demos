import Dexie from 'dexie'
import { v4 as uuid } from 'uuid'
import {
  getSessionTypeById,
  isSessionTypeAllowed,
  getRunoffTypeId,
  normalizeSessions,
  normalizeSession,
} from './data/sessionTypes.js'

// ─── Schema ──────────────────────────────────────────────────────────────────
//
// settings        key-value store for app preferences (theme, default discipline etc.)
//                 Also stores custom templates with key `template_${discipline}_${type}`
//
// vehicles        Driver's garage. Each vehicle belongs to the driver and can
//                 participate in one or more disciplines.
//
// venues          Saved circuits/stages. lengthKm drives the km calculation
//                 across sessions.
//
// events          A race weekend or single event day. Embeds sessions[] as JSON
//                 so no join is needed for the common read path.
//                 vehicleIds[] references which vehicles from the garage attend.
//
// checklistItems  Single table for all checklist types — pre-event, race-day,
//                 and per-session. Discriminated by `checklistType`.
//                 vehicleId: null  → item applies to all / general (licence,
//                                    helmet, tools etc.)
//                 vehicleId: <id>  → item is specific to that vehicle (oil check
//                                    on Car A vs Car B have separate done states)
//
// ─────────────────────────────────────────────────────────────────────────────

export const db = new Dexie('PreGridDB')

db.version(1).stores({
  settings:       'key',
  vehicles:       '++id, createdAt',
  venues:         '++id, name',
  events:         '++id, date, status',
  checklistItems: '++id, eventId, sessionId, vehicleId, checklistType',
})

// ─── Typed models (JSDoc only — no TypeScript required) ─────────────────────
//
// Vehicle {
//   id:          number (auto)
//   name:        string          "Red RX-7" — driver's shorthand
//   make:        string          "Mazda"
//   model:       string          "RX-7 Series 5"
//   year:        number          1992
//   disciplines: string[]        ['Circuit', 'Hillclimb']
//   colour:      string          hex — used for badge accent
//   rego:        string          optional, for trailer/transport checks
//   notes:       string
//   createdAt:   number          Date.now()
// }
//
// Venue {
//   id:          number (auto)
//   name:        string
//   location:    string          "Christchurch, Canterbury"
//   lengthKm:    number          2.2
//   surface:     'sealed'|'gravel'|'dirt'|'mixed'
//   disciplines: string[]
//   notes:       string
//   createdAt:   number
// }
//
// Event {
//   id:          number (auto)
//   name:        string
//   date:        string          ISO date "2025-04-19"
//   discipline:  string          one of DISCIPLINES
//   venueId:     number|null     references venues.id
//   customVenue: string|null     if no saved venue
//   vehicleIds:  number[]        references vehicles.id — multi-vehicle support
//   sessions:    Session[]       embedded JSON array
//   notes:       string
//   status:      'upcoming'|'active'|'completed'
//   createdAt:   number
// }
//
// Session {                        embedded in Event.sessions[]
//   id:                string        uuid
//   sessionTypeId:     string        references SESSION_TYPES[].id
//   name:              string        editable display name
//   order:             number        flat integer ordering (0..N-1)
//   status:            'pending' | 'active' | 'completed'
//   parentSessionId:   string | null explicit tree parent (rare)
//   triggerType:       null | 'tie' | 'qualification' | 'manual'
//   relatedSessionIds: string[]      e.g. which heats a run-off came from
//   plannedLaps:       number
//   actualLaps:        number | null filled post-session
//   startPosition:     number | null
//   finishPosition:    number | null
//   completed:         boolean       mirror of (status === 'completed')
//   notes:             string
// }
//
// "Prepped" is auto-derived from the session's checklist done/total — not
// stored. `completed` is a user-marked mirror of `status === 'completed'`.
//
// ChecklistItem {
//   id:            number (auto)
//   eventId:       number         parent event
//   checklistType: 'pre-event'|'race-day'|'session'
//   sessionId:     string|null    if checklistType === 'session', references Session.id
//   vehicleId:     number|null    null = general item; number = vehicle-specific
//   icon:          string         key into ICONS map
//   label:         string
//   done:          boolean
//   sortOrder:     number
// }

// ─── Settings helpers ────────────────────────────────────────────────────────

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// ─── Custom template helpers ─────────────────────────────────────────────────
// Templates are stored in the settings table with key `template_${discipline}_${type}`
// Each value is an array of { icon, label, perVehicle } objects.

function templateKey(discipline, checklistType) {
  return `template_${discipline}_${checklistType}`
}

export async function getCustomTemplate(discipline, checklistType) {
  const row = await db.settings.get(templateKey(discipline, checklistType))
  return row?.value || null
}

export async function saveCustomTemplate(discipline, checklistType, items) {
  await db.settings.put({
    key: templateKey(discipline, checklistType),
    value: items.map(({ icon, label, perVehicle }) => ({ icon, label, perVehicle: !!perVehicle })),
  })
}

export async function deleteCustomTemplate(discipline, checklistType) {
  await db.settings.delete(templateKey(discipline, checklistType))
}

// Get the effective template items — custom if saved, otherwise built-in defaults
export async function getEffectiveTemplate(discipline, checklistType) {
  const custom = await getCustomTemplate(discipline, checklistType)
  if (custom) return custom
  const { getTemplateItems } = await import('./data/templates.js')
  return getTemplateItems(discipline, checklistType)
}

// Save current event checklist items back to master template
export async function saveChecklistAsTemplate(eventId, checklistType, sessionId = null) {
  const event = await db.events.get(eventId)
  if (!event) return

  const items = await db.checklistItems
    .where({ eventId, checklistType, sessionId: sessionId ?? null })
    .sortBy('sortOrder')

  // Deduplicate: items with vehicleId are perVehicle, group by label to avoid duplicates
  const seen = new Map()
  for (const item of items) {
    if (!seen.has(item.label)) {
      seen.set(item.label, {
        icon: item.icon,
        label: item.label,
        perVehicle: item.vehicleId !== null,
      })
    }
  }

  await saveCustomTemplate(event.discipline, checklistType, [...seen.values()])
}

// ─── Checklist generation ────────────────────────────────────────────────────
// Called lazily the first time a checklist is opened.
// Uses custom template if saved, otherwise built-in defaults.

function buildChecklistRows(templateItems, eventId, checklistType, sessionId, vehicles) {
  const rows = []
  let sortOrder = 0
  for (const item of templateItems) {
    if (item.perVehicle && vehicles.length > 0) {
      for (const vehicle of vehicles) {
        rows.push({
          eventId,
          checklistType,
          sessionId: sessionId ?? null,
          vehicleId: vehicle.id,
          icon: item.icon,
          label: item.label,
          done: false,
          sortOrder: sortOrder++,
        })
      }
    } else {
      rows.push({
        eventId,
        checklistType,
        sessionId: sessionId ?? null,
        vehicleId: null,
        icon: item.icon,
        label: item.label,
        done: false,
        sortOrder: sortOrder++,
      })
    }
  }
  return rows
}

// Filter-based matcher — used everywhere for sessionId null-safety.
// Dexie's multi-field where() with null values can be unreliable, and
// matching sessionId null/undefined must be normalised.
function matchesChecklistScope(item, eventId, checklistType, sessionId) {
  return item.eventId === eventId
    && item.checklistType === checklistType
    && (item.sessionId ?? null) === (sessionId ?? null)
}

export async function generateChecklist(eventId, checklistType, sessionId = null) {
  const event = await db.events.get(eventId)
  if (!event) return

  const templateItems = await getEffectiveTemplate(event.discipline, checklistType)

  const vehicles = event.vehicleIds?.length
    ? await db.vehicles.where('id').anyOf(event.vehicleIds).toArray()
    : []

  // Transaction serialises concurrent calls — the check and add happen
  // atomically, so parallel useEffect invocations can't both pass the guard.
  await db.transaction('rw', db.checklistItems, async () => {
    const existing = await db.checklistItems
      .where('eventId').equals(eventId)
      .filter(i => i.checklistType === checklistType && (i.sessionId ?? null) === (sessionId ?? null))
      .count()

    if (existing > 0) return

    const rows = buildChecklistRows(templateItems, eventId, checklistType, sessionId, vehicles)
    await db.checklistItems.bulkAdd(rows)
  })
}

// Clear and regenerate from current template + current vehicles.
// User recovery path when items get out of sync with the event.
export async function rebuildChecklist(eventId, checklistType, sessionId = null) {
  const event = await db.events.get(eventId)
  if (!event) return

  const templateItems = await getEffectiveTemplate(event.discipline, checklistType)
  const vehicles = event.vehicleIds?.length
    ? await db.vehicles.where('id').anyOf(event.vehicleIds).toArray()
    : []

  await db.transaction('rw', db.checklistItems, async () => {
    const toDelete = await db.checklistItems
      .where('eventId').equals(eventId)
      .filter(i => i.checklistType === checklistType && (i.sessionId ?? null) === (sessionId ?? null))
      .primaryKeys()
    await db.checklistItems.bulkDelete(toDelete)

    const rows = buildChecklistRows(templateItems, eventId, checklistType, sessionId, vehicles)
    await db.checklistItems.bulkAdd(rows)
  })
}

export { matchesChecklistScope }

// ─── Checklist item helpers ──────────────────────────────────────────────────

export async function toggleChecklistItem(itemId) {
  const item = await db.checklistItems.get(itemId)
  if (item) await db.checklistItems.update(itemId, { done: !item.done })
}

export async function updateItemIcon(itemId, icon) {
  await db.checklistItems.update(itemId, { icon })
}

export async function updateItemLabel(itemId, label) {
  await db.checklistItems.update(itemId, { label })
}

export async function addChecklistItem(eventId, checklistType, sessionId, vehicleId, label, icon = 'clipboard') {
  const siblings = await db.checklistItems
    .where({ eventId, checklistType, sessionId: sessionId ?? null })
    .sortBy('sortOrder')
  const sortOrder = siblings.length > 0 ? siblings[siblings.length - 1].sortOrder + 1 : 0
  return db.checklistItems.add({
    eventId, checklistType, sessionId: sessionId ?? null,
    vehicleId: vehicleId ?? null, icon, label, done: false, sortOrder,
  })
}

export async function removeChecklistItem(itemId) {
  await db.checklistItems.delete(itemId)
}

export async function moveChecklistItem(itemId, direction) {
  const item = await db.checklistItems.get(itemId)
  if (!item) return

  const siblings = await db.checklistItems
    .where({ eventId: item.eventId, checklistType: item.checklistType, sessionId: item.sessionId ?? null })
    .sortBy('sortOrder')

  const idx = siblings.findIndex(s => s.id === itemId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return

  const other = siblings[swapIdx]
  await db.transaction('rw', db.checklistItems, async () => {
    await db.checklistItems.update(itemId, { sortOrder: other.sortOrder })
    await db.checklistItems.update(other.id, { sortOrder: item.sortOrder })
  })
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export async function updateSessionNotes(eventId, sessionId, notes) {
  const event = await db.events.get(eventId)
  if (!event) return
  const sessions = (event.sessions || []).map(s =>
    s.id === sessionId ? { ...s, notes } : s
  )
  await db.events.update(eventId, { sessions })
}

export async function updateSessionField(eventId, sessionId, field, value) {
  const event = await db.events.get(eventId)
  if (!event) return
  const normalized = normalizeSessions(event.sessions, event.discipline)
  const sessions = normalized.map(s =>
    s.id === sessionId
      ? {
          ...s,
          [field]: value,
          // Keep status / completed mirrored when caller flips 'completed'
          ...(field === 'completed' ? { status: value ? 'completed' : 'pending' } : {}),
          ...(field === 'status'    ? { completed: value === 'completed' } : {}),
        }
      : s
  )
  await db.events.update(eventId, { sessions })
}

// ─── Session lifecycle ───────────────────────────────────────────────────────
//
// Sessions live embedded in the event document. Writes go through these
// helpers so discipline validation, ordering and run-off insertion all stay
// consistent. Reads should go through `normalizeSessions()` from
// data/sessionTypes.js — that handles legacy sessions and missing defaults.

function buildSession(sessionTypeId, options = {}) {
  const type = getSessionTypeById(sessionTypeId)
  return {
    id: options.id || uuid(),
    sessionTypeId,
    name: options.name || type?.name || 'Session',
    order: options.order ?? 0,
    status: options.status || 'pending',
    parentSessionId: options.parentSessionId || null,
    triggerType: options.triggerType || null,
    relatedSessionIds: options.relatedSessionIds || [],
    plannedLaps: options.plannedLaps ?? 0,
    actualLaps: options.actualLaps ?? null,
    startPosition: options.startPosition ?? null,
    finishPosition: options.finishPosition ?? null,
    completed: options.status === 'completed',
    notes: options.notes || '',
  }
}

// Re-pack orders to integers 0..N-1, preserving current sort order.
// Run-offs are pinned after their latest related session (clamp rule from
// the planner: a run-off must never move above all of its related sessions).
function reorder(sessions) {
  const sorted = [...sessions].sort((a, b) => a.order - b.order)
  const byId = new Map(sorted.map(s => [s.id, s]))

  // Clamp run-offs: ensure each run-off's order > max(related).order
  for (const s of sorted) {
    if (s.triggerType === 'tie' && s.relatedSessionIds?.length) {
      const relatedOrders = s.relatedSessionIds
        .map(id => byId.get(id)?.order)
        .filter(o => o != null)
      if (relatedOrders.length) {
        const minAllowed = Math.max(...relatedOrders) + 0.5
        if (s.order < minAllowed) s.order = minAllowed
      }
    }
  }

  sorted.sort((a, b) => a.order - b.order)
  return sorted.map((s, i) => ({ ...s, order: i }))
}

export async function createSession(eventId, sessionTypeId, options = {}) {
  const event = await db.events.get(eventId)
  if (!event) throw new Error('Event not found')

  if (!isSessionTypeAllowed(sessionTypeId, event.discipline)) {
    throw new Error(`Session type "${sessionTypeId}" not valid for ${event.discipline}`)
  }

  const type = getSessionTypeById(sessionTypeId)
  const existing = normalizeSessions(event.sessions, event.discipline)

  // Respect allowsMultiplePerEvent
  if (!type.allowsMultiplePerEvent
      && existing.some(s => s.sessionTypeId === sessionTypeId)) {
    throw new Error(`Only one ${type.name} allowed per event`)
  }

  const nextOrder = existing.length
    ? Math.max(...existing.map(s => s.order)) + 1
    : 0

  const session = buildSession(sessionTypeId, { ...options, order: nextOrder })
  const sessions = reorder([...existing, session])

  await db.events.update(eventId, { sessions })
  return sessions.find(s => s.id === session.id)
}

export async function insertSessionAfter(eventId, anchorSessionId, draft) {
  const event = await db.events.get(eventId)
  if (!event) throw new Error('Event not found')

  const sessionTypeId = draft.sessionTypeId
  if (!isSessionTypeAllowed(sessionTypeId, event.discipline)) {
    throw new Error(`Session type "${sessionTypeId}" not valid for ${event.discipline}`)
  }

  const existing = normalizeSessions(event.sessions, event.discipline)
  const anchor = existing.find(s => s.id === anchorSessionId)
  if (!anchor) throw new Error('Anchor session not found')

  // Bump orders of everything after anchor by 1
  const bumped = existing.map(s =>
    s.order > anchor.order ? { ...s, order: s.order + 1 } : s
  )

  const session = buildSession(sessionTypeId, { ...draft, order: anchor.order + 1 })
  const sessions = reorder([...bumped, session])

  await db.events.update(eventId, { sessions })
  return sessions.find(s => s.id === session.id)
}

// Speedway (and any discipline with a `.runoff` session type) supports
// dynamic run-off creation when heats tie. The new session is inserted
// immediately after the latest of the related sessions, with triggerType
// 'tie' and relatedSessionIds pointing at the ties.
export async function createRunoffSession(eventId, relatedSessionIds, options = {}) {
  const event = await db.events.get(eventId)
  if (!event) throw new Error('Event not found')

  const runoffTypeId = getRunoffTypeId(event.discipline)
  if (!runoffTypeId) {
    throw new Error(`${event.discipline} does not support run-off sessions`)
  }

  if (!Array.isArray(relatedSessionIds) || relatedSessionIds.length === 0) {
    throw new Error('A run-off must reference at least one related session')
  }

  const existing = normalizeSessions(event.sessions, event.discipline)
  const related = existing.filter(s => relatedSessionIds.includes(s.id))
  if (related.length === 0) throw new Error('No related sessions found')

  // Insert after the latest related session — bump everything after it
  const latestOrder = Math.max(...related.map(s => s.order))
  const bumped = existing.map(s =>
    s.order > latestOrder ? { ...s, order: s.order + 1 } : s
  )

  // Default name mentions the related sessions (editable later)
  const defaultName = related.length === 1
    ? `Run-off from ${related[0].name}`
    : `Run-off (${related.map(r => r.name).join(' & ')})`

  const runoff = buildSession(runoffTypeId, {
    name: options.name || defaultName,
    order: latestOrder + 1,
    triggerType: 'tie',
    relatedSessionIds: [...relatedSessionIds],
    plannedLaps: options.plannedLaps ?? 4,
    notes: options.notes || '',
  })

  const sessions = reorder([...bumped, runoff])
  await db.events.update(eventId, { sessions })
  return sessions.find(s => s.id === runoff.id)
}

export async function removeSession(eventId, sessionId) {
  const event = await db.events.get(eventId)
  if (!event) return

  const existing = normalizeSessions(event.sessions, event.discipline)
  // Don't cascade-delete children / run-offs — just null out references
  const filtered = existing
    .filter(s => s.id !== sessionId)
    .map(s => ({
      ...s,
      parentSessionId: s.parentSessionId === sessionId ? null : s.parentSessionId,
      relatedSessionIds: (s.relatedSessionIds || []).filter(id => id !== sessionId),
    }))
  const sessions = reorder(filtered)

  await db.events.update(eventId, { sessions })

  // Also delete any session-scoped checklist items
  await db.checklistItems
    .where('eventId').equals(eventId)
    .filter(i => i.sessionId === sessionId)
    .delete()
}

// Returns { list, tree } — list is the flat ordered array, tree nests
// run-offs under their latest related session for mobile-card display.
export async function getSessionFlow(eventId) {
  const event = await db.events.get(eventId)
  if (!event) return { list: [], tree: [] }

  const list = normalizeSessions(event.sessions, event.discipline)

  // Build tree: map each session to its visual parent.
  // Priority: explicit parentSessionId > latest relatedSessionId > root
  const childrenOf = new Map()
  const roots = []

  for (const s of list) {
    let parentId = s.parentSessionId
    if (!parentId && s.relatedSessionIds?.length) {
      // Use the latest (highest order) related session as the visual parent
      const related = list.filter(r => s.relatedSessionIds.includes(r.id))
      if (related.length) {
        const latest = related.reduce((a, b) => (a.order > b.order ? a : b))
        parentId = latest.id
      }
    }
    if (parentId) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, [])
      childrenOf.get(parentId).push(s)
    } else {
      roots.push(s)
    }
  }

  const buildNode = (s) => ({
    ...s,
    children: (childrenOf.get(s.id) || [])
      .sort((a, b) => a.order - b.order)
      .map(buildNode),
  })

  const tree = roots.sort((a, b) => a.order - b.order).map(buildNode)
  return { list, tree }
}

// Export the normalizer for consumers that need it (EventDetail, Checklist)
export { normalizeSessions, normalizeSession }

export async function resetSessionChecklist(eventId, sessionId) {
  await db.checklistItems
    .where({ eventId, checklistType: 'session', sessionId })
    .modify({ done: false })
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getEventKm(event) {
  const venue = event.venueId ? await db.venues.get(event.venueId) : null
  if (!venue?.lengthKm) return null
  const totalLaps = (event.sessions || []).reduce((sum, s) => sum + (s.plannedLaps || 0), 0)
  return +(totalLaps * venue.lengthKm).toFixed(1)
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DISCIPLINES = [
  'Circuit', 'Speedway', 'Rally', 'Rallycross', 'Hillclimb', 'Offroad', 'Karting',
]

export const CHECKLIST_TYPES = ['pre-event', 'race-day', 'session']

export const VEHICLE_COLOURS = [
  '#e63946', '#f4a261', '#F5C400', '#2a9d8f',
  '#457b9d', '#9b5de5', '#f15bb5', '#adb5bd',
]
