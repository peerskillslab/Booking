import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { peerskillslab } from '@/api/peerskillslabClient';
import { useTheme } from '@/lib/useTheme';
import { inputStyle, authErrorMessage } from '@/lib/authFormStyles';

export default function ResetPassword() {
  useTheme();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--psl-wallpaper, linear-gradient(155deg,#d6d9df 0%,#c3c7d0 48%,#b6bccb 100%))',
    fontFamily: 'var(--psl-font)',
    padding: 24,
  };
  const cardStyle = {
    width: '100%',
    maxWidth: 380,
    background: 'var(--psl-content-bg, #fff)',
    borderRadius: 18,
    border: '1px solid var(--psl-hairline, rgba(0,0,0,.09))',
    padding: 36,
    textAlign: 'center',
  };

  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: 13.5, color: '#d1413a', margin: 0 }}>Ungültiger Link. Kein Token gefunden.</p>
          <p style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
            <Link to="/forgot-password" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--psl-accent, #466E0E)', textDecoration: 'none' }}>
              Neuen Link anfordern
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Das Passwort muss mindestens 8 Zeichen lang sein.'); return; }
    if (password !== confirm) { setError('Die Passwörter stimmen nicht überein.'); return; }
    setLoading(true);
    try {
      await peerskillslab.auth.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      // Rohe Servermeldungen (z.B. Postgres-Texte) dürfen nicht angezeigt werden.
      setError(err.message?.startsWith('Ungültiger') ? err.message : authErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--psl-text, #1d1d1f)', margin: '0 0 6px' }}>Neues Passwort</h1>

        {done ? (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13.5, color: 'var(--psl-text-2, #5f5f63)', margin: 0 }}>Dein Passwort wurde erfolgreich geändert.</p>
            <p style={{ textAlign: 'center', margin: 0 }}>
              <Link to="/login" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--psl-accent, #466E0E)', textDecoration: 'none' }}>
                Jetzt anmelden
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 11, textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>Neues Passwort</label>
              <input type="password" required autoFocus minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mindestens 8 Zeichen" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>Passwort bestätigen</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Passwort wiederholen" style={inputStyle} />
            </div>
            {error && (<p style={{ fontSize: 12.5, color: '#d1413a', background: 'rgba(209,65,58,.08)', borderRadius: 7, padding: '8px 11px', margin: 0 }}>{error}</p>)}
            <button type="submit" disabled={loading} style={{ height: 44, borderRadius: 11, border: 'none', cursor: loading ? 'default' : 'pointer', background: 'var(--psl-accent, #466E0E)', color: 'var(--psl-accent-text, #fff)', fontSize: 14, fontWeight: 600, opacity: loading ? 0.65 : 1, marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {loading ? 'Speichern…' : 'Passwort ändern'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--psl-text-3, #8a8a8e)', margin: 0 }}>
              <Link to="/login" style={{ fontWeight: 600, color: 'var(--psl-accent, #466E0E)', textDecoration: 'none' }}>
                Zurück zur Anmeldung
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

