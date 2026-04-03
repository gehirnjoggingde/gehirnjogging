import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Datenschutz() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Datenschutzerklärung</h1>

        <div className="card space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO ist:<br /><br />
              Hannes Herwig<br />
              An der Untergeis 6<br />
              36251 Bad Hersfeld<br />
              E-Mail: <a href="mailto:info@gehirnjogging.de" className="text-brand-600 hover:underline">info@gehirnjogging.de</a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. Welche Daten wir erheben</h2>
            <p>Bei der Registrierung erheben wir folgende Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Vor- und Nachname</li>
              <li>E-Mail-Adresse</li>
              <li>WhatsApp-Telefonnummer</li>
              <li>Gewählte Quiz-Uhrzeit</li>
              <li>Antworten auf Quiz-Fragen (zum Zweck der Auswertung)</li>
            </ul>
            <p className="mt-2">
              Zahlungsdaten (Kreditkartennummer etc.) werden <strong>ausschließlich</strong> von Stripe verarbeitet und niemals auf unseren Servern gespeichert.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. Zweck der Datenverarbeitung</h2>
            <p>Wir verwenden deine Daten ausschließlich für folgende Zwecke:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Versand der täglichen Quiz-Fragen per WhatsApp</li>
              <li>Verwaltung deines Abonnements</li>
              <li>Abrechnung über Stripe</li>
              <li>Kundenkommunikation (Support)</li>
            </ul>
            <p className="mt-2">
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. Drittanbieter</h2>

            <h3 className="font-semibold text-gray-800 mt-3 mb-1">Twilio (WhatsApp-Versand)</h3>
            <p>
              Für den Versand der Quizfragen nutzen wir Twilio Inc., 375 Beale Street, San Francisco, CA 94105, USA. Deine Telefonnummer wird an Twilio übermittelt. Datenschutzrichtlinie: <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">twilio.com/legal/privacy</a>
            </p>

            <h3 className="font-semibold text-gray-800 mt-3 mb-1">Stripe (Zahlungsabwicklung)</h3>
            <p>
              Zahlungen werden über Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland, abgewickelt. Datenschutzrichtlinie: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">stripe.com/de/privacy</a>
            </p>

            <h3 className="font-semibold text-gray-800 mt-3 mb-1">Supabase (Datenbank)</h3>
            <p>
              Daten werden auf Servern von Supabase Inc. gespeichert (Region: EU Frankfurt). Datenschutzrichtlinie: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">supabase.com/privacy</a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. Speicherdauer</h2>
            <p>
              Deine Daten werden gespeichert, solange dein Konto aktiv ist. Nach Kündigung deines Abonnements und auf ausdrücklichen Wunsch löschen wir alle personenbezogenen Daten, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">6. Deine Rechte (DSGVO)</h2>
            <p>Du hast jederzeit das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-2">
              Zur Ausübung deiner Rechte wende dich an: <a href="mailto:info@gehirnjogging.de" className="text-brand-600 hover:underline">info@gehirnjogging.de</a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">7. Beschwerderecht</h2>
            <p>
              Du hast das Recht, dich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren. In Hessen ist dies der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">8. Cookies</h2>
            <p>
              Wir setzen ausschließlich technisch notwendige Cookies ein (Session-Token für die Anmeldung). Es werden keine Tracking- oder Marketing-Cookies verwendet.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">Stand: April 2026</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
