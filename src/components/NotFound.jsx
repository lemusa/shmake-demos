import React from 'react'

export default function NotFound() {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="landing-logo">SHMAKE</h1>
        <p className="landing-tagline" style={{ opacity: 0.6 }}>
          Nothing here — check the link you were given.
        </p>
        <div className="landing-links">
          <a href="https://shmake.nz" className="landing-link">
            shmake.nz
          </a>
        </div>
      </div>
    </div>
  )
}
