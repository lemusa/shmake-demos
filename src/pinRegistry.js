// ============================================================
// PIN REGISTRY
//
// Maps client demo pins to their demo routes.
// Add new entries when you set up a demo for a client.
//
// Format:
//   'PIN': { path: '/route-path', client: 'Client Name' }
//
// Tips:
//   - Use 4-6 digit pins for easy sharing
//   - Add an 'expires' field (ISO date string) if you want
//     pins to auto-expire
//   - Client name is just for your reference, not shown to user
// ============================================================

const PIN_REGISTRY = {
  '8472': {
    path: '/ecoglo-luminance',
    client: 'Ecoglo',
  },
  '2026': {
    path: '/cut',
    client: 'shmakeCut Demo',
  },
}

export default PIN_REGISTRY
