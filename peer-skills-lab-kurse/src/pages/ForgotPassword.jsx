import { useState } from 'react';
import { Link } from 'react-router-dom';
import { peerskillslab } from '@/api/peerskillslabClient';
import { useTheme } from '@/lib/useTheme';
import { inputStyle } from '@/lib/authFormStyles';

export default function ForgotPassword() {
  useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await peerskillslab.auth.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Anfrage fehlgeschlagen. Bitte versuche es später erneut.');
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
      fontFamily: 'var(--psl-font)',
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
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--psl-text, #1d1d1f)', margin: '0 0 6px' }}>Passwort vergessen</h1>

        {sent ? (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13.5, color: 'var(--psl-text-2, #5f5f63)', margin: 0 }}>
              Falls diese E-Mail-Adresse registriert ist, erhältst du in Kürze einen Link zum Zurücksetzen deines Passworts.
            </p>
            <p style={{ textAlign: 'center', margin: 0 }}>
              <Link to="/login" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--psl-accent, #466E0E)', textDecoration: 'none' }}>
                Zurück zur Anmeldung
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 11, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: 'var(--psl-text-2, #5f5f63)', margin: '0 0 4px' }}>
              Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--psl-text-2, #5f5f63)' }}>E-Mail</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@beispiel.ch"
                style={{...inputStyle}}
              />
            </div>
            {error && (
              <p style={{ fontSize: 12.5, color: '#d1413a', background: 'rgba(209,65,58,.08)', borderRadius: 7, padding: '8px 11px', margin: 0 }}>{error}</p>
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
              {loading ? 'Senden…' : 'Link senden'}
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

