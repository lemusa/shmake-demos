import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db.js'
import ScreenHeader from '../components/ScreenHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SvgIcon from '../components/SvgIcon.jsx'

export default function Venues() {
  const navigate = useNavigate()
  const venues = useLiveQuery(() => db.venues.orderBy('name').toArray(), [])

  return (
    <>
      <ScreenHeader title="Venues" />

      <div style={{ padding: '0 20px' }}>
        {(venues || []).length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <SvgIcon name="map-pin" size={40} color="var(--text-muted)" />
            </div>
            <p>No venues saved</p>
            <small>Save your regular tracks and circuits</small>
          </div>
        )}

        {(venues || []).map(v => (
          <div
            key={v.id}
            className="card"
            onClick={() => navigate(`/pregrid/venues/${v.id}/edit`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SvgIcon name="map-pin" size={20} color="var(--yellow)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {[v.location, v.lengthKm && `${v.lengthKm} km`, v.surface].filter(Boolean).join(' · ')}
                </div>
              </div>
              <SvgIcon name="chev-right" size={16} color="var(--text-dim)" />
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/pregrid/venues/new')}>
        <SvgIcon name="plus" size={24} color="#000" strokeWidth={2.5} />
      </button>

      <BottomNav />
    </>
  )
}
