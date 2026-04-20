import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DISCIPLINES, normalizeSessions } from '../db.js'
import { getSessionTypesForDiscipline, getSessionTypeById } from '../data/sessionTypes.js'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SvgIcon from '../components/SvgIcon.jsx'

const EMPTY_SESSION = (discipline, index) => {
  const types = getSessionTypesForDiscipline(discipline)
  // Default: cycle through types as the user adds more sessions, so the
  // 2nd session picks a different type from the 1st when possible.
  const type = types[Math.min(index, types.length - 1)] || types[0]
  return {
    id: uuid(),
    sessionTypeId: type?.id || null,
    name: type?.name || 'Session',
    order: index,
    status: 'pending',
    parentSessionId: null,
    triggerType: null,
    relatedSessionIds: [],
    plannedLaps: 0,
    actualLaps: null,
    startPosition: null,
    finishPosition: null,
    completed: false,
    notes: '',
  }
}

export default function AddEvent() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editId = id ? parseInt(id, 10) : null

  const vehicles = useLiveQuery(() => db.vehicles.orderBy('createdAt').toArray(), [])
  const venues   = useLiveQuery(() => db.venues.orderBy('name').toArray(), [])
  const existing = useLiveQuery(() => editId ? db.events.get(editId) : null, [editId])

  const [form, setForm] = useState({
    name:        '',
    date:        new Date().toISOString().split('T')[0],
    discipline:  'Circuit',
    venueId:     null,
    customVenue: '',
    vehicleIds:  [],
    sessions:    [],
    notes:       '',
  })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Populate form when editing an existing event. Normalize legacy sessions
  // on the way in so the form state is always in the new shape.
  useEffect(() => {
    if (existing && !loaded) {
      setForm({
        name:        existing.name || '',
        date:        existing.date || new Date().toISOString().split('T')[0],
        discipline:  existing.discipline || 'Circuit',
        venueId:     existing.venueId ?? null,
        customVenue: existing.customVenue || '',
        vehicleIds:  existing.vehicleIds || [],
        sessions:    normalizeSessions(existing.sessions, existing.discipline || 'Circuit'),
        notes:       existing.notes || '',
      })
      setLoaded(true)
    }
  }, [existing, loaded])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  // Changing the discipline remaps any existing sessions to the new
  // discipline's session types. We try to preserve the original category
  // (a "race" session stays a race if the new discipline has one) and
  // fall back to the first available type otherwise.
  const setDiscipline = (d) => {
    const newTypes = getSessionTypesForDiscipline(d)
    if (newTypes.length === 0) {
      setForm(f => ({ ...f, discipline: d }))
      return
    }
    setForm(f => ({
      ...f,
      discipline: d,
      sessions: f.sessions.map((s, i) => {
        const oldType = getSessionTypeById(s.sessionTypeId)
        const sameCategory = oldType
          ? newTypes.find(t => t.category === oldType.category)
          : null
        const next = sameCategory || newTypes[Math.min(i, newTypes.length - 1)] || newTypes[0]
        return { ...s, sessionTypeId: next.id, name: next.name }
      }),
    }))
  }

  const toggleVehicle = (vehicleId) => {
    set('vehicleIds', form.vehicleIds.includes(vehicleId)
      ? form.vehicleIds.filter(id => id !== vehicleId)
      : [...form.vehicleIds, vehicleId]
    )
  }

  const addSession = () => {
    set('sessions', [...form.sessions, EMPTY_SESSION(form.discipline, form.sessions.length)])
  }

  const removeSession = (sessionId) => {
    set('sessions', form.sessions.filter(s => s.id !== sessionId))
  }

  const updateSession = (sessionId, key, value) => {
    set('sessions', form.sessions.map(s =>
      s.id === sessionId ? { ...s, [key]: key === 'plannedLaps' ? parseInt(value, 10) || 0 : value } : s
    ))
  }

  // When the user picks a new session type from the dropdown, update both
  // sessionTypeId and name (default) in one go so the display name follows
  // unless the user has manually overridden it.
  const changeSessionType = (sessionId, newTypeId) => {
    const newType = getSessionTypeById(newTypeId)
    set('sessions', form.sessions.map(s => {
      if (s.id !== sessionId) return s
      const oldType = getSessionTypeById(s.sessionTypeId)
      // Only auto-rename if the current name still matches the old default
      const nameIsDefault = !oldType || s.name === oldType.name
      return {
        ...s,
        sessionTypeId: newTypeId,
        name: nameIsDefault && newType ? newType.name : s.name,
      }
    }))
  }

  const selectedVenue = venues?.find(v => v.id === form.venueId)
  const totalLaps = form.sessions.reduce((sum, s) => sum + (s.plannedLaps || 0), 0)
  const totalKm   = selectedVenue?.lengthKm
    ? +(totalLaps * selectedVenue.lengthKm).toFixed(1)
    : null

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editId) {
      await db.events.update(editId, { ...form })
      navigate(`/pregrid/events/${editId}`)
    } else {
      await db.events.add({
        ...form,
        status: 'upcoming',
        createdAt: Date.now(),
      })
      navigate('/pregrid')
    }
  }

  const backTo = editId ? `/pregrid/events/${editId}` : '/pregrid'

  return (
    <>
      <ScreenHeader title={editId ? 'Edit event' : 'New event'} backTo={backTo} />

      <div style={{ padding: '0 20px 32px' }}>

        {/* Event name */}
        <div className="form-group">
          <label className="label">Event name *</label>
          <input
            className="input"
            placeholder="e.g. Ruapuna Club Day"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </div>

        {/* Discipline */}
        <div className="form-group">
          <label className="label">Discipline</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DISCIPLINES.map(d => {
              const active = form.discipline === d
              return (
                <button
                  key={d}
                  onClick={() => setDiscipline(d)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
                    background: active ? 'var(--icon-sel)' : 'var(--surface)',
                    color: active ? 'var(--yellow)' : 'var(--text-muted)',
                    fontFamily: 'inherit',
                  }}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        {/* Venue */}
        <div className="form-group">
          <label className="label">Venue</label>
          <select
            className="input"
            value={form.venueId || ''}
            onChange={e => set('venueId', e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">-- Select saved venue or enter custom --</option>
            {venues?.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.lengthKm} km)
              </option>
            ))}
          </select>
          {!form.venueId && (
            <input
              className="input"
              placeholder="Custom venue name"
              value={form.customVenue}
              onChange={e => set('customVenue', e.target.value)}
              style={{ marginTop: 8 }}
            />
          )}
          {selectedVenue && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {selectedVenue.lengthKm} km · {selectedVenue.surface} · {selectedVenue.location}
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div className="form-group">
          <label className="label">
            Vehicles{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              -- select all attending
            </span>
          </label>

          {!vehicles?.length ? (
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--surface)',
                border: '1px dashed var(--border)',
                borderRadius: 12,
                fontSize: 13,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>No vehicles in garage yet</span>
              <button
                onClick={() => navigate('/pregrid/vehicles/new')}
                style={{ color: 'var(--yellow)', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
              >
                Add one
              </button>
            </div>
          ) : (
            <>
              {vehicles.map(v => {
                const selected = form.vehicleIds.includes(v.id)
                return (
                  <div
                    key={v.id}
                    className={`vehicle-option ${selected ? 'selected' : ''}`}
                    onClick={() => toggleVehicle(v.id)}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: v.colour || '#333',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SvgIcon name="car" size={18} color="rgba(255,255,255,0.85)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{v.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>
                        {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: selected ? 'var(--yellow)' : 'var(--surface-2)',
                        border: `1.5px solid ${selected ? 'var(--yellow)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {selected && <SvgIcon name="check" size={13} color="#000" strokeWidth={2.5} />}
                    </div>
                  </div>
                )
              })}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Vehicle-specific checklist items (oil, tyres, etc.) will be duplicated per vehicle
              </div>
            </>
          )}
        </div>

        {/* Sessions */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="label" style={{ margin: 0 }}>Sessions</label>
            {totalKm !== null && (
              <span style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>
                {totalLaps} laps · {totalKm} km total
              </span>
            )}
          </div>

          {form.sessions.map((session) => {
            const availableTypes = getSessionTypesForDiscipline(form.discipline)
            // A type is disabled in this row's dropdown if it doesn't allow
            // multiples AND another session of that same type already exists
            // (other than this row).
            const disabledIds = new Set(
              availableTypes
                .filter(t => !t.allowsMultiplePerEvent)
                .filter(t => form.sessions.some(s => s.id !== session.id && s.sessionTypeId === t.id))
                .map(t => t.id)
            )
            return (
              <div
                key={session.id}
                className="card-sm"
                style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <select
                      className="input"
                      value={session.sessionTypeId || ''}
                      onChange={e => changeSessionType(session.id, e.target.value)}
                      style={{ fontSize: 13, padding: '9px 12px' }}
                    >
                      {availableTypes.map(t => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={disabledIds.has(t.id)}
                        >
                          {t.name}{disabledIds.has(t.id) ? ' (already added)' : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      placeholder="Laps"
                      value={session.plannedLaps || ''}
                      onChange={e => updateSession(session.id, 'plannedLaps', e.target.value)}
                      style={{ width: 72, fontSize: 13, padding: '9px 12px', textAlign: 'center' }}
                    />
                  </div>
                  {selectedVenue?.lengthKm && session.plannedLaps > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 12, whiteSpace: 'nowrap' }}>
                      {(session.plannedLaps * selectedVenue.lengthKm).toFixed(1)} km
                    </div>
                  )}
                  <button
                    onClick={() => removeSession(session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px 4px' }}
                  >
                    <SvgIcon name="trash" size={15} color="var(--text-dim)" />
                  </button>
                </div>
                {/* Optional custom name override (e.g. "Heat 1 — Modified") */}
                <input
                  className="input"
                  placeholder="Custom name (optional)"
                  value={session.name || ''}
                  onChange={e => updateSession(session.id, 'name', e.target.value)}
                  style={{ fontSize: 12, padding: '7px 12px' }}
                />
              </div>
            )
          })}

          <button
            className="btn-ghost"
            onClick={addSession}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <SvgIcon name="plus" size={15} color="var(--text-muted)" />
            Add session
          </button>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            className="input"
            placeholder="Anything useful for the weekend..."
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? 'Saving...' : editId ? 'Save changes' : 'Create event'}
        </button>
      </div>
    </>
  )
}
