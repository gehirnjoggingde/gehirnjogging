import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { saveAuth } from '../services/auth';

export default function SignupPage({ mode = 'signup' }) {
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  }

  function validate() {
    const e = {};
    if (!isLogin && !form.name.trim()) e.name = 'Name ist erforderlich';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Gültige E-Mail eingeben';
    if (!isLogin && !form.phone.trim()) e.phone = 'WhatsApp-Nummer erforderlich';
    if (form.password.length < 8) e.password = 'Mindestens 8 Zeichen';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await api.post('/auth/login', { email: form.email, password: form.password });
      } else {
        let phone = form.phone.trim().replace(/\s/g, '');
        if (phone.startsWith('00')) phone = '+' + phone.slice(2);
        if (phone.startsWith('0') && !phone.startsWith('+')) phone = '+49' + phone.slice(1);
        data = await api.post('/auth/register', {
          name: form.name.trim(), email: form.email.trim(), phone, password: form.password,
        });
      }
      saveAuth(data.token, data.user);
      navigate(isLogin ? '/dashboard' : '/payment');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 h-14 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          Gehirn<span className="text-brand-600">jogging</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {isLogin ? 'Willkommen zurück 👋' : 'Jetzt kostenlos starten'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Melde dich an um weiterzumachen.' : '7 Tage gratis testen · Danach 2,99 €/Monat'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sm:p-8">
            {serverError && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="label">Dein Name</label>
                  <input name="name" type="text" className="input" placeholder="Max Mustermann"
                    value={form.name} onChange={handleChange} autoComplete="name" />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
              )}
              <div>
                <label className="label">E-Mail-Adresse</label>
                <input name="email" type="email" className="input" placeholder="max@beispiel.de"
                  value={form.email} onChange={handleChange} autoComplete="email" />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
              {!isLogin && (
                <div>
                  <label className="label">WhatsApp-Nummer</label>
                  <input name="phone" type="tel" className="input" placeholder="+49 151 23456789"
                    value={form.phone} onChange={handleChange} autoComplete="tel" />
                  <p className="text-xs text-gray-400 mt-1.5">Die Nummer, auf der du WhatsApp nutzt</p>
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>
              )}
              <div>
                <label className="label">Passwort</label>
                <input name="password" type="password" className="input" placeholder="Mindestens 8 Zeichen"
                  value={form.password} onChange={handleChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'} />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  Mit der Registrierung stimmst du unseren{' '}
                  <Link to="/agb" className="underline hover:text-gray-700">AGB</Link> und{' '}
                  <Link to="/datenschutz" className="underline hover:text-gray-700">Datenschutzbestimmungen</Link> zu.
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                {loading ? 'Bitte warten…' : isLogin ? 'Anmelden' : 'Kostenlos registrieren →'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              {isLogin ? (
                <>Noch kein Account?{' '}
                  <Link to="/signup" className="text-brand-600 font-semibold hover:underline">Jetzt registrieren</Link>
                </>
              ) : (
                <>Bereits registriert?{' '}
                  <Link to="/login" className="text-brand-600 font-semibold hover:underline">Anmelden</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
