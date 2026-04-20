import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DISCIPLINES } from '../db.js'
import ScreenHeader from '../components/ScreenHeader.jsx'

const SURFACES = ['sealed', 'gravel', 'dirt', 'mixed']

export default function AddVenue() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editId = id ? parseInt(id, 10) : null

  const existing = useLiveQuery(() => editId ? db.venues.get(editId) : null, [editId])

  const [form, setForm] = useState({
    name: '',
    location: '',
    lengthKm: '',
    surface: 'sealed',
    disciplines: [],
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        location: existing.location || '',
        lengthKm: existing.lengthKm || '',
        surface: existing.surface || 'sealed',
        disciplines: existing.disciplines || [],
        notes: existing.notes || '',
      })
    }
  }, [existing])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const toggleDisc = (d) => {
    set('disciplines', form.disciplines.includes(d)
      ? form.disciplines.filter(x => x !== d)
      : [...form.disciplines, d]
    )
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {
      ...form,
      lengthKm: form.lengthKm ? parseFloat(form.lengthKm) : null,
    }
    if (editId) {
      await db.venues.update(editId, data)
    } else {
      await db.venues.add({ ...data, createdAt: Date.now() })
    }
    navigate('/pregrid/venues')
  }

  const handleDelete = async () => {
    if (editId) {
      await db.venues.delete(editId)
      navigate('/pregrid/venues')
    }
  }

  return (
    <>
      <ScreenHeader
        title={editId ? 'Edit venue' : 'New venue'}
        backTo="/pregrid/venues"
      />

      <div style={{ padding: '0 20px 32px' }}>

        <div className="form-group">
          <label className="label">Venue name *</label>
          <input
            className="input"
            placeholder="e.g. Mike Pero Motorsport Park"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">Location</label>
          <input
            className="input"
            placeholder="e.g. Christchurch, Canterbury"
            value={form.location}
            onChange={e => set('location', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">Lap length (km)</label>
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 2.2"
            value={form.lengthKm}
            onChange={e => set('lengthKm', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">Surface</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SURFACES.map(s => {
              const active = form.surface === s
              return (
                <button
                  key={s}
                  onClick={() => set('surface', s)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
                    background: active ? 'var(--icon-sel)' : 'var(--surface)',
                    color: active ? 'var(--yellow)' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                    fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Disciplines</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DISCIPLINES.map(d => {
              const active = form.disciplines.includes(d)
              return (
                <button
                  key={d}
                  onClick={() => toggleDisc(d)}
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

        <div className="form-group">
          <label className="label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <textarea
            className="input"
            placeholder="Track notes, directions, facilities..."
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? 'Saving...' : editId ? 'Save changes' : 'Add venue'}
        </button>

        {editId && (
          <button className="btn-danger" onClick={handleDelete} style={{ marginTop: 12 }}>
            Delete venue
          </button>
        )}
      </div>
    </>
  )
}
