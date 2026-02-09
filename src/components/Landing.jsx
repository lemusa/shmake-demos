import React from 'react'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="landing-logo">SHMAKE</h1>
        <p className="landing-tagline">Custom tools for business</p>
        <div className="landing-links">
          <a href="https://shmake.nz" className="landing-link">
            shmake.nz
          </a>
          <span className="landing-dot">·</span>
          <a href="mailto:sam@shmake.nz" className="landing-link">
            sam@shmake.nz
          </a>
        </div>
      </div>
    </div>
  )
}
