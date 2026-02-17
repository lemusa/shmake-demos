import { useState, useEffect } from 'react';
import { createAuthClient } from '../lib/supabase';
import AdminLogin from './components/AdminLogin';
import TenantsList from './components/TenantsList';
import TenantEditor from './components/TenantEditor';
import { LogOut } from 'lucide-react';
import './admin.css';

export default function AdminApp() {
  const [supabase] = useState(() => createAuthClient());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [view, setView] = useState('list'); // 'list' | 'edit' | 'new'
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('list');
  };

  const handleSelectTenant = (tenantId) => {
    setSelectedTenantId(tenantId);
    setView('edit');
  };

  const handleBack = () => {
    setView('list');
    setSelectedTenantId(null);
  };

  if (!supabase) {
    return (
      <div className="admin-app">
        <div className="admin-error-page">
          <h1>Configuration Required</h1>
          <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-app">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin supabase={supabase} onLogin={setUser} />;
  }

  return (
    <div className="admin-app">
      {/* Top bar */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="admin-topbar-brand">shmakeCut</span>
          <span className="admin-topbar-label">Admin</span>
        </div>
        <div className="admin-topbar-right">
          <span className="admin-topbar-email">{user.email}</span>
          <button onClick={handleLogout} className="admin-btn admin-btn--icon" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {view === 'list' && (
          <TenantsList
            supabase={supabase}
            onSelect={handleSelectTenant}
            onCreate={() => setView('new')}
          />
        )}
        {view === 'edit' && selectedTenantId && (
          <TenantEditor
            supabase={supabase}
            tenantId={selectedTenantId}
            onBack={handleBack}
            isNew={false}
          />
        )}
        {view === 'new' && (
          <TenantEditor
            supabase={supabase}
            tenantId={null}
            onBack={handleBack}
            isNew={true}
          />
        )}
      </div>
    </div>
  );
}
