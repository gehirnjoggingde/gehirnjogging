import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/Header';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

/* ── Scroll Progress Bar ─────────────────────────────────── */
function ScrollProgress() {
  const barRef = useRef(null);
  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
      if (barRef.current) barRef.current.style.width = pct + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div ref={barRef} className="scroll-progress" style={{ width: '0%' }} />;
}

/* ── SVG Wave Divider ────────────────────────────────────── */
function Wave({ topColor = '#ffffff', bottomColor = '#f9fafb', flip = false }) {
  return (
    <div className="wave-divider" style={{ background: topColor }}>
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ height: 56, transform: flip ? 'scaleY(-1)' : 'none' }}>
        <path d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z" fill={bottomColor} />
      </svg>
    </div>
  );
}

/* ── Animated Counter ────────────────────────────────────── */
function Counter({ to, suffix = '', duration = 1500 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 4);
          setVal(Math.round(ease * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (el) io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref} className="counter-num">{val.toLocaleString('de-DE')}{suffix}</span>;
}

/* ── Magnetic Button ─────────────────────────────────────── */
function MagneticLink({ to, children, className }) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) * 0.35;
    const dy = (e.clientY - r.top - r.height / 2) * 0.35;
    gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
  }, []);
  const onLeave = useCallback(() => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' });
  }, []);
  return (
    <Link ref={ref} to={to} className={`magnetic ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </Link>
  );
}

/* ── 3D Tilt Card ────────────────────────────────────────── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const cur = useRef({ rx: 0, ry: 0 });
  const tar = useRef({ rx: 0, ry: 0 });

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    tar.current.ry = ((e.clientX - r.left) / r.width  - 0.5) * 18;
    tar.current.rx = ((e.clientY - r.top)  / r.height - 0.5) * -14;
    if (!raf.current) {
      const loop = () => {
        cur.current.rx += (tar.current.rx - cur.current.rx) * 0.12;
        cur.current.ry += (tar.current.ry - cur.current.ry) * 0.12;
        el.style.transform = `perspective(800px) rotateX(${cur.current.rx}deg) rotateY(${cur.current.ry}deg)`;
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    }
  }, []);
  const onLeave = useCallback(() => {
    tar.current = { rx: 0, ry: 0 };
    setTimeout(() => {
      cancelAnimationFrame(raf.current);
      raf.current = null;
      if (ref.current) ref.current.style.transform = '';
    }, 600);
  }, []);

  return (
    <div ref={ref} className={`tilt-wrap ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

/* ── Spotlight Feature Card ──────────────────────────────── */
function SpotlightCard({ icon, title, desc }) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
  return (
    <div ref={ref} className="spotlight-card rounded-2xl p-6 h-full cursor-default" onMouseMove={onMove}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── FAQ Item ────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (open) {
      el.style.maxHeight = el.scrollHeight + 'px';
    } else {
      el.style.maxHeight = '0';
    }
  }, [open]);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{q}</span>
        <span className={`faq-icon text-brand-500 text-2xl font-light flex-shrink-0 ${open ? 'open' : ''}`}>+</span>
      </button>
      <div ref={bodyRef} className={`faq-body ${open ? 'open' : ''}`}>
        <p className="text-gray-500 text-sm leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  );
}

