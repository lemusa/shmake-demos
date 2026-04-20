import { useNavigate } from 'react-router-dom'
import SvgIcon from './SvgIcon.jsx'

export default function ScreenHeader({ title, subtitle, backTo, right }) {
  const navigate = useNavigate()

  return (
    <div className="screen-header">
      {backTo && (
        <button className="screen-header-back" onClick={() => navigate(backTo)}>
          <SvgIcon name="chev-left" size={22} color="var(--text-muted)" />
        </button>
      )}
      <div className="screen-header-content">
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
