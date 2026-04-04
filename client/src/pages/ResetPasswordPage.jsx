import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError('Mindestens 8 Zeichen.'); return; }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return; }
    if (!token) { setError('Kein gültiger Reset-Link.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-2xl mb-3">⚠️</p>
        <p className="text-gray-700 font-semibold mb-4">Ungültiger Link.</p>
        <Link to="/forgot-password" className="btn-primary">Neuen Link anfordern</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-100 h-14 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          Gehirn<span className="text-brand-600">jogging</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              🔒
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Neues Passwort</h1>
            <p className="text-gray-500 text-sm">Wähle ein neues Passwort für dein Konto.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sm:p-8">
            {done ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Passwort geändert!</h2>
                <p className="text-sm text-gray-500 mb-1">Du wirst gleich weitergeleitet…</p>
                <Link to="/login" className="text-brand-600 font-semibold text-sm hover:underline">
                  Jetzt anmelden →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
                    <span className="flex-shrink-0">⚠️</span>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                <div>
                  <label className="label">Neues Passwort</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Mindestens 8 Zeichen"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Passwort wiederholen</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Nochmal eingeben"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(''); }}
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Wird gespeichert…
                    </span>
                  ) : 'Passwort speichern →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
