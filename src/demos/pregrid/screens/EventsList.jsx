import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getEventKm } from '../db.js'
import ScreenHeader from '../components/ScreenHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SvgIcon from '../components/SvgIcon.jsx'
import { DiscBadge } from '../components/Badges.jsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return { day: d, month: MONTHS[m - 1], year: y }
}

function statusOrder(s) {
  return s === 'active' ? 0 : s === 'upcoming' ? 1 : 2
}

export default function EventsList() {
  const navigate = useNavigate()
  const events = useLiveQuery(() => db.events.orderBy('date').reverse().toArray(), [])
  const venues = useLiveQuery(() => db.venues.toArray(), [])

  const [seasonStats, setSeasonStats] = useState(null)

  const venueMap = Object.fromEntries((venues || []).map(v => [v.id, v]))

  // Calculate season km stats
  useEffect(() => {
    if (!events || events.length === 0) {
      setSeasonStats(null)
      return
    }

    const currentYear = new Date().getFullYear()
    const yearEvents = events.filter(e => e.date?.startsWith(String(currentYear)))

    Promise.all(yearEvents.map(e => getEventKm(e))).then(kms => {
      const validKms = kms.filter(k => k !== null)
      if (validKms.length === 0) {
        setSeasonStats(null)
        return
      }

      const totalKm = validKms.reduce((sum, k) => sum + k, 0)
      const totalSessions = yearEvents.reduce((sum, e) => sum + (e.sessions?.length || 0), 0)

      setSeasonStats({
        events: yearEvents.length,
        sessions: totalSessions,
        km: +totalKm.toFixed(1),
        year: currentYear,
      })
    })
  }, [events])

  const sorted = (events || []).slice().sort((a, b) => statusOrder(a.status) - statusOrder(b.status))

  return (
    <>
      <ScreenHeader title="Events" />

      <div style={{ padding: '0 20px' }}>

        {/* Season stats */}
        {seasonStats && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '14px 0',
              marginBottom: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--yellow)' }}>{seasonStats.events}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Events</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--yellow)' }}>{seasonStats.sessions}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--yellow)' }}>{seasonStats.km}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>km {seasonStats.year}</div>
            </div>
          </div>
        )}

        {sorted.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <SvgIcon name="calendar" size={40} color="var(--text-muted)" />
            </div>
            <p>No events yet</p>
            <small>Tap + to create your first race event</small>
          </div>
        )}

        {sorted.map(event => {
          const { day, month } = parseDate(event.date)
          const venue = event.venueId ? venueMap[event.venueId] : null
          const venueName = venue?.name || event.customVenue || ''

          return (
            <div
              key={event.id}
              className="card"
              onClick={() => navigate(`/pregrid/events/${event.id}`)}
            >
              <div className="event-card">
                <div className="event-card-date">
                  <span className="day">{day}</span>
                  <span className="month">{month}</span>
                </div>
                <div className="event-card-info">
                  <div className="event-card-name">{event.name}</div>
                  <div className="event-card-meta">
                    {venueName && <>{venueName} &middot; </>}
                    <DiscBadge discipline={event.discipline} />
                    {event.sessions?.length > 0 && (
                      <> &middot; {event.sessions.length} session{event.sessions.length > 1 ? 's' : ''}</>
                    )}
                  </div>
                </div>
                <SvgIcon name="chev-right" size={18} color="var(--text-dim)" />
              </div>
            </div>
          )
        })}
      </div>

      <button className="fab" onClick={() => navigate('/pregrid/events/new')}>
        <SvgIcon name="plus" size={24} color="#000" strokeWidth={2.5} />
      </button>

      <BottomNav />
    </>
  )
}
