import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/* ── Scroll-reveal ───────────────────────────────────────── */
function Reveal({ children, type = 'fade-up', delay = 0, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => el.classList.add('in-view'), delay);
        io.disconnect();
      }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <div ref={ref} className={`${type} ${className}`}>{children}</div>;
}

/* ── Animated WhatsApp Chat ──────────────────────────────── */
function AnimatedChat() {
  return (
    <div className="bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-[290px]">
      {/* Header */}
      <div className="bg-[#202c33] flex items-center gap-3 px-4 py-3">
        <img src="/logo.png" alt="" className="h-8 w-8 rounded-full object-contain bg-white/10 p-1" />
        <div>
          <p className="text-white text-sm font-semibold leading-none">Gehirnjogging</p>
          <p className="text-green-400 text-xs mt-0.5">● online</p>
        </div>
      </div>

      {/* Chat body */}
      <div className="p-3 space-y-2 min-h-[320px] bg-[#0b141a]" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3C/svg%3E\")"
      }}>
        {/* Incoming quiz message */}
        <div className="chat-bubble-in chat-delay-1 opacity-0 max-w-[90%]">
          <div className="bg-[#202c33] rounded-2xl rounded-tl-sm p-3 text-white text-xs leading-relaxed">
            <p className="font-bold text-cyan-400 text-[11px] mb-1">🧠 Gehirnjogging Quiz</p>
            <p className="text-gray-400 text-[10px] mb-1.5">📚 Psychologie</p>
            <p className="mb-2 text-[12px] leading-snug font-medium">Welcher Forscher prägte den Begriff „Flow"?</p>
            <div className="space-y-0.5 text-gray-300 text-[11px]">
              <p>1️⃣ Abraham Maslow</p>
              <p>2️⃣ Mihaly Csikszentmihalyi</p>
              <p>3️⃣ Carl Rogers</p>
              <p>4️⃣ Viktor Frankl</p>
            </div>
            <p className="text-gray-500 text-[10px] mt-2">Antworte mit 1, 2, 3 oder 4</p>
            <p className="text-gray-600 text-[10px] text-right mt-1">09:00</p>
          </div>
        </div>

        {/* Typing indicator */}
        <div className="chat-bubble-in chat-delay-2 opacity-0 flex justify-end">
          <div className="bg-[#005c4b] rounded-2xl rounded-tr-sm px-3 py-2">
            <span className="text-white text-xs font-medium">2 ✓✓</span>
          </div>
        </div>

        {/* Feedback */}
        <div className="chat-bubble-in chat-delay-3 opacity-0 max-w-[90%]">
          <div className="bg-[#202c33] rounded-2xl rounded-tl-sm p-3 text-white text-xs leading-relaxed">
            <p className="font-bold mb-1">✅ Richtig! Sehr gut!</p>
            <p className="text-gray-300 text-[11px]">
              💡 Csikszentmihalyi beschrieb „Flow" als völliges Aufgehen in einer Tätigkeit – Zeit und Selbst vergessen.
            </p>
            <p className="mt-1.5 font-medium text-[11px]">Bis morgen! 🧠</p>
            <p className="text-gray-600 text-[10px] text-right mt-1">09:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Data ────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '📲', title: 'Direkt auf WhatsApp', desc: 'Keine App, kein Login. Dein Quiz kommt dorthin, wo du sowieso bist.' },
  { icon: '🎯', title: 'Anzahl wählbar', desc: '1 bis 5 Fragen täglich – du entscheidest wie intensiv du trainierst.' },
  { icon: '📚', title: 'Deine Kategorie', desc: 'Wähle aus 8 Themen was dich wirklich interessiert.' },
  { icon: '💡', title: 'Mit Erklärung', desc: 'Nicht nur richtig oder falsch – du verstehst auch warum.' },
  { icon: '📊', title: 'Wöchentlicher Score', desc: 'Jeden Sonntag deine Wochenbilanz direkt auf WhatsApp.' },
  { icon: '👥', title: 'Freunde einladen', desc: 'Teile deinen Link – und tretet gemeinsam gegen euer Wissen an.' },
];

