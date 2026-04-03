import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TimePickerModal from '../components/TimePickerModal';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [toast, setToast] = useState('');
  const isPaid = searchParams.get('session');

  useEffect(() => {
    Promise.all([api.get('/users/me'), api.get('/quiz/stats')])
      .then(([u, s]) => { setUser(u); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleTimeChange(time) {
    setTimeLoading(true);
    try {
      const updated = await api.put('/users/settings', { quiz_time: time });
      setUser(updated);
      setShowTimePicker(false);
      showToast(`Quiz-Zeit auf ${time} Uhr gespeichert ✓`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler beim Speichern');
    } finally { setTimeLoading(false); }
  }

  async function handlePauseToggle() {
    setPauseLoading(true);
    try {
      const updated = await api.put('/users/settings', { is_paused: !user.is_paused });
      setUser(updated);
      showToast(updated.is_paused ? 'Quiz pausiert' : 'Quiz wieder aktiv ✓');
    } catch { showToast('Fehler'); }
    finally { setPauseLoading(false); }
  }

  async function handleSkip() {
    setSkipLoading(true);
    try {
      await api.post('/users/skip-today');
      showToast('Heutiges Quiz übersprungen');
    } catch (err) { showToast(err.response?.data?.error || 'Fehler'); }
    finally { setSkipLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          Laden…
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm shadow-lg z-50 whitespace-nowrap">
          {toast}
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Welcome banner */}
        {isPaid && (
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-2xl p-5 mb-6 flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">🎉</span>
            <div>
              <p className="font-bold text-lg mb-0.5">Willkommen bei Gehirnjogging!</p>
              <p className="text-brand-100 text-sm">
                Dein erstes Quiz kommt morgen um <strong>{user?.quiz_time} Uhr</strong> auf WhatsApp. Freue dich drauf!
              </p>
            </div>
          </div>
        )}

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Hallo, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.is_paused
              ? '⏸ Dein Quiz ist aktuell pausiert.'
              : `Dein nächstes Quiz kommt um ${user?.quiz_time} Uhr.`}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Tage Streak', value: stats.streak, suffix: '🔥' },
              { label: 'Richtig', value: stats.correct, suffix: '✓' },
              { label: 'Genauigkeit', value: `${stats.accuracy}%`, suffix: '' },
            ].map(s => (
              <div key={s.label} className="card text-center py-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-600">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1 leading-tight">{s.label} {s.suffix}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quiz time */}
        <div className="card mb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">Quiz-Uhrzeit</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Täglich um <span className="text-brand-600 font-bold">{user?.quiz_time} Uhr</span>
              </p>
            </div>
            <button onClick={() => setShowTimePicker(true)} className="btn-secondary text-sm py-2 px-4 flex-shrink-0">
              Ändern
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div className="card mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">Abonnement</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  user?.subscription_status === 'active' ? 'bg-green-500' :
                  user?.subscription_status === 'paused' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="text-sm text-gray-500">
                  {user?.subscription_status === 'active' ? 'Aktiv · 2,99 €/Monat' :
                   user?.subscription_status === 'paused' ? 'Pausiert' : 'Inaktiv'}
                </span>
              </div>
            </div>
            <Link to="/settings" className="text-sm text-brand-600 font-semibold hover:underline flex-shrink-0">
              Verwalten →
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handlePauseToggle}
            disabled={pauseLoading}
            className={`py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[.97] ${
              user?.is_paused
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {pauseLoading ? '…' : user?.is_paused ? '▶ Fortsetzen' : '⏸ Pausieren'}
          </button>
          <button
            onClick={handleSkip}
            disabled={skipLoading}
            className="py-3.5 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-all active:scale-[.97]"
          >
            {skipLoading ? '…' : '⏭ Heute überspringen'}
          </button>
        </div>

        {/* How to answer */}
        <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
          <h3 className="font-bold text-brand-900 mb-2">📲 So antwortest du</h3>
          <p className="text-sm text-brand-700 leading-relaxed">
            Wenn du dein Quiz auf WhatsApp bekommst, antworte einfach mit <strong>1</strong>, <strong>2</strong>, <strong>3</strong> oder <strong>4</strong>. Du bekommst sofort Feedback – inklusive Erklärung!
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
