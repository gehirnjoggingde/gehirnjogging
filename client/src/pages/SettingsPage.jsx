import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { clearAuth } from '../services/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TimePickerModal from '../components/TimePickerModal';

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'ok' });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    api.get('/users/me').then(setUser).catch(console.error).finally(() => setLoading(false));
  }, []);

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3500);
  }

  async function handleTimeChange(time) {
    setTimeLoading(true);
    try {
      const u = await api.put('/users/settings', { quiz_time: time });
      setUser(u); setShowTimePicker(false);
      showToast(`Quiz-Zeit auf ${time} Uhr gespeichert`);
    } catch (err) { showToast(err.response?.data?.error || 'Fehler', 'err'); }
    finally { setTimeLoading(false); }
  }

  async function handlePasswordChange() {
    if (pwForm.next !== pwForm.confirm)
      return showToast('Passwörter stimmen nicht überein', 'err');
    setPasswordLoading(true);
    try {
      await api.put('/users/password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      showToast('Passwort erfolgreich geändert');
      setShowPasswordModal(false);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler', 'err');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      await api.post('/payment/cancel');
      showToast('Abonnement wird zum Ende des Zeitraums gekündigt');
      setShowCancelConfirm(false);
      const u = await api.get('/users/me'); setUser(u);
    } catch (err) { showToast(err.response?.data?.error || 'Fehler', 'err'); }
    finally { setCancelLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {toast.msg && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm shadow-lg z-50 whitespace-nowrap ${
          toast.type === 'err' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>{toast.msg}</div>
      )}

      {showTimePicker && (
        <TimePickerModal currentTime={user?.quiz_time} onSave={handleTimeChange}
          onClose={() => setShowTimePicker(false)} loading={timeLoading} />
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Passwort ändern</h2>
            <div className="flex flex-col gap-3 mb-5">
              <input
                type="password"
                placeholder="Aktuelles Passwort"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="password"
                placeholder="Neues Passwort (min. 8 Zeichen)"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="password"
                placeholder="Neues Passwort bestätigen"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowPasswordModal(false); setPwForm({ current: '', next: '', confirm: '' }); }} className="btn-secondary flex-1 py-2.5 text-sm">
                Abbrechen
              </button>
              <button onClick={handlePasswordChange} disabled={passwordLoading} className="btn-primary flex-1 py-2.5 text-sm">
                {passwordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Speichern…
                  </span>
                ) : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Wirklich kündigen?</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Dein Quiz läuft bis zum Ende des aktuellen Abrechnungszeitraums weiter. Danach werden keine Zahlungen mehr eingezogen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary flex-1">Zurück</button>
              <button onClick={handleCancel} disabled={cancelLoading} className="btn-danger flex-1">
                {cancelLoading ? '…' : 'Kündigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Einstellungen</h1>

        {/* Account */}
        <section className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Konto</p>
          <div className="card">
            <Row label="Name" value={user?.name} />
            <Row label="E-Mail" value={user?.email} />
            <Row label="WhatsApp" value={user?.phone} />
            <Row
              label="Passwort"
              value="••••••••"
              action={
                <button onClick={() => setShowPasswordModal(true)} className="btn-secondary text-sm py-2 px-3 flex-shrink-0">
                  Ändern
                </button>
              }
            />
          </div>
        </section>

        {/* Quiz */}
        <section className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Quiz</p>
          <div className="card">
            <Row
              label="Quiz-Uhrzeit"
              value={`Täglich um ${user?.quiz_time} Uhr`}
              action={
                <button onClick={() => setShowTimePicker(true)} className="btn-secondary text-sm py-2 px-3 flex-shrink-0">
                  Ändern
                </button>
              }
            />
          </div>
        </section>

        {/* Subscription */}
        <section className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Abonnement</p>
          <div className="card">
            <Row
              label="Status"
              value={
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    user?.subscription_status === 'active' ? 'bg-green-500' :
                    user?.subscription_status === 'paused' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  {user?.subscription_status === 'active' ? 'Aktiv · 2,99 €/Monat' :
                   user?.subscription_status === 'paused' ? 'Pausiert' :
                   user?.subscription_status === 'cancelled' ? 'Gekündigt' : user?.subscription_status}
                </span>
              }
            />
            {user?.subscription_status === 'active' && (
              <div className="pt-3">
                <button onClick={() => setShowCancelConfirm(true)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
                  Abonnement kündigen →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Logout */}
        <section>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Sitzung</p>
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Auf diesem Gerät abmelden</p>
              <button onClick={() => { clearAuth(); navigate('/'); }} className="text-sm text-red-500 font-semibold hover:text-red-700 transition-colors">
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