/* ── Animated Chat (reused + enhanced) ──────────────────── */
function AnimatedChat() {
  return (
    <div className="bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-[290px]">
      <div className="bg-[#202c33] flex items-center gap-3 px-4 py-3">
        <img src="/logo.png" alt="" className="h-8 w-8 rounded-full object-contain bg-white/10 p-1" />
        <div>
          <p className="text-white text-sm font-semibold leading-none">Gehirnjogging</p>
          <p className="text-green-400 text-xs mt-0.5">● online</p>
        </div>
      </div>
      <div className="p-3 space-y-2 bg-[#0b141a] min-h-[300px]">
        <div className="chat-bubble-in chat-delay-1 opacity-0 max-w-[92%]">
          <div className="bg-[#202c33] rounded-2xl rounded-tl-sm p-3 text-white text-xs leading-relaxed">
            <p className="font-bold text-cyan-400 text-[11px] mb-1">🧠 Gehirnjogging Quiz</p>
            <p className="text-gray-400 text-[10px] mb-1.5">📚 Psychologie</p>
            <p className="mb-2 text-[12px] leading-snug font-medium">
              Welches Experiment bewies, dass Gehorsam wichtiger ist als Moral?
            </p>
            <div className="space-y-0.5 text-gray-300 text-[11px]">
              <p>1️⃣ Stanford-Gefängnisexperiment</p>
              <p>2️⃣ Milgram-Experiment</p>
              <p>3️⃣ Hawthorne-Experiment</p>
              <p>4️⃣ Asch-Konformitätsstudie</p>
            </div>
          </div>
        </div>
        <div className="chat-bubble-out chat-delay-2 opacity-0 flex justify-end">
          <div className="bg-[#005c4b] rounded-2xl rounded-tr-sm px-3 py-2">
            <span className="text-white text-xs font-medium">2 ✓✓</span>
          </div>
        </div>
        <div className="chat-bubble-in chat-delay-3 opacity-0 max-w-[92%]">
          <div className="bg-[#202c33] rounded-2xl rounded-tl-sm p-3 text-white text-xs leading-relaxed">
            <p className="font-bold mb-1">✅ Richtig!</p>
            <p className="text-gray-300 text-[11px]">💡 65% verabreichten Stromstöße – nur weil eine Autoritätsperson es befahl.</p>
            <p className="mt-1.5 font-medium text-[11px]">Bis morgen! 🧠</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Data ────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '📲', title: 'Direkt auf WhatsApp',    desc: 'Keine App, kein Login. Dein Quiz kommt dorthin, wo du sowieso bist.' },
  { icon: '🎯', title: 'Anzahl wählbar',          desc: 'Bis zu 5 Fragen täglich – du entscheidest wie intensiv du trainierst.' },
  { icon: '📚', title: 'Deine Kategorie',         desc: 'Wähle aus 8 Themen was dich wirklich interessiert.' },
  { icon: '🏋️', title: 'Schwierigkeitsgrad',     desc: 'Leicht, Mittel oder Schwer – du bestimmst wie sehr dein Gehirn gefordert wird.' },
  { icon: '💡', title: 'Mit Erklärung',           desc: 'Nicht nur richtig oder falsch – du verstehst auch warum.' },
  { icon: '📊', title: 'Wöchentlicher Score',     desc: 'Jeden Sonntag deine Wochenbilanz direkt auf WhatsApp.' },
];

