import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DISCIPLINES, CHECKLIST_TYPES, getCustomTemplate, saveCustomTemplate, deleteCustomTemplate } from '../db.js'
import ScreenHeader from '../components/ScreenHeader.jsx'
import SvgIcon from '../components/SvgIcon.jsx'

const TYPE_LABELS = {
  'pre-event': 'Pre-event',
  'race-day':  'Race day',
  session:     'Session',
}

export default function TemplateEditor() {
  const [discipline, setDiscipline] = useState('Circuit')
  const [checklistType, setChecklistType] = useState('pre-event')
  const [items, setItems] = useState(null)
  const [newLabel, setNewLabel] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Watch the settings table so we react to external changes
  const templateRow = useLiveQuery(
    () => db.settings.get(`template_${discipline}_${checklistType}`),
    [discipline, checklistType],
  )

  // Load items when discipline/type changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const custom = await getCustomTemplate(discipline, checklistType)
      if (custom) {
        if (!cancelled) { setItems(custom); setDirty(false) }
      } else {
        const { getTemplateItems } = await import('../data/templates.js')
        const builtIn = getTemplateItems(discipline, checklistType)
        if (!cancelled) { setItems(builtIn); setDirty(false) }
      }
    })()
    return () => { cancelled = true }
  }, [discipline, checklistType, templateRow])

  const handleSave = async () => {
    if (!items) return
    await saveCustomTemplate(discipline, checklistType, items)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async () => {
    await deleteCustomTemplate(discipline, checklistType)
    const { getTemplateItems } = await import('../data/templates.js')
    setItems(getTemplateItems(discipline, checklistType))
    setDirty(false)
  }

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
    setDirty(true)
  }

  const moveItem = (idx, dir) => {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    const next = [...items]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    setItems(next)
    setDirty(true)
  }

  const togglePerVehicle = (idx) => {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, perVehicle: !item.perVehicle } : item
    ))
    setDirty(true)
  }

  const addItem = () => {
    if (!newLabel.trim()) return
    setItems([...items, { icon: 'clipboard', label: newLabel.trim(), perVehicle: false }])
    setNewLabel('')
    setShowAdd(false)
    setDirty(true)
  }

  return (
    <>
      <ScreenHeader title="Templates" backTo="/pregrid/settings" />

      <div style={{ padding: '0 20px 32px' }}>

        {/* Discipline selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {DISCIPLINES.map(d => {
            const active = discipline === d
            return (
              <button
                key={d}
                onClick={() => setDiscipline(d)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12,
                  fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
                  background: active ? 'var(--icon-sel)' : 'var(--surface)',
                  color: active ? 'var(--yellow)' : 'var(--text-muted)',
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
          {CHECKLIST_TYPES.map(t => {
            const active = checklistType === t
            return (
              <button
                key={t}
                onClick={() => setChecklistType(t)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 12, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', background: 'none', border: 'none',
                  color: active ? 'var(--yellow)' : 'var(--text-muted)',
                  borderBottom: active ? '2px solid var(--yellow)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Custom badge */}
        {templateRow?.value && (
          <div style={{
            fontSize: 10, color: 'var(--yellow)', fontWeight: 600, marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Customised
          </div>
        )}

        {/* Template items */}
        {items && items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Reorder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => moveItem(idx, 'up')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: idx === 0 ? 0.2 : 1 }}
                disabled={idx === 0}
              >
                <SvgIcon name="chev-left" size={12} color="var(--text-dim)" />
              </button>
              <button
                onClick={() => moveItem(idx, 'down')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: idx === items.length - 1 ? 0.2 : 1 }}
                disabled={idx === items.length - 1}
              >
                <SvgIcon name="chev-right" size={12} color="var(--text-dim)" />
              </button>
            </div>

            {/* Icon */}
            <SvgIcon name={item.icon} size={15} color="var(--text-dim)" />

            {/* Label + per-vehicle badge */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.3 }}>{item.label}</div>
            </div>

            {/* Per-vehicle toggle */}
            <button
              onClick={() => togglePerVehicle(idx)}
              title={item.perVehicle ? 'Per vehicle' : 'General'}
              style={{
                padding: '3px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
                border: '1px solid var(--border)',
                background: item.perVehicle ? 'var(--icon-sel)' : 'var(--surface)',
                color: item.perVehicle ? 'var(--yellow)' : 'var(--text-dim)',
              }}
            >
              {item.perVehicle ? 'VEH' : 'GEN'}
            </button>

            {/* Delete */}
            <button
              onClick={() => removeItem(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
            >
              <SvgIcon name="trash" size={14} color="var(--red)" />
            </button>
          </div>
        ))}

        {/* Add item */}
        <div style={{ marginTop: 12 }}>
          {showAdd ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="New template item..."
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                autoFocus
                style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}
              />
              <button
                onClick={addItem}
                disabled={!newLabel.trim()}
                style={{
                  background: 'var(--yellow)', color: '#000', border: 'none',
                  borderRadius: 10, padding: '0 12px', fontWeight: 700,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: newLabel.trim() ? 1 : 0.4,
                }}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12 }}
            >
              <SvgIcon name="plus" size={14} color="var(--text-muted)" />
              Add item
            </button>
          )}
        </div>

        {/* Save / Reset */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!dirty}
            style={{ flex: 1, opacity: dirty ? 1 : 0.4 }}
          >
            {saved ? 'Saved' : 'Save template'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer',
              background: 'none', border: '1.5px solid var(--border)', color: 'var(--text-muted)',
            }}
          >
            Reset
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, textAlign: 'center' }}>
          Reset restores the built-in default template for this discipline
        </div>

        {/* Item count */}
        {items && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, textAlign: 'center' }}>
            {items.length} items &middot; {items.filter(i => i.perVehicle).length} per-vehicle &middot; {items.filter(i => !i.perVehicle).length} general
          </div>
        )}
      </div>
    </>
  )
}
