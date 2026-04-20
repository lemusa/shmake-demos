// ─── Session type reference data ─────────────────────────────────────────────
//
// Static definitions describing every session type the app knows about,
// grouped by discipline. This is the source of truth for:
//   - what sessions a user can add to an event
//   - discipline-aware validation
//   - default behaviour (elimination, competitive, duration type)
//
// Session type IDs follow `${disciplineSlug}.${slug}` convention but the
// `disciplines` array is what actually controls which disciplines can use
// the type — the slug is just a stable identifier.
//
// Fields:
//   id                       string  unique stable identifier
//   name                     string  display name shown to users
//   disciplines              string[] which disciplines can use this type
//   category                 string  'setup' | 'timed' | 'race' | 'progression'
//   isCompetitive            bool    counts towards standings
//   affectsProgression       bool    results determine who advances
//   isElimination            bool    losers are removed from further sessions
//   typicalDurationType      string  'laps' | 'time' | 'stage'
//   allowsMultiplePerEvent   bool    can there be >1 in the same event

export const SESSION_TYPES = [
  // ─── Circuit ──────────────────────────────────────────────
  {
    id: 'circuit.practice', name: 'Practice',
    disciplines: ['Circuit'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },
  {
    id: 'circuit.qualifying', name: 'Qualifying',
    disciplines: ['Circuit'], category: 'timed',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },
  {
    id: 'circuit.race', name: 'Race',
    disciplines: ['Circuit'], category: 'race',
    isCompetitive: true, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'circuit.sprint', name: 'Sprint Race',
    disciplines: ['Circuit'], category: 'race',
    isCompetitive: true, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },

  // ─── Speedway ─────────────────────────────────────────────
  {
    id: 'speedway.practice', name: 'Practice',
    disciplines: ['Speedway'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'speedway.heat', name: 'Heat',
    disciplines: ['Speedway'], category: 'race',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'speedway.semi', name: 'Semi-final',
    disciplines: ['Speedway'], category: 'progression',
    isCompetitive: true, affectsProgression: true, isElimination: true,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'speedway.bmain', name: 'B-Main',
    disciplines: ['Speedway'], category: 'progression',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'speedway.cmain', name: 'C-Main',
    disciplines: ['Speedway'], category: 'progression',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'speedway.feature', name: 'Feature (A-Main)',
    disciplines: ['Speedway'], category: 'race',
    isCompetitive: true, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: false,
  },
  {
    id: 'speedway.runoff', name: 'Run-off',
    disciplines: ['Speedway'], category: 'progression',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },

  // ─── Rally ────────────────────────────────────────────────
  {
    id: 'rally.recce', name: 'Recce',
    disciplines: ['Rally'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'stage', allowsMultiplePerEvent: true,
  },
  {
    id: 'rally.shakedown', name: 'Shakedown',
    disciplines: ['Rally'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: false,
  },
  {
    id: 'rally.stage', name: 'Special Stage',
    disciplines: ['Rally'], category: 'timed',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'stage', allowsMultiplePerEvent: true,
  },
  {
    id: 'rally.service-short', name: 'Service (short)',
    disciplines: ['Rally'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },
  {
    id: 'rally.service-long', name: 'Service (long)',
    disciplines: ['Rally'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },
  {
    id: 'rally.liaison', name: 'Liaison',
    disciplines: ['Rally'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },

  // ─── Rallycross ───────────────────────────────────────────
  {
    id: 'rallycross.practice', name: 'Practice',
    disciplines: ['Rallycross'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'rallycross.heat', name: 'Heat',
    disciplines: ['Rallycross'], category: 'race',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'rallycross.semi', name: 'Semi-final',
    disciplines: ['Rallycross'], category: 'progression',
    isCompetitive: true, affectsProgression: true, isElimination: true,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'rallycross.final', name: 'Final',
    disciplines: ['Rallycross'], category: 'race',
    isCompetitive: true, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: false,
  },

  // ─── Hillclimb / Time Attack ──────────────────────────────
  {
    id: 'hillclimb.practice', name: 'Practice Run',
    disciplines: ['Hillclimb'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },
  {
    id: 'hillclimb.timed', name: 'Timed Run',
    disciplines: ['Hillclimb'], category: 'timed',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'time', allowsMultiplePerEvent: true,
  },

  // ─── Offroad ──────────────────────────────────────────────
  {
    id: 'offroad.recce', name: 'Recce',
    disciplines: ['Offroad'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'stage', allowsMultiplePerEvent: true,
  },
  {
    id: 'offroad.stage', name: 'Stage',
    disciplines: ['Offroad'], category: 'timed',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'stage', allowsMultiplePerEvent: true,
  },
  {
    id: 'offroad.loop', name: 'Loop',
    disciplines: ['Offroad'], category: 'race',
    isCompetitive: true, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },

  // ─── Karting ──────────────────────────────────────────────
  {
    id: 'karting.practice', name: 'Practice',
    disciplines: ['Karting'], category: 'setup',
    isCompetitive: false, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'karting.qualifying', name: 'Qualifying',
    disciplines: ['Karting'], category: 'timed',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'karting.heat', name: 'Heat',
    disciplines: ['Karting'], category: 'race',
    isCompetitive: true, affectsProgression: true, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: true,
  },
  {
    id: 'karting.final', name: 'Final',
    disciplines: ['Karting'], category: 'race',
    isCompetitive: true, affectsProgression: false, isElimination: false,
    typicalDurationType: 'laps', allowsMultiplePerEvent: false,
  },
]

// Lookup index — built once.
const BY_ID = Object.fromEntries(SESSION_TYPES.map(t => [t.id, t]))

// ─── Public API ──────────────────────────────────────────────────────────────

export function getSessionTypeById(id) {
  return BY_ID[id] || null
}

export function getSessionTypesForDiscipline(discipline) {
  return SESSION_TYPES.filter(t => t.disciplines.includes(discipline))
}

export function isSessionTypeAllowed(sessionTypeId, discipline) {
  const type = BY_ID[sessionTypeId]
  return !!type && type.disciplines.includes(discipline)
}

// Does this discipline have any session type that allows run-offs?
export function disciplineAllowsRunoff(discipline) {
  return SESSION_TYPES.some(t =>
    t.disciplines.includes(discipline) && t.id.endsWith('.runoff')
  )
}

// Get the run-off type id for a discipline (currently only speedway has one).
export function getRunoffTypeId(discipline) {
  const t = SESSION_TYPES.find(t =>
    t.disciplines.includes(discipline) && t.id.endsWith('.runoff')
  )
  return t?.id || null
}

// ─── Legacy migration ────────────────────────────────────────────────────────
//
// Old sessions stored just a free-text `type` string. Map known old strings
// to the new sessionTypeId format. Anything unknown falls back to the first
// session type available for the event's discipline — the session still
// displays, it just may need a manual re-classification.

const LEGACY_TYPE_MAP = {
  Circuit:  {
    Practice: 'circuit.practice',
    Qualifying: 'circuit.qualifying',
    Race: 'circuit.race',
  },
  Speedway: {
    Heat: 'speedway.heat',
    Semi: 'speedway.semi',
    'Semi-final': 'speedway.semi',
    Final: 'speedway.feature',
  },
  Rally: {
    Recce: 'rally.recce',
    Stage: 'rally.stage',
    'Special Stage': 'rally.stage',
    Service: 'rally.service-short',
  },
  Offroad: {
    Recce: 'offroad.recce',
    Stage: 'offroad.stage',
    Loop: 'offroad.loop',
  },
  Karting: {
    Practice: 'karting.practice',
    Qualifying: 'karting.qualifying',
    Heat: 'karting.heat',
    Final: 'karting.final',
  },
}

function fallbackTypeId(discipline) {
  const types = getSessionTypesForDiscipline(discipline)
  return types[0]?.id || null
}

// Normalize a session to the new shape. Idempotent — if it already has a
// sessionTypeId it is returned with just any missing defaults filled in.
export function normalizeSession(session, discipline, index = 0) {
  if (!session) return null

  const already = !!session.sessionTypeId

  let sessionTypeId = session.sessionTypeId
  let name = session.name

  if (!already) {
    sessionTypeId = LEGACY_TYPE_MAP[discipline]?.[session.type]
      || fallbackTypeId(discipline)
    name = session.name || session.type || getSessionTypeById(sessionTypeId)?.name || 'Session'
  } else if (!name) {
    name = getSessionTypeById(sessionTypeId)?.name || 'Session'
  }

  return {
    id: session.id,
    sessionTypeId,
    name,
    order: session.order ?? index,
    status: session.status ?? (session.completed ? 'completed' : 'pending'),
    parentSessionId: session.parentSessionId ?? null,
    triggerType: session.triggerType ?? null,
    relatedSessionIds: session.relatedSessionIds ?? [],
    plannedLaps: session.plannedLaps ?? 0,
    actualLaps: session.actualLaps ?? null,
    startPosition: session.startPosition ?? null,
    finishPosition: session.finishPosition ?? null,
    completed: session.status === 'completed' || session.completed === true,
    notes: session.notes ?? '',
  }
}

export function normalizeSessions(sessions, discipline) {
  return (sessions || [])
    .map((s, i) => normalizeSession(s, discipline, i))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
}
