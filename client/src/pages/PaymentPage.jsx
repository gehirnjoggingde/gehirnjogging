import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cancelled = searchParams.get('cancelled') === 'true';

  async function handleCheckout() {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/payment/create-checkout');
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout konnte nicht gestartet werden.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 h-14 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          Gehirn<span className="text-brand-600">jogging</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Fast geschafft!</h1>
            <p className="text-gray-500 text-sm">Starte jetzt mit 7 Tagen kostenlos.</p>
          </div>

          {cancelled && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 mb-4 text-sm text-center">
              Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <div className="card p-6 sm:p-8 mb-4 border-2 border-brand-100">
            <div className="flex items-center gap-4 mb-6">
              <img src="/logo.png" alt="" className="h-12 w-12 object-contain" />
              <div>
                <h2 className="font-bold text-gray-900">Gehirnjogging Premium</h2>
                <p className="text-sm text-gray-500">Tägliches WhatsApp Quiz</p>
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">7 Tage Testphase</span>
                <span className="font-bold text-brand-700">Kostenlos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ab Tag 8</span>
                <span className="font-semibold text-gray-900">2,99 € / Monat</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                'Täglich eine Quizfrage auf WhatsApp',
                'Wunschuhrzeit frei wählbar',
                'Jederzeit kündbar',
                'Erklärungen zu jeder Antwort',
              ].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {i}
                </li>
              ))}
            </ul>

            <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full py-4 text-base">
              {loading ? 'Weiterleitung zu Stripe…' : '7 Tage kostenlos starten →'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              🔒 Sichere Zahlung via Stripe · Kreditkarte, PayPal, SEPA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
