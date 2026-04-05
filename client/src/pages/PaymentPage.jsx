import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { getUser } from '../services/auth';

const FEATURES = [
  { icon: '📲', text: 'Tägliches Gehirnjogging – bis zu 5 Fragen auf WhatsApp' },
  { icon: '🕐', text: 'Uhrzeit frei wählbar – wann es dir passt' },
  { icon: '📚', text: '8 Themenkategorien zur Auswahl' },
  { icon: '💡', text: 'Sofortige Erklärung nach jeder Antwort' },
  { icon: '📊', text: 'Wöchentlicher Fortschrittsbericht' },
  { icon: '❌', text: 'Jederzeit kündbar – ohne Wenn und Aber' },
];

const NEXT_STEPS = [
  { step: '1', title: 'Heute', desc: 'Du richtest deine Kategorien und Uhrzeit ein.' },
  { step: '2', title: 'Ab morgen', desc: 'Dein erstes Quiz kommt pünktlich auf WhatsApp.' },
  { step: '3', title: 'Nach 7 Tagen', desc: 'Erst dann wird 2,99 € abgebucht – kein Risiko.' },
];

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cancelled = searchParams.get('cancelled') === 'true';
  const user = getUser();

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      window.gtag?.('event', 'begin_checkout', { currency: 'EUR', value: 2.99 });
      const data = await api.post('/payment/create-checkout');
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
          Gehirn<span className="text-brand-600">jogging</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <span className="text-green-500">🔒</span>
          SSL-verschlüsselt
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">

          {/* Cancelled notice */}
          {cancelled && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 mb-6 text-sm text-center">
              Zahlung abgebrochen – du kannst es jederzeit erneut versuchen.
            </div>
          )}

          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
              Täglich klüger
            </h1>
            <p className="text-gray-500 text-sm">
              {user?.name ? `Hey ${user.name.split(' ')[0]}, du` : 'Du'} bist einen Schritt davon entfernt, dein
              Gehirnjogging zu starten.
            </p>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden mb-4">

            {/* Trial highlight – primary focus */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5 text-white text-center">
              <p className="text-3xl font-extrabold mb-1">7 Tage kostenlos</p>
              <p className="text-white/80 text-sm">Danach nur 2,99 € / Monat</p>
              <p className="text-white/70 text-xs mt-0.5">☕ Weniger als ein Kaffee im Monat</p>
            </div>

            {/* Features – compact */}
            <div className="px-5 py-4">
              <ul className="space-y-2">
                {FEATURES.map(f => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price breakdown – compact */}
            <div className="mx-5 mb-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500">Heute</span>
                <span className="font-bold text-green-600">Kostenlos</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ab Tag 8</span>
                <span className="font-semibold text-gray-900">2,99 € / Monat</span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 mb-3 text-sm text-center">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full py-4 text-base rounded-2xl shadow-glow animate-pulse-glow"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Weiterleitung zu Stripe…
                  </span>
                ) : '7 Tage kostenlos starten →'}
              </button>

              <div className="flex items-center justify-center gap-3 mt-2.5 flex-wrap">
                <span className="text-xs text-gray-400">🔒 Stripe</span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">Keine versteckten Kosten</span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">Jederzeit kündbar</span>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Was passiert als nächstes?</p>
            <div className="space-y-4">
              {NEXT_STEPS.map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ reassurance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Häufige Fragen</p>
            <div className="space-y-4">
              {[
                {
                  q: 'Werde ich automatisch abonniert?',
                  a: 'Ja – aber erst nach 7 Tagen. Davor kannst du jederzeit ohne Kosten kündigen.',
                },
                {
                  q: 'Wie kündige ich?',
                  a: 'Einfach im Dashboard auf "Kündigen" klicken. Kein Anruf, kein Formular, keine Wartezeit.',
                },
                {
                  q: 'Sind meine Zahlungsdaten sicher?',
                  a: 'Ja. Die Zahlung läuft über Stripe – einen der weltweit führenden Zahlungsanbieter. Wir sehen deine Kartendaten nie.',
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal */}
          <p className="text-center text-xs text-gray-400 leading-relaxed px-4">
            Mit dem Klick auf „Jetzt starten" stimmst du unseren{' '}
            <Link to="/agb" className="underline hover:text-gray-600">AGB</Link> und der{' '}
            <Link to="/datenschutz" className="underline hover:text-gray-600">Datenschutzerklärung</Link> zu.
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </p>

        </div>
      </div>
    </div>
  );
}