const CATEGORIES = [
  { icon: '🌍', name: 'Allgemeinwissen', color: 'bg-blue-50   text-blue-700   border-blue-200' },
  { icon: '🧠', name: 'Psychologie',     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { icon: '📜', name: 'Geschichte',      color: 'bg-amber-50  text-amber-700  border-amber-200' },
  { icon: '🔬', name: 'Wissenschaft',    color: 'bg-green-50  text-green-700  border-green-200' },
  { icon: '💡', name: 'Philosophie',     color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { icon: '💰', name: 'Wirtschaft',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { icon: '🌿', name: 'Natur & Umwelt',  color: 'bg-lime-50   text-lime-700   border-lime-200' },
  { icon: '🎬', name: 'Kultur & Medien', color: 'bg-rose-50   text-rose-700   border-rose-200' },
];

const STEPS = [
  { n: '1', icon: '✍️', title: 'Registrieren',         desc: 'Name, E-Mail und WhatsApp-Nummer – in 2 Minuten fertig.' },
  { n: '2', icon: '⚙️', title: 'Personalisieren',       desc: 'Wähle Kategorie, Schwierigkeit, Uhrzeit und Anzahl der Fragen.' },
  { n: '3', icon: '📩', title: 'Täglich klüger werden', desc: 'Dein Quiz landet pünktlich im Chat – einfach antworten und lernen.' },
];

const TESTIMONIALS = [
  { name: 'Markus R.', role: 'Ingenieur, 38', stars: 5, text: 'Nach 6 Wochen kenne ich beim Pub Quiz fast alle Antworten. Meine Kollegen fragen mich schon wie ich das mache. Ich sag: WhatsApp.' },
  { name: 'Sarah K.',  role: 'Lehrerin, 31',  stars: 5, text: 'Ich hab 3 Lern-Apps versucht – alle nach 2 Wochen aufgehört. Gehirnjogging nutze ich seit 4 Monaten täglich. Weil es einfach kommt, ohne dass ich dran denken muss.' },
  { name: 'Tim B.',    role: 'Student, 24',   stars: 5, text: '7 Tage kostenlos – ich dachte ich höre danach auf. Tat ich nicht. Für 2,99 im Monat ist das honestly das beste was ich abonniert hab.' },
  { name: 'Julia M.',  role: 'Ärztin, 34',    stars: 5, text: 'Zwischen zwei Schichten eine Frage beantworten. Das passt perfekt in meinen Alltag. Ich lerne echte Fakten, nicht irgendwelche sinnlosen Spiele.' },
  { name: 'Felix W.',  role: 'Unternehmer, 42', stars: 5, text: 'Mein Morgenritual: Kaffee, News, Gehirnjogging-Frage. Simpel, scharf, gut.' },
  { name: 'Anna S.',   role: 'Grafikerin, 27', stars: 5, text: 'Der Streak-Counter ist teuflisch gut. Ich kann jetzt nicht aufhören – und das ist positiv gemeint.' },
];

const FAQS = [
  { q: 'Muss ich wirklich jeden Tag antworten?', a: 'Nein. Du kannst Tage überspringen oder dein Abo jederzeit pausieren – ohne Kündigung. Der Streak läuft weiter sobald du wieder mitmachst.' },
  { q: 'Brauche ich eine neue App?', a: 'Nein. Alles läuft direkt über WhatsApp, das du sowieso auf deinem Handy hast. Kein Download, kein Login nach der Registrierung.' },
  { q: 'Was passiert nach den 7 Tagen?', a: 'Du wirst per WhatsApp und E-Mail informiert, bevor der Testzeitraum endet. Nur wenn du nicht kündigst, werden 2,99 €/Monat abgebucht.' },
  { q: 'Werden meine Daten mit WhatsApp geteilt?', a: 'Nein. Wir nutzen deine Nummer ausschließlich um dir die Quiz-Nachrichten zu senden. Keine Weitergabe an Dritte.' },
  { q: 'Kann ich das Abo wirklich mit einem Klick kündigen?', a: 'Ja. Im Dashboard unter Einstellungen → Abo kündigen. Dauert unter 10 Sekunden, keine Kündigungsfrist, sofortige Bestätigung.' },
];

/* ── Page ────────────────────────────────────────────────── */
export default function LandingPageV2() {
  const heroHeadlineRef = useRef(null);
  const heroSubRef      = useRef(null);
  const heroBadgeRef    = useRef(null);
  const heroCtaRef      = useRef(null);

  /* GSAP hero entrance */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(heroBadgeRef.current,    { y: -24, opacity: 0, duration: 0.6 })
        .from(heroHeadlineRef.current.querySelectorAll('.word'), {
          y: 64, opacity: 0, stagger: 0.07, duration: 0.75, ease: 'power4.out'
        }, '-=0.3')
        .from(heroSubRef.current,  { y: 24, opacity: 0, duration: 0.6 }, '-=0.4')
        .from(heroCtaRef.current,  { y: 20, opacity: 0, duration: 0.5 }, '-=0.3');

      /* Parallax orbs on scroll */
      gsap.to('.orb-parallax', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: true },
      });

      /* ScrollTrigger reveals for sections */
      gsap.utils.toArray('.gsap-reveal').forEach((el) => {
        gsap.from(el, {
          y: 50, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      gsap.utils.toArray('.gsap-reveal-left').forEach((el) => {
        gsap.from(el, {
          x: -60, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      gsap.utils.toArray('.gsap-reveal-right').forEach((el) => {
        gsap.from(el, {
          x: 60, opacity: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      /* Spring reveal for pain cards */
      gsap.utils.toArray('.spring-card').forEach((el, i) => {
        gsap.from(el, {
          scale: 0.78, y: 40, opacity: 0,
          duration: 0.9, ease: 'elastic.out(1,0.65)',
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      /* Pricing card 3D flip */
      gsap.from('.pricing-flip', {
        rotateY: 90, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.pricing-flip', start: 'top 80%', once: true },
      });
    });
    return () => ctx.revert();
  }, []);

  /* Split headline into .word spans */
  const headline = 'Werde die klügste Person im Raum.';
  const words = headline.split(' ').map((w, i) => (
    <span key={i} className="word-wrap"><span className="word">{w}&nbsp;</span></span>
  ));

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <ScrollProgress />
      <Header />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero-section relative overflow-hidden bg-gradient-to-br from-navy-950 via-[#0f2744] to-brand-900 animate-gradient text-white">
        {/* Floating orbs */}
        <div className="absolute inset-0 pointer-events-none orb-parallax">
          <div className="orb-a absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-3xl" />
          <div className="orb-b absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="orb-c absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full bg-purple-600/15 blur-3xl" />
          <div className="orb-d absolute top-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-cyan-400/10 blur-2xl" />
          <div className="orb-e absolute -bottom-16 -left-16 w-[350px] h-[350px] rounded-full bg-brand-400/10 blur-3xl" />
          <div className="orb-f absolute top-0 left-1/2 w-[250px] h-[250px] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <div ref={heroBadgeRef} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              7 Tage kostenlos testen
            </div>

            <h1 ref={heroHeadlineRef} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight">
              {words}
              <br />
              <span className="word-wrap">
                <span className="word text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-brand-300 to-brand-400">
                  Per WhatsApp.
                </span>
              </span>
            </h1>

            <p ref={heroSubRef} className="text-gray-300 text-lg sm:text-xl mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Die meisten Leute scrollen morgens 20 Minuten – und lernen nichts.
              Du beantwortest eine Frage auf WhatsApp.{' '}
              <span className="text-white font-semibold">Kein Aufwand. Echter Unterschied.</span>
            </p>

            <div ref={heroCtaRef} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <MagneticLink
                to="/signup"
                className="btn-primary py-4 px-8 text-base bg-brand-500 hover:bg-brand-400 animate-pulse-glow"
              >
                In 2 Minuten starten – keine App nötig →
              </MagneticLink>
              <a href="#wie" className="btn-outline-white py-4 px-8 text-base">Wie funktioniert's?</a>
            </div>
            <p className="mt-4 text-sm text-gray-500">Danach 2,99 €/Monat · Jederzeit kündbar · Kündigung in 10 Sek.</p>
          </div>

          <div className="flex-shrink-0 flex justify-center">
            <TiltCard>
              <AnimatedChat />
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ─────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-4 px-4">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">⭐ <span>4,9/5 von 340+ Nutzern</span></span>
          <span className="hidden sm:block text-gray-200 mx-5">|</span>
          <span className="flex items-center gap-1.5">🔥 <span>Ø 23 Tage Streak</span></span>
          <span className="hidden sm:block text-gray-200 mx-5">|</span>
          <span className="flex items-center gap-1.5">↩️ <span>Kündigung in 10 Sekunden</span></span>
        </div>
      </section>

      {/* ── Metrik Banner ────────────────────────────────── */}
      <section className="mesh-bg bg-navy-950 py-14 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { icon: '🧠', num: 50000, suffix: '+', label: 'Quizfragen gestellt' },
            { icon: '📅', num: 23,    suffix: ' Tage', label: 'Ø Streak aktiver Nutzer' },
            { icon: '⭐', num: 4,     suffix: ',9/5', label: 'Sterne Zufriedenheit' },
            { icon: '⚡', num: 2,     suffix: ' Min', label: 'bis zur ersten Frage' },
          ].map((m) => (
            <div key={m.label} className="gsap-reveal text-white">
              <div className="text-3xl mb-2">{m.icon}</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                <Counter to={m.num} suffix={m.suffix} />
              </div>
              <p className="text-xs text-gray-400 font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Wave topColor="#0f172a" bottomColor="#ffffff" />

      {/* ── Problem Sektion ───────────────────────────────── */}
      <section className="section bg-white">
        <div className="container">
          <div className="gsap-reveal text-center mb-12">
            <span className="inline-block bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Erkennst du dich wieder?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Die meisten wollen mehr lernen.<br /><span className="text-gray-400">Aber der Alltag gewinnt.</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {[
              { icon: '😵', title: 'Keine Zeit', desc: 'Du weißt, dass du mehr lernen solltest – aber findest nie den richtigen Moment.' },
              { icon: '📱', title: 'Apps die keiner nutzt', desc: 'Lern-Apps stauben nach 3 Tagen in der Schublade. Zu viel Aufwand, zu wenig Gewohnheit.' },
              { icon: '🤷', title: 'Vergessen statt Wachsen', desc: 'Du lernst was, vergisst es wieder – weil Wiederholung nie wirklich stattfindet.' },
            ].map((p, i) => (
              <div key={p.title} className={`spring-card rounded-2xl p-6 border-2 ${i === 1 ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="text-4xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="gsap-reveal text-center">
            <p className="text-lg font-semibold text-gray-700">Genau dafür ist Gehirnjogging gebaut. <span className="text-brand-600">Eine Frage. Täglich. Per WhatsApp.</span></p>
          </div>
        </div>
      </section>

      <Wave topColor="#ffffff" bottomColor="#f9fafb" />

      {/* ── Wie funktioniert's ────────────────────────────── */}
      <section id="wie" className="section bg-gray-50">
        <div className="container">
          <div className="gsap-reveal text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Drei Schritte. Das war's.</h2>
            <p className="text-gray-500">Kein Schnickschnack. Einfach anmelden und täglich klüger werden.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`gsap-reveal-${i % 2 === 0 ? 'left' : 'right'} text-center p-6`}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-200">
                  {s.n}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave topColor="#f9fafb" bottomColor="#ffffff" />

      {/* ── Features ─────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container">
          <div className="gsap-reveal text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Alles was du brauchst</h2>
            <p className="text-gray-500">Und nichts was du nicht brauchst.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`gsap-reveal-${i % 2 === 0 ? 'left' : 'right'} h-full`}>
                <SpotlightCard {...f} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave topColor="#ffffff" bottomColor="#f9fafb" />

      {/* ── Kategorien ───────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="gsap-reveal text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Dein Thema, dein Quiz</h2>
            <p className="text-gray-500 max-w-md mx-auto">Wähle die Kategorien die dich interessieren – im Dashboard jederzeit anpassbar.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((c, i) => (
              <div key={c.name} className="gsap-reveal" style={{ transitionDelay: `${i * 40}ms` }}>
                <div className={`flex flex-col items-center text-center p-4 rounded-2xl border h-full ${c.color} hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default`}>
                  <span className="text-3xl mb-2">{c.icon}</span>
                  <p className="font-bold text-[13px] leading-tight">{c.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave topColor="#f9fafb" bottomColor="#ffffff" />

      {/* ── Testimonials Marquee ─────────────────────────── */}
      <section className="section bg-white overflow-hidden">
        <div className="container">
          <div className="gsap-reveal text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Was andere sagen</h2>
            <p className="text-gray-400 text-sm mt-2">340+ zufriedene Nutzer</p>
          </div>
        </div>
        {/* Row 1 — left */}
        <div className="marquee-wrap mb-4">
          <div className="marquee-track flex gap-4" style={{ width: 'max-content' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="w-72 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-2xl p-5 backdrop-blur">
                <div className="text-yellow-400 text-sm mb-2">{'★'.repeat(t.stars)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">„{t.text}"</p>
                <div>
                  <p className="text-xs font-bold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 — right */}
        <div className="marquee-wrap">
          <div className="marquee-track-rev flex gap-4" style={{ width: 'max-content' }}>
            {[...TESTIMONIALS.slice().reverse(), ...TESTIMONIALS.slice().reverse()].map((t, i) => (
              <div key={i} className="w-72 flex-shrink-0 bg-brand-50 border border-brand-100 rounded-2xl p-5">
                <div className="text-yellow-400 text-sm mb-2">{'★'.repeat(t.stars)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">„{t.text}"</p>
                <div>
                  <p className="text-xs font-bold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave topColor="#ffffff" bottomColor="#f9fafb" />

      {/* ── Pricing ──────────────────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="container-sm">
          <div className="gsap-reveal text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Ein Plan. Kein Bullshit.</h2>
            <p className="text-gray-500">☕ Kostet weniger als ein Kaffee pro Monat.</p>
          </div>
          <div className="pricing-flip relative border-2 border-brand-600 rounded-3xl p-8 bg-white shimmer-card" style={{ boxShadow: '0 0 0 4px rgba(37,99,235,0.08), 0 20px 60px rgba(37,99,235,0.15)' }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide whitespace-nowrap">
              MEISTGEBUCHT · 7 TAGE GRATIS
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8 mt-2">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="" className="h-14 w-14 object-contain flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Gehirnjogging Premium</h3>
                  <p className="text-sm text-gray-500">Tägliches WhatsApp Quiz</p>
                </div>
              </div>
              <div className="sm:ml-auto text-left sm:text-right">
                <div className="text-4xl font-extrabold text-gray-900">
                  2,99 €<span className="text-lg font-normal text-gray-400">/Monat</span>
                </div>
                <p className="text-sm text-brand-600 font-semibold mt-0.5">7 Tage kostenlos</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {['1–5 Quizfragen täglich', 'Kategorie frei wählbar',
                'Uhrzeit frei wählbar', 'Jederzeit pausieren & kündigen',
                'Erklärungen zu jeder Antwort', 'Wöchentlicher Score auf WhatsApp'].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <MagneticLink to="/signup" className="btn-primary w-full py-4 text-base justify-center animate-pulse-glow block text-center">
              7 Tage kostenlos starten →
            </MagneticLink>
            <p className="text-xs text-gray-400 text-center mt-3">
              Keine versteckten Kosten · Stripe-gesicherte Zahlung · Kündigung jederzeit
            </p>
          </div>
        </div>
      </section>

      <Wave topColor="#f9fafb" bottomColor="#ffffff" />

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-sm">
          <div className="gsap-reveal text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Häufige Fragen</h2>
            <p className="text-gray-500">Alles was du wissen musst, bevor du startest.</p>
          </div>
          <div className="gsap-reveal bg-gray-50 rounded-3xl px-6 divide-y divide-gray-100">
            {FAQS.map(f => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      <Wave topColor="#ffffff" bottomColor="#0f172a" flip />

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="section mesh-bg bg-navy-950 text-white text-center">
        <div className="container-sm">
          <div className="gsap-reveal">
            <img src="/logo.png" alt="" className="h-16 w-16 object-contain mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Starte heute. Kostenlos.</h2>
            <p className="text-gray-300 mb-8 text-lg">7 Tage testen, dann 2,99 €/Monat. Jederzeit kündbar.</p>
            <MagneticLink to="/signup" className="btn-primary py-4 px-10 text-base bg-brand-500 hover:bg-brand-400 animate-pulse-glow inline-block">
              Jetzt starten →
            </MagneticLink>
            <p className="mt-4 text-xs text-gray-500">340+ Nutzer · Ø 23 Tage Streak · 4,9/5 Sterne</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
