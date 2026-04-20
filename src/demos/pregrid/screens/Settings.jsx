import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SvgIcon from '../components/SvgIcon.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { db } from '../db.js'

export default function Settings() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const handleClearData = async () => {
    await db.delete()
    window.location.reload()
  }

  return (
    <>
      <ScreenHeader title="Settings" />

      <div style={{ padding: '0 20px' }}>

        <div className="settings-row">
          <span className="settings-row-label">Dark mode</span>
          <div className={`toggle ${theme === 'dark' ? 'on' : ''}`} onClick={toggle}>
            <div className="toggle-knob" />
          </div>
        </div>

        {/* Templates */}
        <div
          className="settings-row"
          onClick={() => navigate('/pregrid/templates')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span className="settings-row-label">Checklist templates</span>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              Customise default items per discipline
            </div>
          </div>
          <SvgIcon name="chev-right" size={16} color="var(--text-dim)" />
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div>
            <span className="settings-row-label">PreGrid</span>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              Race day prep &amp; checklist PWA
            </div>
          </div>
          <span className="settings-row-value">v1.0</span>
        </div>

        <div style={{ marginTop: 32 }}>
          <button className="btn-danger" onClick={handleClearData}>
            Clear all data
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, textAlign: 'center' }}>
            This will delete all events, vehicles, venues, templates, and checklists
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  )
}
