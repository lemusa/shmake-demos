import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db.js'
import ScreenHeader from '../components/ScreenHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SvgIcon from '../components/SvgIcon.jsx'

export default function Vehicles() {
  const navigate = useNavigate()
  const vehicles = useLiveQuery(() => db.vehicles.orderBy('createdAt').toArray(), [])

  return (
    <>
      <ScreenHeader title="Garage" />

      <div style={{ padding: '0 20px' }}>
        {(vehicles || []).length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <SvgIcon name="car" size={40} color="var(--text-muted)" />
            </div>
            <p>No vehicles yet</p>
            <small>Add your first car, kart, or buggy</small>
          </div>
        )}

        {(vehicles || []).map(v => (
          <div
            key={v.id}
            className="card"
            onClick={() => navigate(`/pregrid/vehicles/${v.id}/edit`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: v.colour || '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SvgIcon name="car" size={20} color="rgba(255,255,255,0.85)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                </div>
                {v.disciplines?.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                    {v.disciplines.join(' · ')}
                  </div>
                )}
              </div>
              <SvgIcon name="chev-right" size={16} color="var(--text-dim)" />
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/pregrid/vehicles/new')}>
        <SvgIcon name="plus" size={24} color="#000" strokeWidth={2.5} />
      </button>

      <BottomNav />
    </>
  )
}
