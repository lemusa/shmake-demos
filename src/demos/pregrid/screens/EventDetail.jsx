import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  getEventKm,
  updateSessionNotes,
  updateSessionField,
  matchesChecklistScope,
  normalizeSessions,
  createRunoffSession,
  removeSession as removeSessionDb,
} from '../db.js'
import {
  getSessionTypeById,
  disciplineAllowsRunoff,
} from '../data/sessionTypes.js'
import { useEffect, useState } from 'react'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SvgIcon from '../components/SvgIcon.jsx'
import { DiscBadge, ProgressBar } from '../components/Badges.jsx'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const eventId = parseInt(id, 10)

  const event = useLiveQuery(() => db.events.get(eventId), [eventId])

  const vehicles = useLiveQuery(async () => {
    if (!event?.vehicleIds?.length) return []
    return db.vehicles.where('id').anyOf(event.vehicleIds).toArray()
  }, [event])

  const venue = useLiveQuery(async () => {
    if (!event?.venueId) return null
    return db.venues.get(event.venueId)
  }, [event])

  // Pull all checklist items for this event once, group in memory.
  // This is cheaper than separate queries per session and uses a
  // single indexed lookup on eventId.
  const allItems = useLiveQuery(
    () => db.checklistItems.where('eventId').equals(eventId).toArray(),
    [eventId],
  )

  const preEventItems = (allItems || []).filter(i => matchesChecklistScope(i, eventId, 'pre-event', null))
  const raceDayItems  = (allItems || []).filter(i => matchesChecklistScope(i, eventId, 'race-day', null))

  const [totalKm, setTotalKm] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [showRunoffPicker, setShowRunoffPicker] = useState(false)
  const [runoffSelection, setRunoffSelection] = useState([])

  // One-time migration of legacy sessions to the new shape on first view.
  useEffect(() => {
    if (!event?.sessions?.length) return
    const hasLegacy = event.sessions.some(s => !s.sessionTypeId)
    if (hasLegacy) {
      const normalized = normalizeSessions(event.sessions, event.discipline)
      db.events.update(eventId, { sessions: normalized })
    }
  }, [event?.id, eventId])

  useEffect(() => {
    if (event) getEventKm(event).then(setTotalKm)
  }, [event])

  if (!event) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      </div>
    )
  }

  const venueName = venue?.name || event.customVenue || 'No venue set'
  const preEventDone  = preEventItems.filter(i => i.done).length
  const preEventTotal = preEventItems.length
  const raceDayDone   = raceDayItems.filter(i => i.done).length
  const raceDayTotal  = raceDayItems.length

  const handleDelete = async () => {
    await db.checklistItems.where('eventId').equals(eventId).delete()
    await db.events.delete(eventId)
    navigate('/pregrid')
  }

  const startEditNotes = (session) => {
    setEditingNotes(session.id)
    setNotesDraft(session.notes || '')
  }

  const saveNotes = async (sessionId) => {
    await updateSessionNotes(eventId, sessionId, notesDraft)
    setEditingNotes(null)
    setNotesDraft('')
  }

  const handleSessionField = async (sessionId, field, raw) => {
    const value = raw === '' ? null : parseInt(raw, 10)
    const sanitized = Number.isNaN(value) ? null : value
    await updateSessionField(eventId, sessionId, field, sanitized)
  }

  // ─── Session flow derivation (inline tree build) ───────────────────
  // Normalize once, then walk to build a visual tree. Run-offs (triggerType
  // 'tie') nest under their latest related session. Explicit parentSessionId
  // is also honoured if set.
  const sessions = event ? normalizeSessions(event.sessions || [], event.discipline) : []

  // Label dedup: sessions sharing sessionTypeId get numbered (Heat 1, Heat 2)
  // unless the user set a custom name that differs from the default.
  const displayNameOf = (s) => {
    const type = getSessionTypeById(s.sessionTypeId)
    const isCustom = type && s.name && s.name !== type.name
    if (isCustom) return s.name
    const siblings = sessions.filter(x => x.sessionTypeId === s.sessionTypeId)
    if (siblings.length < 2) return s.name || type?.name || 'Session'
    const idx = siblings.indexOf(s) + 1
    return `${s.name || type?.name || 'Session'} ${idx}`
  }

  // Build parent -> children map
  const childrenOf = new Map()
  const sessionRoots = []
  for (const s of sessions) {
    let parentId = s.parentSessionId
    if (!parentId && s.relatedSessionIds?.length) {
      const related = sessions.filter(r => s.relatedSessionIds.includes(r.id))
      if (related.length) {
        parentId = related.reduce((a, b) => (a.order > b.order ? a : b)).id
      }
    }
    if (parentId) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, [])
      childrenOf.get(parentId).push(s)
    } else {
      sessionRoots.push(s)
    }
  }

  // Sessions eligible as run-off sources: competitive, affectsProgression,
  // and not themselves a run-off (can't run-off a run-off in the picker UX).
  const runoffEligible = sessions.filter(s => {
    const type = getSessionTypeById(s.sessionTypeId)
    return type?.isCompetitive && type?.affectsProgression && s.triggerType !== 'tie'
  })

  // Recursive renderer — produces a card, then inline children cards
  // (styled smaller with a yellow left border to show the relationship).
  const renderSessionNode = (session, depth) => {
    const children = (childrenOf.get(session.id) || []).sort((a, b) => a.order - b.order)
    const type = getSessionTypeById(session.sessionTypeId)
    const isEditing = editingNotes === session.id

    const sessionChecklist = (allItems || []).filter(i =>
      matchesChecklistScope(i, eventId, 'session', session.id)
    )
    const sDone  = sessionChecklist.filter(i => i.done).length
    const sTotal = sessionChecklist.length
    const prepped   = sTotal > 0 && sDone === sTotal
    const completed = session.status === 'completed' || session.completed === true

    const accentColor = completed ? 'var(--green)'
                      : prepped   ? 'var(--yellow)'
                      : 'var(--border)'
    const iconName    = completed || prepped ? 'check' : 'flag'
    const iconColor   = completed ? 'var(--green)'
                      : prepped   ? 'var(--yellow)'
                      : 'var(--text-muted)'

    // Related session name list for run-offs
    const relatedNames = session.triggerType === 'tie' && session.relatedSessionIds?.length
      ? sessions
          .filter(s => session.relatedSessionIds.includes(s.id))
          .map(s => displayNameOf(s))
          .join(' & ')
      : null

    return (
      <div key={session.id} style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        <div
          className="card"
          style={{
            cursor: 'default',
            borderColor: accentColor,
            borderLeftWidth: depth > 0 ? 3 : 1,
            borderLeftColor: depth > 0 ? 'var(--yellow)' : accentColor,
          }}
        >
          {/* Header — tap to open checklist */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => navigate(`/pregrid/events/${eventId}/session/${session.id}/checklist`)}
          >
            <SvgIcon
              name={iconName}
              size={16}
              color={iconColor}
              strokeWidth={(completed || prepped) ? 3 : 2}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {displayNameOf(session)}
                </span>
                {type && type.category === 'progression' && !session.triggerType && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                    background: 'var(--surface-2)', color: 'var(--text-muted)',
                    padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    {type.isElimination ? 'Knockout' : 'Progression'}
                  </span>
                )}
                {session.triggerType === 'tie' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                    background: 'var(--yellow-dim)', color: 'var(--yellow)',
                    padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    Tie-break
                  </span>
                )}
                {completed ? (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                    background: 'var(--green-dim)', color: 'var(--green)',
                    padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    Complete
                  </span>
                ) : prepped && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                    background: 'var(--yellow-dim)', color: 'var(--yellow)',
                    padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    Prepped
                  </span>
                )}
              </div>
              {relatedNames && (
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>
                  From {relatedNames}
                </div>
              )}
              {session.plannedLaps > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
                  {session.plannedLaps} laps planned
                  {venue?.lengthKm ? ` · ${(session.plannedLaps * venue.lengthKm).toFixed(1)} km` : ''}
                </div>
              )}
            </div>
            <SvgIcon name="chev-right" size={16} color="var(--text-dim)" />
          </div>

          {/* Per-session checklist progress */}
          {sTotal > 0 && (
            <div style={{ marginTop: 8 }}>
              <ProgressBar done={sDone} total={sTotal} />
            </div>
          )}

          {/* Results inputs */}
          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Start pos
              </div>
              <input
                className="input"
                type="number"
                min={1}
                placeholder="--"
                value={session.startPosition ?? ''}
                onChange={e => handleSessionField(session.id, 'startPosition', e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 13, padding: '6px 8px', textAlign: 'center' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Finish pos
              </div>
              <input
                className="input"
                type="number"
                min={1}
                placeholder="--"
                value={session.finishPosition ?? ''}
                onChange={e => handleSessionField(session.id, 'finishPosition', e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 13, padding: '6px 8px', textAlign: 'center' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Laps done
              </div>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="--"
                value={session.actualLaps ?? ''}
                onChange={e => handleSessionField(session.id, 'actualLaps', e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 13, padding: '6px 8px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Position change indicator */}
          {session.startPosition != null && session.finishPosition != null && (
            <div style={{ marginTop: 6, fontSize: 11, textAlign: 'center' }}>
              {session.finishPosition < session.startPosition && (
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                  +{session.startPosition - session.finishPosition} positions gained
                </span>
              )}
              {session.finishPosition > session.startPosition && (
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                  -{session.finishPosition - session.startPosition} positions lost
                </span>
              )}
              {session.finishPosition === session.startPosition && (
                <span style={{ color: 'var(--text-dim)' }}>Position held</span>
              )}
            </div>
          )}

          {/* Post-session notes */}
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {isEditing ? (
              <div>
                <textarea
                  className="input"
                  placeholder="Post-session notes... (tyre wear, setup changes, issues)"
                  rows={3}
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  autoFocus
                  style={{ fontSize: 12, lineHeight: 1.5, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setEditingNotes(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveNotes(session.id)}
                    style={{
                      background: 'var(--yellow)', color: '#000', border: 'none',
                      borderRadius: 8, padding: '5px 12px', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={e => { e.stopPropagation(); startEditNotes(session) }}
                style={{ cursor: 'pointer' }}
              >
                {session.notes ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {session.notes}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    + Add post-session notes
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mark complete toggle */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={e => {
                e.stopPropagation()
                updateSessionField(eventId, session.id, 'status', completed ? 'pending' : 'completed')
              }}
              style={{
                flex: 1, padding: '8px 12px',
                borderRadius: 10, fontSize: 12, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: completed ? 'var(--green-dim)' : 'none',
                border: `1.5px solid ${completed ? 'var(--green)' : 'var(--border)'}`,
                color: completed ? 'var(--green)' : 'var(--text-muted)',
              }}
            >
              <SvgIcon
                name={completed ? 'check' : 'flag'}
                size={13}
                color={completed ? 'var(--green)' : 'var(--text-muted)'}
                strokeWidth={completed ? 3 : 2}
              />
              {completed ? 'Session complete' : 'Mark session complete'}
            </button>
            <button
              onClick={async e => {
                e.stopPropagation()
                if (confirm(`Remove ${displayNameOf(session)}?`)) {
                  await removeSessionDb(eventId, session.id)
                }
              }}
              style={{
                padding: '8px 12px', borderRadius: 10, fontSize: 12,
                fontFamily: 'inherit', cursor: 'pointer',
                background: 'none', border: '1.5px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              title="Remove session"
            >
              <SvgIcon name="trash" size={13} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {/* Recursively render children */}
        {children.map(child => renderSessionNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <>
      <ScreenHeader
        title={event.name}
        subtitle={`${event.date} · ${venueName}`}
        backTo="/pregrid"
        right={
          <button
            onClick={() => navigate(`/pregrid/events/${eventId}/edit`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <SvgIcon name="pencil" size={18} color="var(--text-muted)" />
          </button>
        }
      />

      <div style={{ padding: '0 20px 32px' }}>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <DiscBadge discipline={event.discipline} />
          {totalKm !== null && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {totalKm} km planned
            </span>
          )}
        </div>

        {/* Vehicles */}
        {(vehicles || []).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="section-label">Vehicles</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {vehicles.map(v => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontSize: 12, fontWeight: 500, color: 'var(--text)',
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: v.colour || 'var(--text-muted)',
                  }} />
                  {v.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklists */}
        <div className="section-label">Checklists</div>

        <div
          className="card"
          onClick={() => navigate(`/pregrid/events/${eventId}/checklist/pre-event`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SvgIcon name="clipboard" size={18} color="var(--yellow)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Pre-event checks</div>
              {preEventTotal > 0 ? (
                <div style={{ marginTop: 6 }}><ProgressBar done={preEventDone} total={preEventTotal} /></div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Tap to generate</div>
              )}
            </div>
            <SvgIcon name="chev-right" size={16} color="var(--text-dim)" />
          </div>
        </div>

        <div
          className="card"
          onClick={() => navigate(`/pregrid/events/${eventId}/checklist/race-day`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SvgIcon name="flag" size={18} color="var(--yellow)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Race day checks</div>
              {raceDayTotal > 0 ? (
                <div style={{ marginTop: 6 }}><ProgressBar done={raceDayDone} total={raceDayTotal} /></div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Tap to generate</div>
              )}
            </div>
            <SvgIcon name="chev-right" size={16} color="var(--text-dim)" />
          </div>
        </div>

        {/* Sessions — rendered as a flat list with run-offs nested under
            their latest related session (visual tree). Labels auto-number
            within sessionTypeId (Heat 1, Heat 2 etc.) unless the user has
            set a custom name. */}
        {sessionRoots.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: 20 }}>Sessions</div>
            {sessionRoots.map(root => renderSessionNode(root, 0))}

            {/* Run-off creator — only for disciplines that support it and
                only after at least 2 competitive sessions have been added */}
            {disciplineAllowsRunoff(event.discipline) && runoffEligible.length >= 2 && (
              <div style={{ marginTop: 10 }}>
                {showRunoffPicker ? (
                  <div className="card" style={{ cursor: 'default' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      Add run-off
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
                      Pick the tied sessions — the run-off will be inserted after the latest one.
                    </div>
                    {runoffEligible.map(s => {
                      const selected = runoffSelection.includes(s.id)
                      return (
                        <label
                          key={s.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', marginBottom: 6, borderRadius: 8,
                            border: `1.5px solid ${selected ? 'var(--yellow)' : 'var(--border)'}`,
                            background: selected ? 'var(--yellow-dim)' : 'var(--surface-2)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => setRunoffSelection(curr =>
                              curr.includes(s.id) ? curr.filter(x => x !== s.id) : [...curr, s.id]
                            )}
                            style={{ accentColor: 'var(--yellow)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                              {displayNameOf(s)}
                            </div>
                            {s.finishPosition != null && (
                              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                Finished P{s.finishPosition}
                              </div>
                            )}
                          </div>
                        </label>
                      )
                    })}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => { setShowRunoffPicker(false); setRunoffSelection([]) }}
                        style={{
                          flex: 1, background: 'none', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '9px', fontSize: 12,
                          color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (runoffSelection.length < 2) return
                          await createRunoffSession(eventId, runoffSelection)
                          setShowRunoffPicker(false)
                          setRunoffSelection([])
                        }}
                        disabled={runoffSelection.length < 2}
                        style={{
                          flex: 1, background: 'var(--yellow)', color: '#000',
                          border: 'none', borderRadius: 10, padding: '9px',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit',
                          opacity: runoffSelection.length < 2 ? 0.4 : 1,
                        }}
                      >
                        Add run-off
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-ghost"
                    onClick={() => setShowRunoffPicker(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <SvgIcon name="plus" size={14} color="var(--text-muted)" />
                    Add run-off from tied sessions
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Notes */}
        {event.notes && (
          <>
            <div className="section-label" style={{ marginTop: 20 }}>Notes</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {event.notes}
            </div>
          </>
        )}

        {/* Delete */}
        <div style={{ marginTop: 32 }}>
          <button className="btn-danger" onClick={handleDelete}>
            Delete event
          </button>
        </div>
      </div>
    </>
  )
}
