import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import CuttingOptimizer from './components/CuttingOptimizer'
import { DEFAULT_CONFIG, fetchEmbedConfig, applyTheme } from './config/embedConfig'

const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function DemoWrapper() {
  const [hash, setHash] = useState(window.location.hash)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const embedKey = params.get('embed_key')
    if (embedKey && embedKey !== 'demo') {
      setLoading(true)
      fetchEmbedConfig(embedKey).then((cfg) => {
        setConfig(cfg)
        setLoading(false)
      })
    }
  }, [])

  // Apply theme CSS variables on the .shmakecut element directly
  // (must target .shmakecut, not its parent, because the CSS file
  // defines default --tc-* vars on .shmakecut which would override
  // inherited values from a parent)
  useEffect(() => {
    if (containerRef.current && config.theme) {
      const el = containerRef.current.querySelector('.shmakecut')
      if (el) applyTheme(el, config.theme)
    }
  }, [config])

  if (hash === '#admin' || hash.startsWith('#admin/')) {
    return (
      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading admin...</div>}>
        <AdminApp />
      </Suspense>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        Loading calculator config...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div ref={containerRef} style={{ maxWidth: 1100, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CuttingOptimizer config={config} />
      </div>
    </div>
  )
}
