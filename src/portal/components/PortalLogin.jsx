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
    <div className="portal-landing">
      <main className="portal-landing-main">
        <div className="portal-landing-card">
          <div className="portal-landing-eyebrow">
            <span className="portal-landing-eyebrow-line" />
            <span className="portal-landing-eyebrow-text">Welcome</span>
          </div>

          <h1 className="portal-landing-headline">Your apps, in one place.</h1>
          <p className="portal-landing-sub">
            Sign in to access the apps SHMAKE has set up for you.
          </p>

          <form onSubmit={handleLogin} className="portal-landing-form">
            <div className="portal-landing-field">
              <label className="portal-landing-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="portal-landing-input"
                placeholder="you@company.co.nz"
              />
            </div>

            <div className="portal-landing-field">
              <label className="portal-landing-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="portal-landing-input"
                placeholder="Enter your password"
              />
            </div>

            {displayError && (
              <div className="portal-landing-error">{displayError}</div>
            )}

            <button
              type="submit"
              className="portal-landing-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="portal-landing-submit-row">
                  <span className="portal-landing-spinner" />
                  Signing in…
                </span>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          <p className="portal-landing-help">
            Trouble signing in? <a href="mailto:sam@shmake.nz">sam@shmake.nz</a>
          </p>
        </div>
      </main>
    </div>
  );
}
