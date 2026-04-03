import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FEATURES = [
  { icon: '🧠', title: 'Täglich eine Frage', desc: 'Jeden Tag eine neue Quizfrage direkt in deinem WhatsApp-Chat. Kein App-Download nötig.' },
  { icon: '📚', title: 'Breites Wissen', desc: 'Psychologie, Geschichte, Wissenschaft, Philosophie, Allgemeinwissen – jeden Tag etwas Neues.' },
  { icon: '⏰', title: 'Deine Uhrzeit', desc: 'Du entscheidest, wann du dein Quiz bekommst – morgens mit dem Kaffee oder abends zum Feierabend.' },
  { icon: '💡', title: 'Mit Erklärung', desc: 'Jede Antwort kommt mit einer kurzen Erklärung, damit du wirklich etwas lernst.' },
  { icon: '📈', title: 'Streak & Stats', desc: 'Verfolge deine Lern-Streak und deinen Fortschritt im Dashboard.' },
  { icon: '⏸️', title: 'Flexibel pausieren', desc: 'Im Urlaub? Einfach pausieren und weitermachen, wenn du bereit bist.' },
];

const TESTIMONIALS = [
  { name: 'Markus R.', text: 'Ich lerne täglich etwas Neues während ich auf die U-Bahn warte. Genial einfach!', emoji: '⭐⭐⭐⭐⭐' },
  { name: 'Sarah K.', text: 'Meine Morgensroutine ist jetzt komplett. Kaffee + Gehirnjogging Quiz = perfekter Start.', emoji: '⭐⭐⭐⭐⭐' },
  { name: 'Tim B.', text: '7 Tage kostenlos – und dann wollte ich gar nicht mehr aufhören. 3€ im Monat sind ein Witz.', emoji: '⭐⭐⭐⭐⭐' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🧠</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Ein neues Quiz täglich –<br />direkt auf WhatsApp
          </h1>
          <p className="text-brand-100 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
            Trainiere deinen Geist mit einer täglichen Quizfrage. Psychologie, Geschichte, Wissenschaft und mehr. Keine App nötig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-4">
              7 Tage kostenlos probieren →
            </Link>
            <a href="#features" className="btn-secondary border-white/30 text-white hover:bg-white/10 text-base px-8 py-4">
              Mehr erfahren
            </a>
          </div>
          <p className="mt-4 text-brand-200 text-sm">Danach nur 2,99€/Monat · Jederzeit kündbar</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">So funktioniert's</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { step: '1', icon: '✍️', title: 'Anmelden', desc: 'Name, E-Mail und WhatsApp-Nummer eingeben. Fertig.' },
              { step: '2', icon: '💳', title: 'Uhrzeit wählen', desc: '7 Tage kostenlos. Dann 2,99€/Monat – kündbar wann du willst.' },
              { step: '3', icon: '📲', title: 'Quiz empfangen', desc: 'Täglich zur gewünschten Uhrzeit landet dein Quiz auf WhatsApp.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center">
                  {item.step}
                </div>
                <div className="text-3xl">{item.icon}</div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Was dich erwartet</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp preview mockup */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">So sieht dein Quiz aus</h2>
          <div className="bg-[#ECE5DD] rounded-2xl p-4 text-left shadow-lg">
            <div className="bg-white rounded-xl p-4 max-w-xs shadow-sm text-sm leading-relaxed">
              <p className="font-bold text-gray-800 mb-2">🧠 Gehirnjogging Quiz</p>
              <p className="text-gray-500 text-xs mb-2">📚 Psychologie</p>
              <p className="text-gray-900 mb-3">Welcher Psychologe entwickelte das Konzept der "erlernten Hilflosigkeit"?</p>
              <p className="text-gray-700">1️⃣ Sigmund Freud</p>
              <p className="text-gray-700">2️⃣ Martin Seligman</p>
              <p className="text-gray-700">3️⃣ Carl Jung</p>
              <p className="text-gray-700">4️⃣ Abraham Maslow</p>
              <p className="text-gray-500 text-xs mt-3">Antworte mit 1, 2, 3 oder 4</p>
              <p className="text-gray-300 text-xs text-right mt-2">09:00 ✓✓</p>
            </div>
            <div className="mt-2 flex justify-end">
              <div className="bg-[#DCF8C6] rounded-xl px-4 py-2 text-sm text-gray-800 shadow-sm">2</div>
            </div>
            <div className="bg-white rounded-xl p-4 max-w-xs shadow-sm text-sm leading-relaxed mt-2">
              <p>✅ <strong>Richtig!</strong> Super gemacht!</p>
              <p className="mt-2">💡 <strong>Erklärung:</strong><br />Martin Seligman entdeckte "erlernte Hilflosigkeit" in Experimenten mit Hunden, die zeigten, dass wiederholte unkontrollierbare negative Erlebnisse zu Passivität führen.</p>
              <p className="mt-2">Bis morgen! 🧠</p>
              <p className="text-gray-300 text-xs text-right mt-2">09:01 ✓✓</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-brand-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Was andere sagen</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card">
                <p className="text-sm mb-1">{t.emoji}</p>
                <p className="text-sm text-gray-700 mb-3 italic">"{t.text}"</p>
                <p className="text-xs font-semibold text-gray-500">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Einfaches Pricing</h2>
          <div className="card border-2 border-brand-300 shadow-md">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Gehirnjogging Premium</h3>
            <div className="text-4xl font-extrabold text-brand-700 my-4">
              2,99€<span className="text-lg font-normal text-gray-400">/Monat</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
              {['Täglich eine Quizfrage auf WhatsApp', 'Wähle deine Wunschuhrzeit', 'Jederzeit pausieren', 'Erklärungen zu jeder Antwort', '7 Tage kostenlos testen'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-brand-500 font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="btn-primary w-full text-base py-4">
              Jetzt 7 Tage kostenlos starten
            </Link>
            <p className="text-xs text-gray-400 mt-3">Keine Kreditkarte für die Testphase nötig. Danach 2,99€/Monat, jederzeit kündbar.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-brand-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Bereit für täglich neues Wissen?</h2>
        <p className="text-brand-200 mb-8">Starte heute mit 7 Tagen kostenlos.</p>
        <Link to="/signup" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-lg px-10 py-4">
          Kostenlos starten →
        </Link>
      </section>

      <Footer />
    </div>
  );
}
