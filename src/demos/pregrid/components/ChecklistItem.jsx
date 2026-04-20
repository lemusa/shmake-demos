import { toggleChecklistItem, removeChecklistItem, moveChecklistItem } from '../db.js'
import SvgIcon from './SvgIcon.jsx'

export default function ChecklistItem({ item, vehicle, editMode }) {
  const handleClick = () => {
    if (!editMode) toggleChecklistItem(item.id)
  }

  return (
    <div
      className={`checklist-item ${item.done ? 'done' : ''}`}
      onClick={handleClick}
    >
      {editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); moveChecklistItem(item.id, 'up') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <SvgIcon name="chev-left" size={14} color="var(--text-dim)" style={{ transform: 'rotate(90deg)' }} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); moveChecklistItem(item.id, 'down') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <SvgIcon name="chev-right" size={14} color="var(--text-dim)" style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>
      ) : (
        <div className="checklist-item-check">
          {item.done && <SvgIcon name="check" size={14} color="#fff" strokeWidth={3} />}
        </div>
      )}
      <div className="checklist-item-icon">
        <SvgIcon name={item.icon} size={16} color={item.done ? 'var(--done-text)' : 'var(--text-dim)'} />
      </div>
      <span className="checklist-item-label">{item.label}</span>
      {editMode && (
        <button
          onClick={e => { e.stopPropagation(); removeChecklistItem(item.id) }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <SvgIcon name="trash" size={15} color="var(--red)" />
        </button>
      )}
    </div>
  )
}
