import { useState, useEffect, useRef } from 'react';
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
  const [shake, setShake] = useState(false);

  // Google OAuth state
  const [googleCredential, setGoogleCredential] = useState(null);
  const [googlePending, setGooglePending] = useState(null); // { email, name } for new Google users
  const [phoneForGoogle, setPhoneForGoogle] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

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

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerShake();
      return;
    }

    setLoading(true);
    setServerError('');
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
      if (!isLogin) window.gtag?.('event', 'sign_up', { method: 'email' });
      navigate(isLogin ? '/dashboard' : '/payment');
    } catch (err) {
      const msg = err.response?.data?.error || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
      setServerError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  // ── Google Sign-In ──────────────────────────────────────
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;

    function tryInit() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 360,
          text: isLogin ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        });
      }
    }

    // GSI might still be loading
    if (window.google?.accounts?.id) {
      tryInit();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          tryInit();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLogin]);

  async function handleGoogleCredential({ credential }) {
    setGoogleLoading(true);
    setServerError('');
    try {
      const data = await api.post('/auth/google', { credential });

      if (data.needsPhone) {
        // New user – collect phone number
        setGoogleCredential(credential);
        setGooglePending({ email: data.email, name: data.name });
        setGoogleLoading(false);
        return;
      }

      // Existing user – logged in
      saveAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Google-Anmeldung fehlgeschlagen';
      setServerError(msg);
      triggerShake();
      setGoogleLoading(false);
    }
  }

  async function handleGoogleComplete(e) {
    e.preventDefault();
    if (!phoneForGoogle.trim()) return;
    setGoogleLoading(true);
    setServerError('');
    try {
      const data = await api.post('/auth/google/complete', {
        credential: googleCredential,
        phone: phoneForGoogle,
      });
      saveAuth(data.token, data.user);
      window.gtag?.('event', 'sign_up', { method: 'google' });
      navigate('/payment');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registrierung fehlgeschlagen';
      setServerError(msg);
      setGoogleLoading(false);
    }
  }

  const hasGoogle = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ── Phone modal for new Google users ───────────────────
  if (googlePending) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-100 h-14 flex items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
            Gehirn<span className="text-brand-600">jogging</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 py-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Fast geschafft!</h1>
              <p className="text-gray-500 text-sm">
                Hallo <strong>{googlePending.name || googlePending.email}</strong> – noch deine WhatsApp-Nummer, dann geht's los.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sm:p-8">
              {serverError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleGoogleComplete} className="space-y-4">
                <div>
                  <label className="label">WhatsApp-Nummer</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+49 151 23456789"
                    value={phoneForGoogle}
                    onChange={e => setPhoneForGoogle(e.target.value)}
                    autoComplete="tel"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Die Nummer auf der du WhatsApp nutzt</p>
                </div>

                <button type="submit" disabled={googleLoading} className="btn-primary w-full py-3.5 text-base mt-2">
                  {googleLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Bitte warten…
                    </span>
                  ) : 'Kostenlos starten →'}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                Mit der Registrierung stimmst du unseren{' '}
                <Link to="/agb" className="underline hover:text-gray-700">AGB</Link> und{' '}
                <Link to="/datenschutz" className="underline hover:text-gray-700">Datenschutzbestimmungen</Link> zu.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main signup/login form ──────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-100 h-14 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          Gehirn<span className="text-brand-600">jogging</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {isLogin ? 'Willkommen zurück 👋' : 'Jetzt kostenlos starten'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Melde dich an um weiterzumachen.' : '7 Tage gratis testen · Danach 2,99 €/Monat'}
            </p>
          </div>

          <div
            className={`bg-white rounded-2xl border border-gray-100 shadow-card p-6 sm:p-8 transition-all ${shake ? 'animate-shake' : ''}`}
            style={shake ? { animation: 'shake 0.4s ease' } : {}}
          >
            {/* Server error banner */}
            {serverError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <p className="text-sm font-medium">{serverError}</p>
              </div>
            )}

            {/* Google Sign-In Button */}
            {hasGoogle && (
              <>
                <div className="mb-4">
                  {googleLoading ? (
                    <div className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50">
                      <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Google-Anmeldung läuft…
                    </div>
                  ) : (
                    <div ref={googleBtnRef} className="w-full [&>div]:w-full [&>div>div]:w-full" />
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">oder mit E-Mail</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!isLogin && (
                <div>
                  <label className="label">Dein Name</label>
                  <input name="name" type="text" className={`input ${errors.name ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                    placeholder="Max Mustermann" value={form.name} onChange={handleChange} autoComplete="name" />
                  {errors.name && <p className="error-text">⚠ {errors.name}</p>}
                </div>
              )}

              <div>
                <label className="label">E-Mail-Adresse</label>
                <input name="email" type="email" className={`input ${errors.email ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                  placeholder="max@beispiel.de" value={form.email} onChange={handleChange} autoComplete="email" />
                {errors.email && <p className="error-text">⚠ {errors.email}</p>}
              </div>

              {!isLogin && (
                <div>
                  <label className="label">WhatsApp-Nummer</label>
                  <input name="phone" type="tel" className={`input ${errors.phone ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                    placeholder="+49 151 23456789" value={form.phone} onChange={handleChange} autoComplete="tel" />
                  <p className="text-xs text-gray-400 mt-1.5">Die Nummer auf der du WhatsApp nutzt</p>
                  {errors.phone && <p className="error-text">⚠ {errors.phone}</p>}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Passwort</label>
                  {isLogin && (
                    <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline font-medium">
                      Passwort vergessen?
                    </Link>
                  )}
                </div>
                <input name="password" type="password" className={`input ${errors.password ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                  placeholder="Mindestens 8 Zeichen" value={form.password} onChange={handleChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'} />
                {errors.password && <p className="error-text">⚠ {errors.password}</p>}
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  Mit der Registrierung stimmst du unseren{' '}
                  <Link to="/agb" className="underline hover:text-gray-700">AGB</Link> und{' '}
                  <Link to="/datenschutz" className="underline hover:text-gray-700">Datenschutzbestimmungen</Link> zu.
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Bitte warten…
                  </span>
                ) : isLogin ? 'Anmelden' : 'Kostenlos registrieren →'}
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