const CATEGORIES = [
  { icon: '🌍', name: 'Allgemeinwissen', desc: 'Breites Spektrum für jeden Tag',    color: 'bg-blue-50   text-blue-700   border-blue-200' },
  { icon: '🧠', name: 'Psychologie',     desc: 'Wie Menschen denken & fühlen',      color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { icon: '📜', name: 'Geschichte',      desc: 'Von der Antike bis heute',           color: 'bg-amber-50  text-amber-700  border-amber-200' },
  { icon: '🔬', name: 'Wissenschaft',    desc: 'Biologie, Physik, Chemie & mehr',   color: 'bg-green-50  text-green-700  border-green-200' },
  { icon: '💡', name: 'Philosophie',     desc: 'Die großen Fragen des Lebens',       color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { icon: '💰', name: 'Wirtschaft',      desc: 'Business, Finanzen, Märkte',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { icon: '🌿', name: 'Natur & Umwelt',  desc: 'Tiere, Pflanzen, Ökosysteme',       color: 'bg-lime-50   text-lime-700   border-lime-200' },
  { icon: '🎬', name: 'Kultur & Medien', desc: 'Film, Musik, Kunst, Literatur',      color: 'bg-rose-50   text-rose-700   border-rose-200' },
];

const STEPS = [
  { n: '1', icon: '✍️', title: 'Registrieren', desc: 'Name, E-Mail und WhatsApp-Nummer – in 2 Minuten fertig.' },
  { n: '2', icon: '⚙️', title: 'Personalisieren', desc: 'Wähle deine Kategorie, Uhrzeit und wie viele Fragen täglich.' },
  { n: '3', icon: '📩', title: 'Täglich klüger werden', desc: 'Dein Quiz landet pünktlich im Chat – einfach antworten und lernen.' },
];

/* ── Page ────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-[#0f2744] to-brand-900 animate-gradient text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              7 Tage kostenlos testen
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight">
              Täglich klüger<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-brand-300 to-brand-400">
                per WhatsApp
              </span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Jeden Tag Gehirnjogging direkt in deinem Chat. Fragen beantworten, Wissen aufbauen – in Sekunden, ohne App, ohne Aufwand.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/signup" className="btn-primary py-4 px-8 text-base bg-brand-500 hover:bg-brand-400 animate-pulse-glow">
                Jetzt kostenlos starten →
              </Link>
              <a href="#wie" className="btn-outline-white py-4 px-8 text-base">
                Wie funktioniert's?
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">Danach 2,99 €/Monat · Jederzeit kündbar</p>
          </div>

          {/* Animated Chat */}
          <div className="flex-shrink-0 flex justify-center">
            <AnimatedChat />
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-4 px-4">
        <div className="max-w-xl mx-auto flex justify-around text-sm text-gray-500 font-medium">
          <span>⭐ 4,9/5 Bewertung</span>
          <span className="text-gray-200">|</span>
          <span>⚡ In 2 Minuten startklar</span>
          <span className="text-gray-200">|</span>
          <span>↩️ Jederzeit kündbar</span>
        </div>
      </section>

      {/* ── Wie funktioniert's ────────────────────────────── */}
      <section id="wie" className="section bg-white">
        <div className="container">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">In 3 Schritten startklar</h2>
            <p className="text-gray-500 max-w-md mx-auto">Kein Schnickschnack. Einfach anmelden und täglich klüger werden.</p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} type="fade-up" delay={i * 100}>
                <div className="text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-200">
                    {s.n}
                  </div>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Alles was du brauchst</h2>
            <p className="text-gray-500">Und nichts was du nicht brauchst.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} type={i % 2 === 0 ? 'fade-left' : 'fade-right'} delay={i * 60}>
                <div className="card-hover p-6 h-full">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kategorien ───────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Dein Thema, dein Quiz</h2>
            <p className="text-gray-500 max-w-md mx-auto">Wähle die Kategorien die dich wirklich interessieren – im Dashboard jederzeit anpassbar.</p>
          </Reveal>

          {/* Pills layout */}
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.name} type="scale-in" delay={i * 50}>
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-sm font-semibold ${c.color} hover:-translate-y-0.5 transition-transform duration-200 cursor-default`}>
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="font-bold text-[13px]">{c.name}</p>
                    <p className="text-[11px] opacity-70 font-normal">{c.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container-sm">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Ein Plan. Kein Bullshit.</h2>
            <p className="text-gray-500">Weniger als ein Kaffee im Monat.</p>
          </Reveal>
          <Reveal type="scale-in">
            <div className="relative border-2 border-brand-600 rounded-3xl p-8 bg-white shadow-glow">
              <div className="absolute top-5 right-5 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                BELIEBTESTE WAHL
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="" className="h-14 w-14 object-contain" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Gehirnjogging Premium</h3>
                    <p className="text-sm text-gray-500">Tägliches WhatsApp Quiz</p>
                  </div>
                </div>
                <div className="sm:ml-auto">
                  <div className="text-4xl font-extrabold text-gray-900">2,99 €<span className="text-lg font-normal text-gray-400">/Monat</span></div>
                  <p className="text-sm text-brand-600 font-semibold">7 Tage kostenlos</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {['1–5 Quizfragen täglich wählbar', 'Kategorie frei wählbar', 'Uhrzeit frei wählbar (09–22 Uhr)',
                  'Jederzeit pausieren & kündigen', 'Erklärungen zu jeder Antwort', 'Wöchentlicher Score auf WhatsApp'].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/signup" className="btn-primary w-full py-4 text-base justify-center animate-pulse-glow">
                7 Tage kostenlos starten →
              </Link>
              <p className="text-xs text-gray-400 text-center mt-3">Keine versteckten Kosten · Stripe-gesicherte Zahlung · Kündigung jederzeit</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Was andere sagen</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Markus R.', text: 'Ich lerne täglich was Neues während ich auf die U-Bahn warte. Simpel, effektiv, genial.' },
              { name: 'Sarah K.', text: 'Kaffee + Gehirnjogging = perfekter Morgen. Meine Lieblingsroutine seit Monaten.' },
              { name: 'Tim B.', text: '7 Tage kostenlos – und dann wollte ich gar nicht mehr aufhören. Absolut sein Geld wert.' },
            ].map((t, i) => (
              <Reveal key={t.name} type="fade-up" delay={i * 80}>
                <div className="card p-6 h-full flex flex-col">
                  <div className="text-yellow-400 mb-3 tracking-wide">★★★★★</div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 flex-1">„{t.text}"</p>
                  <p className="text-xs font-semibold text-gray-400">— {t.name}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="section bg-gradient-to-br from-navy-950 to-brand-900 text-white text-center">
        <div className="container-sm">
          <Reveal>
            <img src="/logo.png" alt="" className="h-16 w-16 object-contain mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Starte heute. Kostenlos.</h2>
            <p className="text-gray-300 mb-8 text-lg">7 Tage testen, dann 2,99 €/Monat. Jederzeit kündbar.</p>
            <Link to="/signup" className="btn-primary py-4 px-10 text-base bg-brand-500 hover:bg-brand-400 animate-pulse-glow">
              Jetzt starten →
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
