import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { clearAuth } from '../services/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TimePickerModal from '../components/TimePickerModal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    api.get('/users/me')
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  }

  async function handleTimeChange(time) {
    setTimeLoading(true);
    try {
      const updated = await api.put('/users/settings', { quiz_time: time });
      setUser(updated);
      setShowTimePicker(false);
      showToast(`Quiz-Zeit auf ${time} Uhr gespeichert`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler beim Speichern', 'error');
    } finally {
      setTimeLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true);
    try {
      await api.post('/payment/cancel');
      showToast('Abonnement wird zum Ende des Zeitraums gekündigt');
      setShowCancelConfirm(false);
      const updated = await api.get('/users/me');
      setUser(updated);
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler bei der Kündigung', 'error');
    } finally {
      setCancelLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-400 animate-pulse">Laden…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm shadow-lg z-50 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {showTimePicker && (
        <TimePickerModal
          currentTime={user?.quiz_time}
          onSave={handleTimeChange}
          onClose={() => setShowTimePicker(false)}
          loading={timeLoading}
        />
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Abonnement kündigen?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Dein Quiz läuft bis zum Ende des aktuellen Abrechnungszeitraums weiter.
              Danach werden keine weiteren Zahlungen eingezogen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary flex-1">
                Zurück
              </button>
              <button onClick={handleCancelSubscription} disabled={cancelLoading} className="btn-danger flex-1">
                {cancelLoading ? 'Bitte warten…' : 'Kündigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Einstellungen</h1>

        {/* Account info */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Konto</h2>
          <div className="card space-y-4">
            <div>
              <p className="label">Name</p>
              <p className="text-gray-900 font-medium">{user?.name}</p>
            </div>
            <div className="border-t border-gray-50" />
            <div>
              <p className="label">E-Mail</p>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div className="border-t border-gray-50" />
            <div>
              <p className="label">WhatsApp-Nummer</p>
              <p className="text-gray-900">{user?.phone}</p>
            </div>
          </div>
        </section>

        {/* Quiz settings */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quiz-Einstellungen</h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Quiz-Uhrzeit</p>
                <p className="text-sm text-gray-500">Täglich um <strong>{user?.quiz_time} Uhr</strong></p>
              </div>
              <button onClick={() => setShowTimePicker(true)} className="btn-secondary text-sm py-2 px-4">
                Ändern
              </button>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Abonnement</h2>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${
                    user?.subscription_status === 'active' ? 'bg-green-500' :
                    user?.subscription_status === 'paused' ? 'bg-yellow-500' : 'bg-red-400'
                  }`} />
                  <span className="text-sm text-gray-500">
                    {user?.subscription_status === 'active' ? 'Aktiv – 2,99€/Monat' :
                     user?.subscription_status === 'paused' ? 'Pausiert' :
                     user?.subscription_status === 'cancelled' ? 'Gekündigt' : user?.subscription_status}
                  </span>
                </div>
              </div>
            </div>

            {user?.subscription_status === 'active' && (
              <>
                <div className="border-t border-gray-50" />
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    Dein Abonnement verlängert sich automatisch. Du kannst jederzeit kündigen.
                  </p>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Abonnement kündigen →
                  </button>
                </div>
              </>
            )}

            {user?.subscription_status === 'cancelled' && (
              <p className="text-sm text-gray-500">
                Dein Abonnement wurde gekündigt. Du kannst dich jederzeit neu anmelden.
              </p>
            )}
          </div>
        </section>

        {/* Sign out */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Sitzung</h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Auf diesem Gerät abmelden</p>
              <button onClick={handleLogout} className="text-sm text-red-600 font-medium hover:text-red-800">
                Abmelden
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
