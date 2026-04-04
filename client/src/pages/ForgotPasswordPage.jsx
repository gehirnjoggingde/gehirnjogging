import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  }

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
              🔑
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Passwort vergessen?</h1>
            <p className="text-gray-500 text-sm">
              Kein Problem. Gib deine E-Mail ein und wir schicken dir einen Reset-Link.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">📬</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">E-Mail gesendet!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Falls ein Konto mit dieser E-Mail existiert, hast du in wenigen Minuten einen Link zum Zurücksetzen.
                  Schau auch im Spam-Ordner nach.
                </p>
                <Link to="/login" className="btn-primary w-full justify-center">
                  Zurück zum Login
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
                  <label className="label">E-Mail-Adresse</label>
                  <input
                    type="email"
                    className={`input ${error ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                    placeholder="max@beispiel.de"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Wird gesendet…
                    </span>
                  ) : 'Reset-Link senden →'}
                </button>
              </form>
            )}

            {!sent && (
              <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
                Doch erinnert?{' '}
                <Link to="/login" className="text-brand-600 font-semibold hover:underline">Anmelden</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
