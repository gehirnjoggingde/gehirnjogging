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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [userData, statsData] = await Promise.all([
        api.get('/users/me'),
        api.get('/quiz/stats'),
      ]);
      setUser(userData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
      showToast(`Quiz-Zeit auf ${time} Uhr geändert ✓`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setTimeLoading(false);
    }
  }

  async function handlePauseToggle() {
    setPauseLoading(true);
    try {
      const updated = await api.put('/users/settings', { is_paused: !user.is_paused });
      setUser(updated);
      showToast(updated.is_paused ? 'Quiz pausiert' : 'Quiz wieder aktiv ✓');
    } catch (err) {
      showToast('Fehler');
    } finally {
      setPauseLoading(false);
    }
  }

  async function handleSkip() {
    setSkipLoading(true);
    try {
      await api.post('/users/skip-today');
      showToast('Heutiges Quiz übersprungen');
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler');
    } finally {
      setSkipLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-lg animate-pulse">Laden…</div>
        </div>
      </div>
    );
  }

  const isPaid = searchParams.get('session');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm shadow-lg z-50 transition-all">
          {toast}
        </div>
      )}

      {/* Time picker modal */}
      {showTimePicker && (
        <TimePickerModal
          currentTime={user?.quiz_time}
          onSave={handleTimeChange}
          onClose={() => setShowTimePicker(false)}
          loading={timeLoading}
        />
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {isPaid && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-brand-800">Willkommen bei Gehirnjogging!</p>
              <p className="text-sm text-brand-600">Dein erstes Quiz kommt morgen um {user?.quiz_time} Uhr auf WhatsApp.</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Hallo, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {user?.is_paused
            ? 'Dein Quiz ist aktuell pausiert.'
            : `Dein nächstes Quiz kommt um ${user?.quiz_time} Uhr.`}
        </p>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-brand-700">{stats.streak}</div>
              <div className="text-xs text-gray-500 mt-1">Tage Streak 🔥</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-brand-700">{stats.correct}</div>
              <div className="text-xs text-gray-500 mt-1">Richtig beantwortet</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-brand-700">{stats.accuracy}%</div>
              <div className="text-xs text-gray-500 mt-1">Genauigkeit</div>
            </div>
          </div>
        )}

        {/* Quiz time card */}
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Quiz-Uhrzeit</h2>
              <p className="text-sm text-gray-500">
                Du erhältst dein Quiz täglich um{' '}
                <span className="font-semibold text-brand-700">{user?.quiz_time} Uhr</span>
              </p>
            </div>
            <button
              onClick={() => setShowTimePicker(true)}
              className="btn-secondary text-sm py-2 px-4"
            >
              Ändern
            </button>
          </div>
        </div>

        {/* Subscription status card */}
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Abonnement</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  user?.subscription_status === 'active' ? 'bg-green-500' :
                  user?.subscription_status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-500 capitalize">
                  {user?.subscription_status === 'active' ? 'Aktiv' :
                   user?.subscription_status === 'paused' ? 'Pausiert' :
                   user?.subscription_status === 'cancelled' ? 'Gekündigt' : user?.subscription_status}
                </span>
              </div>
            </div>
            <Link to="/settings" className="text-sm text-brand-700 font-medium hover:underline">
              Verwalten →
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={handlePauseToggle}
            disabled={pauseLoading}
            className={user?.is_paused ? 'btn-primary' : 'btn-secondary'}
          >
            {pauseLoading ? '…' : user?.is_paused ? '▶ Quiz fortsetzen' : '⏸ Quiz pausieren'}
          </button>
          <button
            onClick={handleSkip}
            disabled={skipLoading}
            className="btn-secondary"
          >
            {skipLoading ? '…' : '⏭ Heute überspringen'}
          </button>
        </div>

        {/* How to answer */}
        <div className="card mt-8 bg-brand-50 border-brand-100">
          <h3 className="font-semibold text-brand-900 mb-2">📲 So antwortest du</h3>
          <p className="text-sm text-brand-700">
            Wenn du dein Quiz auf WhatsApp erhältst, antworte einfach mit <strong>1</strong>, <strong>2</strong>, <strong>3</strong> oder <strong>4</strong>.
            Du bekommst sofort Feedback, ob du richtig lagst – inklusive Erklärung!
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
