import React, { useState, useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import CuttingOptimizer from './components/CuttingOptimizer';
import { DEFAULT_CONFIG, fetchEmbedConfig } from './config/embedConfig';
import './main.css';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Check for ?embed_key= param for preview mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const embedKey = params.get('embed_key');
    if (embedKey && embedKey !== 'demo') {
      setLoading(true);
      fetchEmbedConfig(embedKey).then((cfg) => {
        setConfig(cfg);
        setLoading(false);
      });
    }
  }, []);

  // Admin panel
  if (route === '#admin' || route.startsWith('#admin/')) {
    return (
      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading admin...</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  // Calculator demo
  if (loading) {
    return (
      <div className="demo-wrapper">
        <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading calculator config...</div>
      </div>
    );
  }

  return (
    <div className="demo-wrapper">
      <CuttingOptimizer config={config} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
