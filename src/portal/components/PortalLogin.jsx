import { useState } from 'react';

export default function PortalLogin({ supabase, onLogin, serverError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || serverError;

  return (
    <div className="portal-login">
      <div className="portal-login-card">
        <img src="https://www.shmake.nz/assets/shmake-logo-light.png" alt="SHMAKE" className="portal-login-logo" />
        <h1>Sign in to your portal</h1>
        <p>Manage your products, leads, and embed settings.</p>
        <form onSubmit={handleLogin}>
          <div className="portal-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@company.co.nz"
            />
          </div>
          <div className="portal-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          {displayError && <div className="portal-error">{displayError}</div>}
          <button type="submit" className="portal-btn portal-btn--primary portal-btn--full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
