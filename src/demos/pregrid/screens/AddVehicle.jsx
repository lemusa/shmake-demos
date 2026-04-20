import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DISCIPLINES, VEHICLE_COLOURS } from '../db.js'
import ScreenHeader from '../components/ScreenHeader.jsx'

export default function AddVehicle() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editId = id ? parseInt(id, 10) : null

  const existing = useLiveQuery(() => editId ? db.vehicles.get(editId) : null, [editId])

  const [form, setForm] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    disciplines: [],
    colour: VEHICLE_COLOURS[0],
    rego: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        make: existing.make || '',
        model: existing.model || '',
        year: existing.year || '',
        disciplines: existing.disciplines || [],
        colour: existing.colour || VEHICLE_COLOURS[0],
        rego: existing.rego || '',
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
      year: form.year ? parseInt(form.year, 10) : null,
    }
    if (editId) {
      await db.vehicles.update(editId, data)
    } else {
      await db.vehicles.add({ ...data, createdAt: Date.now() })
    }
    navigate('/pregrid/vehicles')
  }

  const handleDelete = async () => {
    if (editId) {
      await db.vehicles.delete(editId)
      navigate('/pregrid/vehicles')
    }
  }

  return (
    <>
      <ScreenHeader
        title={editId ? 'Edit vehicle' : 'New vehicle'}
        backTo="/pregrid/vehicles"
      />

      <div style={{ padding: '0 20px 32px' }}>

        <div className="form-group">
          <label className="label">Name *</label>
          <input
            className="input"
            placeholder="e.g. Red RX-7"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">Make</label>
          <input className="input" placeholder="e.g. Mazda" value={form.make} onChange={e => set('make', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label">Model</label>
          <input className="input" placeholder="e.g. RX-7 Series 5" value={form.model} onChange={e => set('model', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label">Year</label>
          <input className="input" type="number" placeholder="e.g. 1992" value={form.year} onChange={e => set('year', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label">Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {VEHICLE_COLOURS.map(c => (
              <div
                key={c}
                className={`colour-swatch ${form.colour === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => set('colour', c)}
              />
            ))}
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
          <label className="label">Rego / ID <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <input className="input" placeholder="Plate or race number" value={form.rego} onChange={e => set('rego', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <textarea
            className="input"
            placeholder="Setup notes, known issues..."
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? 'Saving...' : editId ? 'Save changes' : 'Add vehicle'}
        </button>

        {editId && (
          <button className="btn-danger" onClick={handleDelete} style={{ marginTop: 12 }}>
            Delete vehicle
          </button>
        )}
      </div>
    </>
  )
}
