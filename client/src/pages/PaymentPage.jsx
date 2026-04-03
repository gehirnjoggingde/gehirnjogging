import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Header from '../components/Header';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cancelled = searchParams.get('cancelled') === 'true';

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/payment/create-checkout');
      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout konnte nicht gestartet werden.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900">Fast geschafft!</h1>
            <p className="text-gray-500 text-sm mt-1">
              Starte jetzt mit 7 Tagen kostenlos.
            </p>
          </div>

          {cancelled && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 mb-4 text-sm text-center">
              Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <div className="card shadow-md mb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">🧠</div>
              <div>
                <h2 className="font-bold text-gray-900">Gehirnjogging Premium</h2>
                <p className="text-sm text-gray-500">Tägliches WhatsApp Quiz</p>
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">7 Tage Testphase</span>
                <span className="font-semibold text-brand-700">Kostenlos</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Ab Tag 8</span>
                <span className="font-semibold text-gray-900">2,99€ / Monat</span>
              </div>
            </div>

            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              {[
                '✓  Täglich eine Quizfrage auf WhatsApp',
                '✓  Wunschuhrzeit wählbar (09:00 – 22:00)',
                '✓  Jederzeit kündbar – keine Mindestlaufzeit',
                '✓  Erklärungen zu jeder Antwort',
              ].map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? 'Weiterleitung zu Stripe…' : '7 Tage kostenlos starten →'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Sichere Zahlung via Stripe · Kreditkarte, PayPal oder SEPA
            </p>
          </div>

          <p className="text-center text-xs text-gray-400">
            Du wirst zu Stripe weitergeleitet – einem sicheren Zahlungsanbieter.
            Deine Zahlungsdaten werden niemals auf unseren Servern gespeichert.
          </p>
        </div>
      </div>
    </div>
  );
}
