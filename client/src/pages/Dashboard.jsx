import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { getUser } from '../services/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TimePickerModal from '../components/TimePickerModal';

/* ── Constants ───────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'allgemeinwissen', label: 'Allgemeinwissen', icon: '🌍' },
  { id: 'psychologie',     label: 'Psychologie',     icon: '🧠' },
  { id: 'geschichte',      label: 'Geschichte',      icon: '📜' },
  { id: 'wissenschaft',    label: 'Wissenschaft',     icon: '🔬' },
  { id: 'philosophie',     label: 'Philosophie',      icon: '💡' },
  { id: 'wirtschaft',      label: 'Wirtschaft',       icon: '💰' },
  { id: 'natur',           label: 'Natur & Umwelt',   icon: '🌿' },
  { id: 'kultur',          label: 'Kultur & Medien',  icon: '🎬' },
];

const DIFFICULTY_LABELS = {
  1: 'Sehr leicht', 2: 'Sehr leicht',
  3: 'Leicht',      4: 'Leicht',
  5: 'Mittel',      6: 'Mittel',
  7: 'Schwer',      8: 'Schwer',
  9: 'Sehr schwer', 10: 'Sehr schwer',
};

const QUESTION_LABELS = {
  1: 'Entspannt', 2: 'Locker', 3: 'Aktiv', 4: 'Intensiv', 5: 'Maximum',
};

/* ── Subcomponents ───────────────────────────────────────── */
function StatCard({ value, label, color = 'text-brand-600' }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-white/60 mt-1">{label}</div>
    </div>
  );
}

