import { useNavigate, useLocation } from 'react-router-dom'
import SvgIcon from './SvgIcon.jsx'

const BASE = '/pregrid'

const TABS = [
  { path: '',          icon: 'home',    label: 'Events' },
  { path: '/vehicles', icon: 'car',     label: 'Garage' },
  { path: '/venues',   icon: 'map-pin', label: 'Venues' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => {
        const fullPath = `${BASE}${tab.path}`
        const active = tab.path === ''
          ? pathname === fullPath || pathname === `${fullPath}/`
          : pathname.startsWith(fullPath)

        return (
          <button
            key={tab.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(fullPath)}
          >
            <SvgIcon name={tab.icon} size={20} color={active ? 'var(--yellow)' : 'var(--text-dim)'} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
