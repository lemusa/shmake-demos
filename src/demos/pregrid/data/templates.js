// Templates define the default checklist items generated when a checklist is
// first opened for an event. Items with perVehicle: true are duplicated once
// per vehicle assigned to the event, so oil/tyre checks appear separately
// for each car. Items with perVehicle: false (or omitted) are general and
// appear once regardless of how many vehicles are in the event.

const BASE_DRIVER_GEAR = [
  { icon: 'helmet',   label: 'Helmet — Snell rating current, visor clean', perVehicle: false },
  { icon: 'harness',  label: 'HANS device / head restraint',                perVehicle: false },
  { icon: 'shield',   label: 'Race suit, gloves, balaclava, boots',          perVehicle: false },
  { icon: 'badge',    label: 'Race licence & medical cert valid',             perVehicle: false },
  { icon: 'book',     label: 'Log book / vehicle passport',                  perVehicle: true  },
]

const BASE_VEHICLE_MECHANICAL = [
  { icon: 'oil',      label: 'Engine oil — level & condition',               perVehicle: true },
  { icon: 'thermo',   label: 'Coolant — level & condition',                  perVehicle: true },
  { icon: 'disc',     label: 'Brake fluid — level, bleed if >6 months',      perVehicle: true },
  { icon: 'disc',     label: 'Brake pads — thickness front & rear',          perVehicle: true },
  { icon: 'tyre',     label: 'Tyre condition, compound, tread wear',         perVehicle: true },
  { icon: 'tyre',     label: 'Tyre pressures checked cold',                  perVehicle: true },
  { icon: 'hexnut',   label: 'Wheel nuts torqued to spec',                   perVehicle: true },
  { icon: 'wrench',   label: 'Suspension — check for play & loose fasteners',perVehicle: true },
  { icon: 'wrench',   label: 'Steering — check for play',                    perVehicle: true },
  { icon: 'harness',  label: 'Harness — condition, mounts, expiry date',     perVehicle: true },
  { icon: 'flag',     label: 'Fire extinguisher — charged & mounted',        perVehicle: true },
]

const BASE_ELECTRONICS = [
  { icon: 'zap',      label: 'Transponder charged & mounted',                perVehicle: true },
  { icon: 'camera',   label: 'GoPro / dash cam — charged, memory cleared',   perVehicle: false },
  { icon: 'gauge',    label: 'Data logger / lap timer charged',               perVehicle: false },
]

const BASE_LOGISTICS = [
  { icon: 'toolbox',  label: 'Tools, jack, stands loaded',                   perVehicle: false },
  { icon: 'fuel',     label: 'Spare fluids packed (oil, coolant, brake fluid)', perVehicle: false },
  { icon: 'tyre',     label: 'Spare tyres / wheels loaded',                  perVehicle: false },
  { icon: 'clipboard',label: 'Entry confirmation / event schedule saved',    perVehicle: false },
]

// ─── Per-session items ────────────────────────────────────────────────────────

const BASE_SESSION_PRE = [
  { icon: 'tyre',     label: 'Tyre pressures (cold)',                        perVehicle: true },
  { icon: 'disc',     label: 'Brake pedal feel — firm, no sponge',           perVehicle: true },
  { icon: 'hexnut',   label: 'Wheel nuts checked',                           perVehicle: true },
  { icon: 'fuel',     label: 'Fuel sufficient for session',                  perVehicle: true },
  { icon: 'zap',      label: 'Transponder active',                           perVehicle: true },
  { icon: 'camera',   label: 'GoPro / data logger armed',                    perVehicle: false },
]

const BASE_SESSION_POST = [
  { icon: 'thermo',   label: 'Check for leaks (oil, coolant, brake fluid)',  perVehicle: true },
  { icon: 'disc',     label: 'Brake temp — check pad wear if run hot',       perVehicle: true },
  { icon: 'tyre',     label: 'Tyre temps & wear noted',                      perVehicle: true },
  { icon: 'wrench',   label: 'Walk-around — listen for unusual noises',      perVehicle: true },
]

// ─── Discipline-specific additions ───────────────────────────────────────────

const CIRCUIT_EXTRA_PRE = [
  { icon: 'flag',     label: 'Tow hooks fitted front & rear',                perVehicle: true },
  { icon: 'badge',    label: 'Tech inspection documents ready',              perVehicle: false },
]

