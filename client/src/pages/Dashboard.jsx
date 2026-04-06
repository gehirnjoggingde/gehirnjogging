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

const DIFFICULTY_LABELS = { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' };
const QUESTION_LABELS   = { 1: 'Entspannt', 2: 'Locker', 3: 'Aktiv', 4: 'Intensiv', 5: 'Maximum' };

/* ── Subcomponents ───────────────────────────────────────── */
function StatBadge({ value, label, icon }) {
  return (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl px-4 py-3 flex-1 min-w-0">
      <span className="text-lg mb-0.5">{icon}</span>
      <span className="text-xl font-extrabold text-white leading-none">{value}</span>
      <span className="text-xs text-white/55 mt-1 text-center leading-tight">{label}</span>
    </div>
  );
}

function SliderInput({ label, value, min, max, onChange, displayValue }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
          {displayValue}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #2563eb ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <div className="flex justify-between text-xs text-gray-300 mt-1">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const isPaid = searchParams.get('session');

  const [settingsForm, setSettingsForm] = useState({
    preferred_categories: ['allgemeinwissen','psychologie','geschichte','wissenschaft','philosophie','wirtschaft','natur','kultur'],
    daily_question_count: 3,
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
        if (cats.length === 1) return prev;
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

  function handleCopyReferral() {
    const link = 'https://gehirnjoggingclub.de/';
    function onSuccess() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    function fallbackCopy() {
      try {
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) { onSuccess(); } else { showToast('Link: ' + link); }
      } catch { showToast('Link: ' + link); }
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(onSuccess).catch(fallbackCopy);
    } else { fallbackCopy(); }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-brand-100 border-t-brand-600 animate-spin" />
          <p className="text-sm text-gray-400">Lädt dein Dashboard…</p>
        </div>
      </div>
    </div>
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const firstName = user?.name?.split(' ')[0] || 'du';

  /* ── Section JSX (used in both mobile + desktop layouts) ── */

  const sectionUhrzeit = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <SectionLabel>Quiz-Uhrzeit</SectionLabel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-extrabold text-gray-900 leading-none">{user?.quiz_time} Uhr</p>
          <p className="text-sm text-gray-400 mt-1.5">
            {user?.daily_question_count > 1
              ? `${user.daily_question_count} Fragen täglich · auf WhatsApp`
              : '1 Frage täglich · auf WhatsApp'}
          </p>
        </div>
        <button onClick={() => setShowTimePicker(true)} className="btn-secondary text-sm py-2 px-4 flex-shrink-0">
          Ändern
        </button>
      </div>
    </div>
  );

  const sectionKategorien = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <SectionLabel>Themenkategorien</SectionLabel>
      <p className="text-xs text-gray-400 mb-3 -mt-1">Mehrere wählbar – mindestens eine.</p>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map(cat => {
          const active = settingsForm.preferred_categories.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-all active:scale-[.97] text-left ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-base flex-shrink-0">{cat.icon}</span>
              <span className="text-xs leading-tight truncate">{cat.label}</span>
              {active && (
                <span className="ml-auto w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const sectionIntensitaet = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
      <SectionLabel>Quiz-Intensität</SectionLabel>
      <SliderInput
        label="Fragen pro Tag"
        value={settingsForm.daily_question_count}
        min={1} max={5}
        onChange={v => setSettingsForm(p => ({ ...p, daily_question_count: v }))}
        displayValue={`${settingsForm.daily_question_count} · ${QUESTION_LABELS[settingsForm.daily_question_count]}`}
      />
      <div className="border-t border-gray-50" />
      <SliderInput
        label="Schwierigkeitsgrad"
        value={settingsForm.difficulty_level}
        min={1} max={3}
        onChange={v => setSettingsForm(p => ({ ...p, difficulty_level: v }))}
        displayValue={DIFFICULTY_LABELS[settingsForm.difficulty_level]}
      />
    </div>
  );

  const sectionSaveBtn = (
    <button
      onClick={saveSettings}
      disabled={saving}
      className="btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-brand-200"
    >
      {saving ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Wird gespeichert…
        </span>
      ) : 'Einstellungen speichern'}
    </button>
  );

  const sectionSoFunktionierts = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <SectionLabel>So funktioniert's</SectionLabel>
      <div className="space-y-3">
        {[
          { step: '1', text: 'Du bekommst täglich eine Frage per WhatsApp.' },
          { step: '2', text: 'Antworte mit 1, 2, 3 oder 4 auf die Antwortmöglichkeit.' },
          { step: '3', text: 'Du erhältst sofort Feedback mit Erklärung.' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {step}
            </span>
            <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const sectionFreunde = (
    <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Freunde einladen</p>
          <h3 className="text-lg font-extrabold leading-snug mb-1">Teile Gehirnjogging 🧠</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Schick deinen Freunden deinen persönlichen Link und macht gemeinsam schlauer.
          </p>
        </div>
        <span className="text-4xl select-none flex-shrink-0">🎁</span>
      </div>
      <button
        onClick={handleCopyReferral}
        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[.97] ${
          copied ? 'bg-green-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
        }`}
      >
        {copied ? '✓ Link kopiert!' : '🔗 Einladungslink kopieren'}
      </button>
    </div>
  );

  const sectionAbonnement = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <SectionLabel>Abonnement</SectionLabel>
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          user?.subscription_status === 'active' ? 'bg-green-500' :
          user?.subscription_status === 'paused' ? 'bg-amber-400' : 'bg-red-400'
        }`} />
        <span className="text-sm font-semibold text-gray-800">
          {user?.subscription_status === 'active' ? 'Aktiv' :
           user?.subscription_status === 'paused' ? 'Pausiert' : 'Inaktiv'}
        </span>
        {user?.subscription_status === 'active' && (
          <span className="text-xs text-gray-400">· 2,99 €/Monat</span>
        )}
      </div>
      <div className="space-y-2">
        <button
          onClick={handlePauseToggle}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-[.97] ${
            user?.is_paused
              ? 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {user?.is_paused ? '▶ Quiz fortsetzen' : '⏸ Quiz pausieren'}
        </button>
        <Link
          to="/settings"
          className="flex items-center justify-center gap-1 w-full py-2 text-sm text-gray-400 hover:text-brand-600 font-medium transition-colors"
        >
          Kündigen & weitere Optionen →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm shadow-xl z-50 whitespace-nowrap">
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

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">

          {isPaid && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-white">Willkommen bei Gehirnjogging!</p>
                <p className="text-sm text-white/65">Dein erstes Quiz kommt um {user?.quiz_time} Uhr auf WhatsApp.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0 select-none">
              {initials}
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium tracking-wide">Willkommen zurück</p>
              <h1 className="text-2xl font-extrabold text-white leading-tight">{firstName} 👋</h1>
              <p className="text-white/50 text-xs mt-0.5">
                {user?.is_paused ? '⏸ Quiz pausiert' : `Nächstes Quiz um ${user?.quiz_time} Uhr`}
              </p>
            </div>
          </div>

          {stats && (
            <div className="flex gap-3">
              <StatBadge icon="🔥" value={stats.streak} label="Tage Streak" />
              <StatBadge icon="✅" value={stats.correct} label="Richtig" />
              <StatBadge icon="🎯" value={`${stats.accuracy}%`} label="Genauigkeit" />
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 lg:py-8">

        {/* ── Mobile layout: desired order ───────────────── */}
        <div className="space-y-4 lg:hidden">
          {sectionUhrzeit}
          {sectionKategorien}
          {sectionIntensitaet}
          {sectionSaveBtn}
          {sectionSoFunktionierts}
          {sectionFreunde}
          {sectionAbonnement}
        </div>

        {/* ── Desktop layout: two-column ─────────────────── */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="space-y-4">
            {sectionUhrzeit}
            {sectionSoFunktionierts}
            {sectionFreunde}
          </div>
          <div className="space-y-4">
            {sectionKategorien}
            {sectionIntensitaet}
            {sectionSaveBtn}
            {sectionAbonnement}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
