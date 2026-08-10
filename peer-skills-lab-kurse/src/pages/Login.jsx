// @ts-nocheck
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { peerskillslab, saveToken } from '@/api/peerskillslabClient';
import { useAuth } from '@/lib/AuthContext';
import Logo from '@/components/Logo';
import { useTheme } from '@/lib/useTheme';
import { inputStyle, linkBtnStyle, authErrorMessage } from '@/lib/authFormStyles';

export default function Login() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  // Setzt data-theme und .dark — dieselbe Quelle wie in beiden Layouts.
  useTheme();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studienjahr, setStudienjahr] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await peerskillslab.auth.login(email, password)
        : await peerskillslab.auth.register(email, password, fullName, parseInt(studienjahr));

      saveToken(data.token);
      loginSuccess(data.user);

      const returnUrl = sessionStorage.getItem('returnUrl') || '/';
      sessionStorage.removeItem('returnUrl');
      navigate(returnUrl, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--psl-wallpaper, linear-gradient(155deg,#d6d9df 0%,#c3c7d0 48%,#b6bccb 100%))',
      fontFamily: 'var(--psl-font, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--psl-content-bg, #fff)',
        borderRadius: 18,
        border: '1px solid var(--psl-hairline, rgba(0,0,0,.09))',
        padding: 36,
        textAlign: 'center',
      }}>

        {/* Brand mark */}
        <div style={{ margin: '0 auto 18px' }}>
          <Logo size={48} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-.4px', color: 'var(--psl-text, #1d1d1f)', margin: 0 }}>
          Peer Skills Lab
        </h1>
        <p style={{ fontSize: 13, color: 'var(--psl-text-2, #5f5f63)', margin: '5px 0 24px' }}>
          {mode === 'login' ? 'Peer-to-Peer Clinical Skills Training' : 'Konto erstellen'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11, textAlign: 'left' }}>
          {mode === 'register' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Vor- und Nachname"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>Studienjahr</label>
                <select
                  value={studienjahr}
                  onChange={e => setStudienjahr(e.target.value)}
                  style={inputStyle}
                >
                  {[1, 2, 3, 4, 5, 6].map(y => (
                    <option key={y} value={y}>{y}. Jahr</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>E-Mail</label>
            <input
              type="email"
              required
              autoFocus={mode === 'login'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.ch"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>Passwort</label>
              {mode === 'login' && (
                <Link to="/forgot-password" style={{ fontSize: 11.5, color: 'var(--psl-text-3, #8a8a8e)', textDecoration: 'none' }}>
                  Passwort vergessen?
                </Link>
              )}
            </div>
            <input
              type="password"
              required
              minLength={8}
              pattern="[\s\S]{8,}"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12.5, color: '#d1413a',
              background: 'rgba(209,65,58,.08)',
              borderRadius: 7, padding: '8px 11px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 44, borderRadius: 11, border: 'none', cursor: loading ? 'default' : 'pointer',
              background: 'var(--psl-accent, #466E0E)',
              color: 'var(--psl-accent-text, #fff)',
              fontSize: 14, fontWeight: 600,
              opacity: loading ? 0.65 : 1,
              marginTop: 4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: 12.5, color: 'var(--psl-text-3, #8a8a8e)', textAlign: 'center' }}>
          {mode === 'login' ? (
            <>Noch kein Konto?{' '}
              <button onClick={() => setMode('register')} style={linkBtnStyle}>Registrieren</button>
            </>
          ) : (
            <>Bereits registriert?{' '}
              <button onClick={() => setMode('login')} style={linkBtnStyle}>Einloggen</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