const SPEEDWAY_EXTRA_PRE = [
  { icon: 'wrench',   label: 'Nerf bars & bumpers secure',                   perVehicle: true },
  { icon: 'shield',   label: 'Roll cage inspection — no cracks at welds',    perVehicle: true },
  { icon: 'shield',   label: 'Window net — condition & latch operation',     perVehicle: true },
  { icon: 'tyre',     label: 'Tyre stagger checked (left-side offset)',      perVehicle: true },
  { icon: 'flag',     label: 'Kill switch operational',                      perVehicle: true },
]

const RALLY_EXTRA_PRE = [
  { icon: 'tyre',     label: 'Spare tyres — quantity per regulations',       perVehicle: true },
  { icon: 'wrench',   label: 'Spare tyre carriers secure',                   perVehicle: true },
  { icon: 'clipboard',label: 'Road book, tulip notes, rally computer',       perVehicle: true },
  { icon: 'users',    label: 'Co-driver helmet, HANS, suit checked',         perVehicle: false },
  { icon: 'wrench',   label: 'Skid plate condition',                         perVehicle: true },
  { icon: 'gauge',    label: 'Rally computer calibrated to spare tyre size', perVehicle: true },
  { icon: 'zap',      label: 'Intercom comms check driver/co-driver',        perVehicle: true },
  { icon: 'clipboard',label: 'Service schedule & liaison times confirmed',   perVehicle: false },
]

const OFFROAD_EXTRA_PRE = [
  { icon: 'wrench',   label: 'Underbody protection — bash plates, diff guards', perVehicle: true },
  { icon: 'wrench',   label: 'Suspension travel & geometry check',           perVehicle: true },
  { icon: 'toolbox',  label: 'Recovery gear — snatch strap, shackles, hi-lift', perVehicle: false },
  { icon: 'clipboard',label: 'Navigation — GPS loaded, maps printed',        perVehicle: false },
  { icon: 'zap',      label: 'UHF / satellite comms charged & tested',       perVehicle: false },
  { icon: 'toolbox',  label: 'Spare CVs, belts, hoses for terrain',          perVehicle: false },
]

const KARTING_EXTRA_PRE = [
  { icon: 'wrench',   label: 'Chassis crack check — seat struts & welds',   perVehicle: true },
  { icon: 'wrench',   label: 'Axle & bearing condition',                     perVehicle: true },
  { icon: 'wrench',   label: 'Chain tension & lubrication',                  perVehicle: true },
  { icon: 'wrench',   label: 'Sprocket teeth condition',                     perVehicle: true },
  { icon: 'fuel',     label: 'Fuel mix correct (2-stroke if applicable)',    perVehicle: true },
  { icon: 'gauge',    label: 'Kart weight check — meets class minimum',      perVehicle: true },
  { icon: 'shield',   label: 'Rib protector, neck collar, gloves',           perVehicle: false },
]

const KARTING_SESSION_EXTRA = [
  { icon: 'wrench',   label: 'Chain tension recheck',                        perVehicle: true },
  { icon: 'gauge',    label: 'Carb jetting / needle for conditions',         perVehicle: true },
  { icon: 'clipboard',label: 'Setup changes noted (caster, camber, seat)',   perVehicle: true },
]

const RALLY_SESSION_EXTRA = [
  { icon: 'tyre',     label: 'Tyre compound & pressures for stage surface',  perVehicle: true },
  { icon: 'fuel',     label: 'Fuel sufficient for stage + liaison',          perVehicle: true },
  { icon: 'clipboard',label: 'Stage notes & recce reviewed',                 perVehicle: false },
]

// ─── Template map ─────────────────────────────────────────────────────────────

