import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { saveAuth } from '../services/auth';
import Header from '../components/Header';

export default function SignupPage({ mode = 'signup' }) {
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  }

  function validate() {
    const errs = {};
    if (!isLogin && !form.name.trim()) errs.name = 'Name ist erforderlich';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Gültige E-Mail eingeben';
    if (!isLogin) {
      // Normalize phone: accept +49..., 0049..., 0...
      if (!form.phone.trim()) errs.phone = 'WhatsApp-Nummer erforderlich';
    }
    if (form.password.length < 8) errs.password = 'Mindestens 8 Zeichen';
    return errs;
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
        // Normalize phone number to international format
        let phone = form.phone.trim().replace(/\s/g, '');
        if (phone.startsWith('00')) phone = '+' + phone.slice(2);
        if (phone.startsWith('0') && !phone.startsWith('+')) phone = '+49' + phone.slice(1);

        data = await api.post('/auth/register', {
          name: form.name.trim(),
          email: form.email.trim(),
          phone,
          password: form.password,
        });
      }

      saveAuth(data.token, data.user);

      if (isLogin) {
        navigate('/dashboard');
      } else {
        navigate('/payment');
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🧠</div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Willkommen zurück' : '7 Tage kostenlos starten'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isLogin
                ? 'Melde dich an, um dein Dashboard zu öffnen.'
                : 'Danach nur 2,99€/Monat · Jederzeit kündbar'}
            </p>
          </div>

          <div className="card shadow-md">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="label" htmlFor="name">Dein Name</label>
                  <input
                    id="name" name="name" type="text"
                    className="input" placeholder="Max Mustermann"
                    value={form.name} onChange={handleChange}
                    autoComplete="name"
                  />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="label" htmlFor="email">E-Mail</label>
                <input
                  id="email" name="email" type="email"
                  className="input" placeholder="max@beispiel.de"
                  value={form.email} onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              {!isLogin && (
                <div>
                  <label className="label" htmlFor="phone">WhatsApp-Nummer</label>
                  <input
                    id="phone" name="phone" type="tel"
                    className="input" placeholder="+49 151 23456789"
                    value={form.phone} onChange={handleChange}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-gray-400 mt-1">Die Nummer, auf der du WhatsApp nutzt</p>
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>
              )}

              <div>
                <label className="label" htmlFor="password">Passwort</label>
                <input
                  id="password" name="password" type="password"
                  className="input" placeholder="Mindestens 8 Zeichen"
                  value={form.password} onChange={handleChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-400">
                  Mit der Anmeldung stimmst du unseren{' '}
                  <a href="/agb" className="underline hover:text-gray-700">AGB</a> und{' '}
                  <a href="/datenschutz" className="underline hover:text-gray-700">Datenschutzbestimmungen</a> zu.
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading
                  ? 'Bitte warten…'
                  : isLogin ? 'Anmelden' : 'Kostenlos registrieren →'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-gray-500">
              {isLogin ? (
                <>Noch kein Account?{' '}<Link to="/signup" className="text-brand-700 font-semibold hover:underline">Jetzt registrieren</Link></>
              ) : (
                <>Bereits registriert?{' '}<Link to="/login" className="text-brand-700 font-semibold hover:underline">Anmelden</Link></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
