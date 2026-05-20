// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '@/api/peerskillslabClient';
import { useAuth } from '@/lib/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export default function Login() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
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
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, full_name: fullName, studienjahr: parseInt(studienjahr) };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');

      saveToken(data.token);
      loginSuccess(data.user);   // setzt user/isAuthenticated synchron im Context

      const returnUrl = sessionStorage.getItem('returnUrl') || '/';
      sessionStorage.removeItem('returnUrl');
      navigate(returnUrl, { replace: true });
    } catch (err) {
      const messages = {
        invalid_credentials: 'E-Mail oder Passwort falsch.',
        email_already_registered: 'Diese E-Mail ist bereits registriert.',
      };
      setError(messages[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">PeerSkills</h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login' ? 'Einloggen' : 'Registrieren'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Vor- und Nachname"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Studienjahr</label>
                <select
                  value={studienjahr}
                  onChange={e => setStudienjahr(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(y => (
                    <option key={y} value={y}>{y}. Jahr</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.ch"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Bitte warten...' : mode === 'login' ? 'Einloggen' : 'Registrieren'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>Noch kein Konto?{' '}
              <button onClick={() => setMode('register')} className="text-slate-800 font-medium hover:underline">
                Registrieren
              </button>
            </>
          ) : (
            <>Bereits registriert?{' '}
              <button onClick={() => setMode('login')} className="text-slate-800 font-medium hover:underline">
                Einloggen
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
