import { useState, useEffect } from 'react';
import { createAuthClient } from '@shmakecut/lib/supabase';
import PortalLogin from './components/PortalLogin';
import PortalLayout from './components/PortalLayout';

export default function PortalApp() {
  const [supabase] = useState(() => createAuthClient());
  const [user, setUser] = useState(null);
  const [portalUser, setPortalUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadPortalUser(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setPortalUser(null);
        setTenant(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const loadPortalUser = async (authUser) => {
    setAuthError('');
    try {
      // Look up portal user record for this auth user
      const { data: pu, error: puError } = await supabase
        .from('cut_portal_users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (puError || !pu) {
        setAuthError('No portal account found for this email. Contact your administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Load the tenant
      const { data: t, error: tError } = await supabase
        .from('cut_tenants')
        .select('*')
        .eq('id', pu.tenant_id)
        .single();

      if (tError || !t) {
        setAuthError('Tenant account not found. Contact your administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setUser(authUser);
      setPortalUser(pu);
      setTenant(t);
    } catch (err) {
      setAuthError('Something went wrong. Please try again.');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (authUser) => {
    setLoading(true);
    loadPortalUser(authUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPortalUser(null);
    setTenant(null);
  };

  if (!supabase) {
    return (
      <div className="portal-app">
        <div className="portal-error-page">
          <h1>Configuration Required</h1>
          <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="portal-app">
        <div className="portal-loading">Loading...</div>
      </div>
    );
  }

  if (!user || !portalUser || !tenant) {
    return <PortalLogin supabase={supabase} onLogin={handleLogin} serverError={authError} />;
  }

  return (
    <PortalLayout
      supabase={supabase}
      user={user}
      portalUser={portalUser}
      tenant={tenant}
      onLogout={handleLogout}
    />
  );
}
