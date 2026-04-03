import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AGB() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen</h1>

        <div className="card space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. Anbieter und Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung des Dienstes „Gehirnjogging" (im Folgenden „Dienst"), betrieben von:
            </p>
            <p className="mt-2">
              Hannes Herwig<br />
              An der Untergeis 6<br />
              36251 Bad Hersfeld<br />
              E-Mail: <a href="mailto:info@gehirnjogging.de" className="text-brand-600 hover:underline">info@gehirnjogging.de</a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. Leistungsbeschreibung</h2>
            <p>
              Gehirnjogging ist ein abonnementbasierter Dienst, der Nutzern täglich eine Quizfrage per WhatsApp-Nachricht zusendet. Die Quizfragen stammen aus verschiedenen Kategorien (Psychologie, Geschichte, Wissenschaft, Philosophie, Allgemeinwissen).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. Vertragsschluss und Registrierung</h2>
            <p>
              Der Vertrag kommt zustande, wenn der Nutzer das Registrierungsformular ausfüllt, die AGB akzeptiert und den Bestellvorgang abschließt. Der Nutzer erhält eine Bestätigung per E-Mail.
            </p>
            <p className="mt-2">
              Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und seine Kontaktdaten aktuell zu halten.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. Probezeitraum und Preise</h2>
            <p>
              Neue Nutzer erhalten einen kostenlosen Probezeitraum von <strong>7 Tagen</strong>. Nach Ablauf des Probezeitraums wird das Abonnement automatisch zum Preis von <strong>2,99 € pro Monat</strong> verlängert, sofern nicht vorher gekündigt wird.
            </p>
            <p className="mt-2">
              Alle Preise sind Endpreise. Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. Zahlung</h2>
            <p>
              Die Zahlung erfolgt monatlich im Voraus über den Zahlungsdienstleister Stripe. Akzeptierte Zahlungsmittel sind Kreditkarte, SEPA-Lastschrift und weitere von Stripe unterstützte Methoden.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">6. Kündigung</h2>
            <p>
              Das Abonnement kann jederzeit mit Wirkung zum Ende des aktuellen Abrechnungszeitraums gekündigt werden. Die Kündigung kann im Dashboard unter „Einstellungen → Abonnement kündigen" oder per E-Mail an <a href="mailto:info@gehirnjogging.de" className="text-brand-600 hover:underline">info@gehirnjogging.de</a> erfolgen.
            </p>
            <p className="mt-2">
              Nach Kündigung endet der Zugang zum Dienst mit dem Ende des bezahlten Zeitraums. Es erfolgt keine Erstattung für bereits bezahlte Zeiträume.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">7. Widerrufsrecht</h2>
            <p>
              Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu. Da es sich um digitale Inhalte handelt, die sofort zugänglich gemacht werden, erlischt das Widerrufsrecht mit Beginn der Leistungserbringung, wenn der Nutzer ausdrücklich zugestimmt hat, dass die Leistung vor Ablauf der Widerrufsfrist beginnt, und seine Kenntnis bestätigt hat, dass er dadurch sein Widerrufsrecht verliert.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">8. Verfügbarkeit</h2>
            <p>
              Wir bemühen uns um eine hohe Verfügbarkeit des Dienstes, können diese aber nicht garantieren. Technisch bedingte Ausfälle, insbesondere durch Drittanbieter (WhatsApp/Twilio), berechtigen nicht zu einer Minderung des Entgelts, sofern diese außerhalb unseres Einflussbereichs liegen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">9. Haftungsbeschränkung</h2>
            <p>
              Wir haften nur für Schäden, die auf Vorsatz oder grober Fahrlässigkeit beruhen. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit keine wesentlichen Vertragspflichten verletzt werden.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">10. Nutzerpflichten</h2>
            <p>Der Nutzer verpflichtet sich, den Dienst nicht missbräuchlich zu nutzen und keine automatisierten Anfragen an den Dienst zu senden.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">11. Änderungen der AGB</h2>
            <p>
              Wir behalten uns vor, diese AGB zu ändern. Änderungen werden dem Nutzer per E-Mail mindestens 4 Wochen vor Inkrafttreten mitgeteilt. Widerspricht der Nutzer nicht innerhalb dieser Frist, gelten die neuen AGB als akzeptiert.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">12. Anwendbares Recht und Gerichtsstand</h2>
            <p>
              Es gilt deutsches Recht. Gerichtsstand ist, soweit gesetzlich zulässig, Bad Hersfeld.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">Stand: April 2026</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
