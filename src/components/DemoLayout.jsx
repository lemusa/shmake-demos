import React from 'react'

export default function DemoLayout({ title, children }) {
  return (
    <div className="demo-layout">
      <header className="demo-header">
        <div className="demo-header-inner">
          <div className="demo-brand">
            <span className="demo-brand-logo">SHMAKE</span>
            {title && (
              <>
                <span className="demo-brand-sep">/</span>
                <span className="demo-brand-title">{title}</span>
              </>
            )}
          </div>
          <a
            href="https://shmake.nz"
            className="demo-header-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            shmake.nz
          </a>
        </div>
      </header>

      <main className="demo-content">
        {children}
      </main>

      <footer className="demo-footer">
        <div className="demo-footer-inner">
          <span>Built by <strong>SHMAKE</strong></span>
          <a href="mailto:sam@shmake.nz">Get in touch →</a>
        </div>
      </footer>
    </div>
  )
}
