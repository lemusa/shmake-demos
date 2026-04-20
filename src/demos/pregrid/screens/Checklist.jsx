import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  generateChecklist,
  rebuildChecklist,
  resetSessionChecklist,
  addChecklistItem,
  saveChecklistAsTemplate,
  matchesChecklistScope,
  normalizeSessions,
} from '../db.js'
import { getSessionTypeById } from '../data/sessionTypes.js'
import ScreenHeader from '../components/ScreenHeader.jsx'
import ChecklistItem from '../components/ChecklistItem.jsx'
import SvgIcon from '../components/SvgIcon.jsx'
import { ProgressBar } from '../components/Badges.jsx'

const CHECKLIST_LABELS = {
  'pre-event': { title: 'Pre-event checks',  subtitle: 'Complete before the event day' },
  'race-day':  { title: 'Race day checks',    subtitle: 'Morning of the event'         },
  session:     { title: 'Session checks',     subtitle: null                            },
}

export default function Checklist() {
  const { id, type, sessionId } = useParams()
  const eventId                 = parseInt(id, 10)
  const checklistType           = sessionId ? 'session' : type
  const scopeSessionId          = sessionId || null

  const event = useLiveQuery(() => db.events.get(eventId), [eventId])

  const vehicles = useLiveQuery(async () => {
    if (!event?.vehicleIds?.length) return []
    return db.vehicles.where('id').anyOf(event.vehicleIds).toArray()
  }, [event])

  // Generate lazily as a side-effect (never inside useLiveQuery).
  // generateChecklist is idempotent via a transaction-wrapped guard.
  const [generated, setGenerated] = useState(false)
  useEffect(() => {
    if (!event) return
    let cancelled = false
    generateChecklist(eventId, checklistType, scopeSessionId).then(() => {
      if (!cancelled) setGenerated(true)
    })
    return () => { cancelled = true }
  }, [event?.id, eventId, checklistType, scopeSessionId])

  // Query by eventId (single indexed field), filter + sort in memory.
  // This is robust against null-sessionId quirks in Dexie's multi-field where.
  const items = useLiveQuery(
    async () => {
      if (!generated) return null
      const rows = await db.checklistItems.where('eventId').equals(eventId).toArray()
      return rows
        .filter(i => matchesChecklistScope(i, eventId, checklistType, scopeSessionId))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },
    [generated, eventId, checklistType, scopeSessionId],
  )

  const [filter, setFilter] = useState('all')
  const [editMode, setEditMode] = useState(false)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [confirmRebuild, setConfirmRebuild] = useState(false)

  // Normalize sessions so we always see the new shape regardless of age
  const normalizedSessions = event
    ? normalizeSessions(event.sessions || [], event.discipline)
    : []
  const session = sessionId
    ? normalizedSessions.find(s => s.id === sessionId)
    : null

  // Label dedup by sessionTypeId (Heat 1, Heat 2 etc.), respecting custom names
  const sessionLabel = session
    ? (() => {
        const type = getSessionTypeById(session.sessionTypeId)
        const isCustom = type && session.name && session.name !== type.name
        if (isCustom) return session.name
        const siblings = normalizedSessions.filter(s => s.sessionTypeId === session.sessionTypeId)
        if (siblings.length < 2) return session.name || type?.name || 'Session'
        return `${session.name || type?.name || 'Session'} ${siblings.indexOf(session) + 1}`
      })()
    : null

  const label = checklistType === 'session' && sessionLabel
    ? { title: `${sessionLabel} checks`, subtitle: event?.name }
    : { ...CHECKLIST_LABELS[checklistType], subtitle: CHECKLIST_LABELS[checklistType]?.subtitle || event?.name }

  const done  = items?.filter(i => i.done).length || 0
  const total = items?.length || 0

  const filteredItems = editMode
    ? (items || [])
    : (items || []).filter(item => {
        if (filter === 'pending') return !item.done
        if (filter === 'done')    return item.done
        return true
      })

  // Orphan detection: items with a vehicleId not in the event's current vehicles.
  // These happen if the user changed vehicles after generating the checklist.
  // We show them in General so nothing is ever silently hidden.
  const vehicleIdSet = new Set((vehicles || []).map(v => v.id))
  const generalItems = filteredItems.filter(i => i.vehicleId === null || !vehicleIdSet.has(i.vehicleId))
  const vehicleGroups = (vehicles || []).map(v => ({
    vehicle: v,
    items:   filteredItems.filter(i => i.vehicleId === v.id),
  })).filter(g => g.items.length > 0)

  const hasOrphans = filteredItems.some(i => i.vehicleId !== null && !vehicleIdSet.has(i.vehicleId))

  const handleReset = async () => {
    if (checklistType === 'session' && sessionId) {
      await resetSessionChecklist(eventId, sessionId)
    }
  }

  const handleAddItem = async () => {
    if (!newItemLabel.trim()) return
    await addChecklistItem(eventId, checklistType, scopeSessionId, null, newItemLabel.trim())
    setNewItemLabel('')
    setShowAddForm(false)
  }

  const handleSaveAsTemplate = async () => {
    await saveChecklistAsTemplate(eventId, checklistType, scopeSessionId)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  const handleRebuild = async () => {
    await rebuildChecklist(eventId, checklistType, scopeSessionId)
    setConfirmRebuild(false)
  }

  const backPath = `/pregrid/events/${eventId}`

  if (!event || items === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      </div>
    )
  }

  return (
    <>
      <ScreenHeader
        title={label.title}
        subtitle={label.subtitle}
        backTo={backPath}
        right={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {checklistType === 'session' && !editMode && (
              <button
                onClick={handleReset}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
              >
                Reset
              </button>
            )}
            <button
              onClick={() => { setEditMode(!editMode); setShowAddForm(false); setConfirmRebuild(false) }}
              style={{
                background: 'none',
                border: 'none',
                color: editMode ? 'var(--yellow)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: editMode ? 700 : 400,
                fontFamily: 'inherit',
              }}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          </div>
        }
      />

      <div style={{ padding: '0 20px' }}>

        {/* Progress */}
        {total > 0 && !editMode && (
          <div style={{ marginBottom: 14 }}>
            <ProgressBar done={done} total={total} />
          </div>
        )}

        {/* Orphaned items warning */}
        {hasOrphans && (
          <div style={{
            padding: '10px 12px', marginBottom: 12, borderRadius: 10,
            background: 'var(--red-dim)', border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: 11, color: 'var(--red)',
          }}>
            Some items reference vehicles no longer on this event. Tap Edit &rarr; Rebuild to sync.
          </div>
        )}

        {/* Filter pills */}
        {!editMode && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['all', 'pending', 'done'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'var(--yellow)' : 'var(--surface-2)',
                  color: filter === f ? '#000' : 'var(--text-muted)',
                  border: `1px solid ${filter === f ? 'var(--yellow)' : 'var(--border)'}`,
                  borderRadius: 20,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: filter === f ? 700 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontFamily: 'inherit',
                }}
              >
                {f === 'all' ? `All (${total})` : f === 'pending' ? `Pending (${total - done})` : `Done (${done})`}
              </button>
            ))}
          </div>
        )}

        {editMode && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
            Tap arrows to reorder, trash to remove
          </div>
        )}

        {/* Empty filtered state */}
        {filteredItems.length === 0 && total > 0 && !editMode && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 13 }}>
            {filter === 'pending' ? 'All checks complete' : 'No completed checks yet'}
          </div>
        )}

        {/* General items (includes orphaned vehicle items) */}
        {generalItems.length > 0 && (
          <>
            {vehicleGroups.length > 0 && (
              <div className="section-label">General</div>
            )}
            {generalItems.map(item => (
              <ChecklistItem key={item.id} item={item} vehicle={null} editMode={editMode} />
            ))}
          </>
        )}

        {/* Vehicle-grouped items */}
        {vehicleGroups.map(({ vehicle, items: vItems }) => (
          <div key={vehicle.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: generalItems.length > 0 ? 16 : 0,
                marginBottom: 10,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: vehicle.colour || 'var(--text-muted)',
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{
                color: vehicle.colour || 'var(--text-muted)',
                fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
              }}>
                {vehicle.name}
              </span>
              {!editMode && (
                <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                  {vItems.filter(i => i.done).length}/{vItems.length}
                </span>
              )}
            </div>
            {vItems.map(item => (
              <ChecklistItem key={item.id} item={item} vehicle={vehicle} editMode={editMode} />
            ))}
          </div>
        ))}

        {/* Edit mode tools */}
        {editMode && (
          <div style={{ marginTop: 16 }}>
            {showAddForm ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="New check item..."
                  value={newItemLabel}
                  onChange={e => setNewItemLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                  autoFocus
                  style={{ flex: 1, fontSize: 13, padding: '9px 12px' }}
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newItemLabel.trim()}
                  style={{
                    background: 'var(--yellow)', color: '#000', border: 'none',
                    borderRadius: 10, padding: '0 14px', fontWeight: 700,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    opacity: newItemLabel.trim() ? 1 : 0.4,
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => setShowAddForm(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <SvgIcon name="plus" size={15} color="var(--text-muted)" />
                Add item
              </button>
            )}

            {/* Save as default template */}
            <button
              onClick={handleSaveAsTemplate}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', marginTop: 10, padding: '10px 14px',
                background: 'none', borderRadius: 12,
                color: savedMsg ? 'var(--green)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.2s, border-color 0.2s',
                border: `1.5px solid ${savedMsg ? 'var(--green)' : 'var(--border)'}`,
              }}
            >
              <SvgIcon name="clipboard" size={14} color={savedMsg ? 'var(--green)' : 'var(--text-muted)'} />
              {savedMsg ? 'Saved as default template' : 'Save as default template'}
            </button>

            {/* Rebuild from template (recovery) */}
            {confirmRebuild ? (
              <div style={{
                marginTop: 10, padding: '12px 14px',
                background: 'var(--red-dim)', border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>
                  This will delete all items and regenerate from the current template and vehicles. Progress will be lost.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfirmRebuild(false)}
                    style={{
                      flex: 1, background: 'none', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '8px', fontSize: 12,
                      color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRebuild}
                    style={{
                      flex: 1, background: 'var(--red)', border: 'none',
                      borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 700,
                      color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Rebuild
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRebuild(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', marginTop: 10, padding: '10px 14px',
                  background: 'none', border: '1.5px solid var(--border)', borderRadius: 12,
                  color: 'var(--text-muted)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <SvgIcon name="trash" size={13} color="var(--text-muted)" />
                Rebuild from template
              </button>
            )}
          </div>
        )}

        {/* No items at all */}
        {total === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <SvgIcon name="clipboard" size={40} color="var(--text-muted)" />
            </div>
            <p>No checklist items</p>
            <small>Items are generated from your template when you first open a checklist</small>
          </div>
        )}

        {/* All done celebration */}
        {total > 0 && done === total && !editMode && (
          <div
            style={{
              marginTop: 16, padding: '14px 16px',
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              borderRadius: 14, textAlign: 'center',
            }}
          >
            <div style={{ color: 'var(--green)', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              All checks complete
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              You're staged. Good luck out there.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
