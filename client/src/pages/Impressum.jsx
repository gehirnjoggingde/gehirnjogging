import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Impressum() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Impressum</h1>

        <div className="card space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Angaben gemäß § 5 TMG</h2>
            <p>
              Hannes Herwig<br />
              An der Untergeis 6<br />
              36251 Bad Hersfeld<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Kontakt</h2>
            <p>
              E-Mail: <a href="mailto:info@gehirnjogging.de" className="text-brand-600 hover:underline">info@gehirnjogging.de</a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Umsatzsteuer</h2>
            <p>
              Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)</h2>
            <p>
              Hannes Herwig<br />
              An der Untergeis 6<br />
              36251 Bad Hersfeld
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
