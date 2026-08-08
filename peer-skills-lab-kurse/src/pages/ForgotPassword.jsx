import { useState } from 'react';
import { Link } from 'react-router-dom';
import { peerskillslab } from '@/api/peerskillslabClient';

export default function ForgotPassword() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Passwort vergessen</h1>

        {sent ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Falls diese E-Mail-Adresse registriert ist, erhältst du in Kürze einen Link zum Zurücksetzen deines Passworts.
            </p>
            <p className="text-center text-sm">
              <Link to="/login" className="text-slate-800 font-medium hover:underline">
                Zurück zur Anmeldung
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-gray-500">
              Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@beispiel.ch"
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
              {loading ? 'Senden…' : 'Link senden'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-slate-800 font-medium hover:underline">
                Zurück zur Anmeldung
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
