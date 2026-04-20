export function DiscBadge({ discipline }) {
  return <span className="disc-badge">{discipline}</span>
}

export function ProgressBar({ done, total }) {
  const pct = total > 0 ? (done / total) * 100 : 0
  const complete = done === total && total > 0

  return (
    <div className="progress-bar">
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${complete ? 'complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="progress-bar-text">
        {done}/{total}
      </span>
    </div>
  )
}
