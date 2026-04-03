import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FEATURES = [
  { icon: '📲', title: 'Direkt auf WhatsApp', desc: 'Keine App, kein Login nötig. Dein Quiz kommt dorthin, wo du sowieso bist.' },
  { icon: '🕐', title: 'Deine Uhrzeit', desc: 'Morgens mit dem Kaffee oder abends auf dem Sofa – du entscheidest wann.' },
  { icon: '📚', title: 'Breites Wissen', desc: 'Psychologie, Geschichte, Wissenschaft, Philosophie und mehr.' },
  { icon: '💡', title: 'Mit Erklärung', desc: 'Nicht nur richtig oder falsch – du lernst auch warum.' },
  { icon: '🔥', title: 'Streak aufbauen', desc: 'Beobachte wie dein Wissen Tag für Tag wächst.' },
  { icon: '⏸️', title: 'Jederzeit pausieren', desc: 'Im Urlaub? Einfach pausieren. Kein Abo läuft einfach weiter.' },
];

const STEPS = [
  { n: '1', icon: '✍️', title: 'Registrieren', desc: 'Name, E-Mail, WhatsApp-Nummer. Fertig.' },
  { n: '2', icon: '💳', title: '7 Tage kostenlos', desc: 'Keine Kreditkarte für den Start nötig. Test first.' },
  { n: '3', icon: '📩', title: 'Quiz empfangen', desc: 'Täglich zur Wunschuhrzeit – einfach antworten.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 text-white">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-32 flex flex-col lg:flex-row items-center gap-12">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              7 Tage kostenlos testen
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5">
              Täglich klüger<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-brand-400">
                per WhatsApp
              </span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
              Jeden Tag eine Quizfrage direkt in deinem Chat. Beantworte sie in 10 Sekunden und lerne etwas Neues – ohne App, ohne Aufwand.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/signup" className="btn-primary py-4 px-8 text-base bg-brand-500 hover:bg-brand-400 shadow-glow">
                Jetzt kostenlos starten →
              </Link>
              <a href="#wie" className="btn-secondary py-4 px-8 text-base border-white/20 text-white hover:bg-white/10">
                Wie funktioniert's?
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-400">Danach 2,99 €/Monat · Jederzeit kündbar</p>
          </div>

          {/* WhatsApp Mockup */}
          <div className="flex-shrink-0 w-full max-w-xs">
            <div className="bg-[#111b21] rounded-3xl p-4 shadow-2xl border border-white/10">
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
                <img src="/logo.png" alt="" className="h-9 w-9 rounded-full object-contain bg-white/10 p-1" />
                <div>
                  <p className="text-white text-sm font-semibold">Gehirnjogging</p>
                  <p className="text-gray-400 text-xs">online</p>
                </div>
              </div>
              {/* Messages */}
              <div className="space-y-2 text-sm">
                <div className="bg-[#202c33] rounded-xl rounded-tl-sm p-3 text-white max-w-[90%]">
                  <p className="font-semibold text-cyan-400 text-xs mb-1">🧠 Gehirnjogging Quiz</p>
                  <p className="text-xs text-gray-300 mb-2">📚 Psychologie</p>
                  <p className="mb-2">Welcher Psychologe entwickelte das Konzept der „erlernten Hilflosigkeit"?</p>
                  <p className="text-gray-300 text-xs">1️⃣ Sigmund Freud</p>
                  <p className="text-gray-300 text-xs">2️⃣ Martin Seligman</p>
                  <p className="text-gray-300 text-xs">3️⃣ Carl Jung</p>
                  <p className="text-gray-300 text-xs">4️⃣ Abraham Maslow</p>
                  <p className="text-gray-500 text-xs mt-2">Antworte mit 1, 2, 3 oder 4</p>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#005c4b] rounded-xl rounded-tr-sm px-3 py-2 text-white text-xs">2 ✓✓</div>
                </div>
                <div className="bg-[#202c33] rounded-xl rounded-tl-sm p-3 text-white max-w-[90%] text-xs">
                  <p>✅ <strong>Richtig!</strong> Super gemacht!</p>
                  <p className="mt-1.5 text-gray-300">💡 Seligman entdeckte, dass wiederholte unkontrollierbare Erlebnisse zu Passivität führen.</p>
                  <p className="mt-1.5">Bis morgen! 🧠</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ─────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-4 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-500 font-medium">
          <span>⭐ 4,9/5 Bewertung</span>
          <span>•</span>
          <span>🔐 Sichere Zahlung via Stripe</span>
          <span>•</span>
          <span>📵 Keine App nötig</span>
          <span>•</span>
          <span>↩️ Jederzeit kündbar</span>
        </div>
      </section>

      {/* ── Wie funktioniert's ───────────────────────────────── */}
      <section id="wie" className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">In 3 Schritten startklar</h2>
            <p className="text-gray-500">Kein Schnickschnack. Einfach anmelden und täglich klüger werden.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="relative text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-glow">
                  {s.n}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Alles was du brauchst</h2>
            <p className="text-gray-500">Und nichts was du nicht brauchst.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card-hover p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Ein Plan. Kein Bullshit.</h2>
            <p className="text-gray-500">Weniger als ein Kaffee im Monat.</p>
          </div>

          <div className="relative border-2 border-brand-600 rounded-3xl p-8 shadow-glow overflow-hidden">
            <div className="absolute top-4 right-4 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              BELIEBTESTE WAHL
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="" className="h-14 w-14 object-contain" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Gehirnjogging Premium</h3>
                  <p className="text-sm text-gray-500">Tägliches WhatsApp Quiz</p>
                </div>
              </div>
              <div className="sm:ml-auto text-left sm:text-right">
                <div className="text-4xl font-extrabold text-gray-900">
                  2,99 €<span className="text-lg font-normal text-gray-400">/Monat</span>
                </div>
                <p className="text-sm text-brand-600 font-medium">7 Tage kostenlos</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                'Täglich eine Quizfrage auf WhatsApp',
                'Uhrzeit frei wählbar (09–22 Uhr)',
                'Jederzeit pausieren',
                'Erklärungen zu jeder Antwort',
                'Streak & Statistiken',
                'Kein App-Download nötig',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <Link to="/signup" className="btn-primary w-full py-4 text-base justify-center">
              7 Tage kostenlos starten →
            </Link>
            <p className="text-xs text-gray-400 text-center mt-3">
              Keine Kreditkarte für die Testphase · Danach 2,99 €/Monat · Jederzeit kündbar
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-10">Was andere sagen</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Markus R.', text: 'Ich lerne täglich was Neues während ich auf die U-Bahn warte. Simpel, effektiv, genial.' },
              { name: 'Sarah K.', text: 'Kaffee + Gehirnjogging = perfekter Morgen. Meine Lieblingsroutine seit Monaten.' },
              { name: 'Tim B.', text: '7 Tage kostenlos – und dann wollte ich gar nicht mehr aufhören. 3 € im Monat sind ein Witz.' },
            ].map(t => (
              <div key={t.name} className="card p-6">
                <div className="text-yellow-400 mb-3 text-sm">★★★★★</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">„{t.text}"</p>
                <p className="text-xs font-semibold text-gray-400">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="section bg-gradient-to-br from-navy-950 to-brand-900 text-white text-center">
        <div className="container-sm">
          <img src="/logo.png" alt="" className="h-16 w-16 object-contain mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Starte heute. Kostenlos.</h2>
          <p className="text-gray-300 mb-8">7 Tage testen, dann 2,99 €/Monat. Jederzeit kündbar.</p>
          <Link to="/signup" className="btn-primary py-4 px-10 text-base bg-brand-500 hover:bg-brand-400 shadow-glow">
            Jetzt starten →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