const TEMPLATES = {
  Circuit: {
    'pre-event': [
      ...BASE_DRIVER_GEAR,
      ...BASE_VEHICLE_MECHANICAL,
      ...CIRCUIT_EXTRA_PRE,
      ...BASE_ELECTRONICS,
      ...BASE_LOGISTICS,
    ],
    'race-day': [
      { icon: 'tyre',     label: 'Tyre pressures (cold)',                    perVehicle: true },
      { icon: 'fuel',     label: 'Fuel level for first session',             perVehicle: true },
      { icon: 'zap',      label: 'Transponder fitted & active',              perVehicle: true },
      { icon: 'badge',    label: 'Tech inspection documents ready',          perVehicle: false },
      { icon: 'helmet',   label: 'Helmet & gear in car',                     perVehicle: false },
      { icon: 'toolbox',  label: 'Paddock gear unloaded & accessible',       perVehicle: false },
    ],
    session: [...BASE_SESSION_PRE],
  },
  Speedway: {
    'pre-event': [
      ...BASE_DRIVER_GEAR,
      ...BASE_VEHICLE_MECHANICAL,
      ...SPEEDWAY_EXTRA_PRE,
      ...BASE_ELECTRONICS,
      ...BASE_LOGISTICS,
    ],
    'race-day': [
      { icon: 'tyre',     label: 'Tyre pressures & stagger',                 perVehicle: true },
      { icon: 'fuel',     label: 'Fuel level',                               perVehicle: true },
      { icon: 'badge',    label: 'Pit pass & docs ready',                    perVehicle: false },
    ],
    session: [
      ...BASE_SESSION_PRE,
      { icon: 'clipboard', label: 'Track surface conditions noted',          perVehicle: false },
      { icon: 'wrench',    label: 'Stagger adjustment if required',          perVehicle: true },
    ],
  },
  Rally: {
    'pre-event': [
      ...BASE_DRIVER_GEAR,
      ...BASE_VEHICLE_MECHANICAL,
      ...RALLY_EXTRA_PRE,
      ...BASE_ELECTRONICS,
      ...BASE_LOGISTICS,
    ],
    'race-day': [
      { icon: 'tyre',     label: 'Tyre selection & pressures for day one',   perVehicle: true },
      { icon: 'fuel',     label: 'Fuel for first stage & liaison',           perVehicle: true },
      { icon: 'clipboard',label: 'Parc fermé & start order confirmed',       perVehicle: false },
      { icon: 'users',    label: 'Co-driver briefed, notes reviewed',        perVehicle: false },
    ],
    session: [
      ...BASE_SESSION_PRE,
      ...RALLY_SESSION_EXTRA,
    ],
  },
  Offroad: {
    'pre-event': [
      ...BASE_DRIVER_GEAR,
      ...BASE_VEHICLE_MECHANICAL,
      ...OFFROAD_EXTRA_PRE,
      ...BASE_ELECTRONICS,
      ...BASE_LOGISTICS,
    ],
    'race-day': [
      { icon: 'tyre',     label: 'Tyre pressures adjusted for terrain',      perVehicle: true },
      { icon: 'fuel',     label: 'Fuel & recovery gear accessible',          perVehicle: true },
      { icon: 'zap',      label: 'Comms checked & accessible',               perVehicle: false },
    ],
    session: [...BASE_SESSION_PRE],
  },
  Karting: {
    'pre-event': [
      ...BASE_DRIVER_GEAR.filter(i => i.icon !== 'harness'), // no HANS in karting
      ...BASE_VEHICLE_MECHANICAL.filter(i => !['thermo', 'harness'].includes(i.icon)),
      ...KARTING_EXTRA_PRE,
      ...BASE_ELECTRONICS,
    ],
    'race-day': [
      { icon: 'tyre',     label: 'Tyre pressures & compound',                perVehicle: true },
      { icon: 'fuel',     label: 'Fuel mix & level',                         perVehicle: true },
      { icon: 'gauge',    label: 'Weight check before grid',                 perVehicle: true },
      { icon: 'zap',      label: 'Transponder clipped',                      perVehicle: true },
    ],
    session: [
      ...BASE_SESSION_PRE,
      ...KARTING_SESSION_EXTRA,
    ],
  },
}

// ─── Post-session items (shared, appended after session pre items) ─────────────
// These aren't generated at session open — they appear in a separate "post-session"
// tab in the session checklist screen.
export function getPostSessionItems(discipline) {
  return BASE_SESSION_POST
}

export function getTemplateItems(discipline, checklistType) {
  const disc = TEMPLATES[discipline] || TEMPLATES.Circuit
  return disc[checklistType] || disc['pre-event']
}

export { TEMPLATES }