function SliderInput({ label, value, min, max, onChange, displayValue }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
          {displayValue}
        </span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
          style={{
            background: `linear-gradient(to right, #2563eb ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const isPaid = searchParams.get('session');

  // Local settings state (for the settings tab)
  const [settingsForm, setSettingsForm] = useState({
    preferred_categories: ['allgemeinwissen'],
    daily_question_count: 1,
    difficulty_level: 5,
  });

  useEffect(() => {
    Promise.all([api.get('/users/me'), api.get('/quiz/stats')])
      .then(([u, s]) => {
        setUser(u);
        setStats(s);
        setSettingsForm({
          preferred_categories: u.preferred_categories || ['allgemeinwissen'],
          daily_question_count: u.daily_question_count || 1,
          difficulty_level: u.difficulty_level || 5,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function toggleCategory(id) {
    setSettingsForm(prev => {
      const cats = prev.preferred_categories;
      if (cats.includes(id)) {
        if (cats.length === 1) return prev; // keep at least one
        return { ...prev, preferred_categories: cats.filter(c => c !== id) };
      }
      return { ...prev, preferred_categories: [...cats, id] };
    });
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const updated = await api.put('/users/settings', settingsForm);
      setUser(u => ({ ...u, ...updated }));
      showToast('Einstellungen gespeichert ✓');
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  async function handleTimeChange(time) {
    try {
      const updated = await api.put('/users/settings', { quiz_time: time });
      setUser(u => ({ ...u, ...updated }));
      setShowTimePicker(false);
      showToast(`Quiz-Zeit auf ${time} Uhr gespeichert ✓`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler');
    }
  }

  async function handlePauseToggle() {
    try {
      const updated = await api.put('/users/settings', { is_paused: !user.is_paused });
      setUser(u => ({ ...u, ...updated }));
      showToast(updated.is_paused ? 'Quiz pausiert' : 'Quiz wieder aktiv ✓');
    } catch { showToast('Fehler'); }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-gray-400 text-sm">Lädt dein Dashboard…</p>
        </div>
      </div>
    </div>
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const TABS = [
    { id: 'overview', label: 'Übersicht', icon: '🏠' },
    { id: 'settings', label: 'Einstellungen', icon: '⚙️' },
    { id: 'subscription', label: 'Abonnement', icon: '💳' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm shadow-xl z-50 whitespace-nowrap animate-fade-in">
          {toast}
        </div>
      )}

      {showTimePicker && (
        <TimePickerModal
          currentTime={user?.quiz_time}
          onSave={handleTimeChange}
          onClose={() => setShowTimePicker(false)}
          loading={false}
        />
      )}

      {/* ── Hero Header ───────────────────────────────────── */}
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">
          {isPaid && (
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold">Willkommen bei Gehirnjogging!</p>
                <p className="text-sm text-white/70">Dein erstes Quiz kommt um {user?.quiz_time} Uhr auf WhatsApp.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-xl font-bold shadow-lg flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white/60 text-sm">Willkommen zurück</p>
              <h1 className="text-2xl font-extrabold">
                {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-white/60 text-xs mt-0.5">
                {user?.is_paused
                  ? '⏸ Quiz pausiert'
                  : `Nächstes Quiz um ${user?.quiz_time} Uhr`}
              </p>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard value={`${stats.streak}🔥`} label="Streak" color="text-orange-300" />
              <StatCard value={stats.correct} label="Richtig" color="text-green-300" />
              <StatCard value={`${stats.accuracy}%`} label="Genauigkeit" color="text-cyan-300" />
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b border-white/10">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? 'border-brand-400 text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Next quiz card */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Quiz-Uhrzeit</p>
                  <p className="text-2xl font-extrabold text-gray-900">{user?.quiz_time} Uhr</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {user?.daily_question_count > 1
                      ? `${user.daily_question_count} Fragen täglich`
                      : '1 Frage täglich'}
                  </p>
                </div>
                <button onClick={() => setShowTimePicker(true)} className="btn-secondary text-sm py-2 px-4">
                  Ändern
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePauseToggle}
                className={`py-4 rounded-xl font-semibold text-sm transition-all active:scale-[.97] flex items-center justify-center gap-2 ${
                  user?.is_paused
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {user?.is_paused ? '▶ Fortsetzen' : '⏸ Pausieren'}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="py-4 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-all active:scale-[.97] flex items-center justify-center gap-2"
              >
                ⚙️ Einstellungen
              </button>
            </div>

            {/* Category preview */}
            <div className="card">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deine Kategorien</p>
              <div className="flex flex-wrap gap-2">
                {(user?.preferred_categories || ['allgemeinwissen']).map(cat => {
                  const c = CATEGORIES.find(c => c.id === cat);
                  return c ? (
                    <span key={cat} className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {c.icon} {c.label}
                    </span>
                  ) : null;
                })}
                <button onClick={() => setActiveTab('settings')} className="text-xs text-gray-400 hover:text-brand-600 font-medium px-2">
                  + Bearbeiten
                </button>
              </div>
            </div>

            {/* How to answer */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 p-5">
              <h3 className="font-bold text-brand-900 mb-2 flex items-center gap-2">
                📲 So antwortest du
              </h3>
              <p className="text-sm text-brand-700 leading-relaxed">
                Wenn du dein Quiz auf WhatsApp bekommst, antworte einfach mit{' '}
                <strong>1</strong>, <strong>2</strong>, <strong>3</strong> oder <strong>4</strong>.
                Du bekommst sofort Feedback – inklusive Erklärung!
              </p>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Categories */}
            <div className="card">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Kategorien</p>
              <p className="text-sm text-gray-500 mb-4">Wähle die Themen die dich interessieren. Mehrere möglich.</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => {
                  const active = settingsForm.preferred_categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-[.97] text-left ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <span className="leading-tight">{cat.label}</span>
                      {active && <span className="ml-auto text-brand-500 flex-shrink-0">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="card space-y-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quiz-Intensität</p>

              <SliderInput
                label="Fragen pro Tag"
                value={settingsForm.daily_question_count}
                min={1} max={5}
                onChange={v => setSettingsForm(p => ({ ...p, daily_question_count: v }))}
                displayValue={`${settingsForm.daily_question_count} – ${QUESTION_LABELS[settingsForm.daily_question_count]}`}
              />

              <SliderInput
                label="Schwierigkeitsgrad"
                value={settingsForm.difficulty_level}
                min={1} max={10}
                onChange={v => setSettingsForm(p => ({ ...p, difficulty_level: v }))}
                displayValue={`${settingsForm.difficulty_level}/10 – ${DIFFICULTY_LABELS[settingsForm.difficulty_level]}`}
              />
            </div>

            {/* Quiz time */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Quiz-Uhrzeit</p>
                  <p className="text-lg font-bold text-gray-900">{user?.quiz_time} Uhr</p>
                </div>
                <button onClick={() => setShowTimePicker(true)} className="btn-secondary text-sm py-2 px-4">
                  Ändern
                </button>
              </div>
            </div>

            {/* Save */}
            <button onClick={saveSettings} disabled={saving} className="btn-primary w-full py-4 text-base">
              {saving ? 'Wird gespeichert…' : 'Einstellungen speichern'}
            </button>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            <div className="card">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Abonnement</p>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-3 h-3 rounded-full ${
                  user?.subscription_status === 'active' ? 'bg-green-500' :
                  user?.subscription_status === 'paused' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <span className="font-semibold text-gray-900">
                  {user?.subscription_status === 'active' ? 'Aktiv' :
                   user?.subscription_status === 'paused' ? 'Pausiert' : 'Inaktiv'}
                </span>
                {user?.subscription_status === 'active' && (
                  <span className="text-gray-400 text-sm">· 2,99 €/Monat</span>
                )}
              </div>
              <Link to="/settings" className="text-sm text-brand-600 font-semibold hover:underline">
                Vollständige Einstellungen & Kündigung →
              </Link>
            </div>

            <div className="card bg-brand-50 border-brand-100">
              <h3 className="font-bold text-brand-900 mb-2">💡 Tipp</h3>
              <p className="text-sm text-brand-700">
                Du kannst dein Quiz jederzeit pausieren ohne zu kündigen – zum Beispiel im Urlaub.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
