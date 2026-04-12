/**
 * Generates ~5000 MORE quiz questions via Claude API.
 * Runs AFTER generateQuestions.js – automatically skips all existing questions.
 * Uses sub-topic rotation to guarantee variety across batches.
 *
 * Run with: node -r dotenv/config scripts/generateMoreQuestions.js
 *
 * 8 categories × 3 difficulties × 9 sub-topic rounds × 25 questions = ~5400
 */

require('dotenv').config();
const supabase = require('../services/supabaseClient');

const CATEGORIES = [
  'allgemeinwissen', 'psychologie', 'geschichte', 'wissenschaft',
  'philosophie', 'wirtschaft', 'natur', 'kultur',
];

const DIFFICULTY_DESCRIPTIONS = {
  1: 'leicht – Grundwissen, klare Fakten, die die meisten kennen',
  2: 'mittel – erfordert solides Allgemeinwissen oder Interesse am Thema',
  3: 'schwer – detailliertes Wissen, überraschende Fakten, Expertenniveau',
};

// 9 different sub-topic angles per category – guarantees variety across all batches
const SUBTOPICS = {
  allgemeinwissen: [
    'Geografie: Länder, Hauptstädte, Flüsse, Gebirge und geografische Rekorde',
    'Berühmte Persönlichkeiten: Erfinder, Entdecker, Nobelpreisträger und Pioniere',
    'Sport: Olympische Spiele, Weltmeisterschaften, Rekorde und Sportgeschichte',
    'Sprache, Etymologie, Redewendungen und linguistische Kuriositäten',
    'Essen & Trinken: Lebensmittel, Küchen der Welt, Ursprünge und Rekorde',
    'Technik & Alltagsgegenstände: Erfindungen, wie Dinge funktionieren',
    'Tiere & Natur im Alltag: Haustiere, häufige Tiere, Naturphänomene',
    'Zahlen & Fakten: Weltrekorde, Statistiken, erstaunliche Zahlen',
    'Internationale Organisationen, Flaggen, Symbole und Abkommen',
  ],
  psychologie: [
    'Klassische Experimente: Milgram, Stanford, Asch, Hawthorne und ihre Erkenntnisse',
    'Kognitive Verzerrungen Teil 1: Bestätigungsfehler, Dunning-Kruger, Ankereffekt',
    'Kognitive Verzerrungen Teil 2: Survivorship Bias, IKEA-Effekt, Halo-Effekt',
    'Persönlichkeitstheorien: Big Five, MBTI, Freud, Jung und Adler',
    'Entwicklungspsychologie: Piaget, Erikson, Bindungstheorie und Kindheitsphasen',
    'Sozialpsychologie: Konformität, Gehorsam, Gruppendynamik und soziale Rollen',
    'Klinische Psychologie: Störungsbilder, Therapieformen und Diagnosekriterien',
    'Wahrnehmung, Gedächtnis, Aufmerksamkeit und neurowissenschaftliche Grundlagen',
    'Motivation, Emotionen, Glücksforschung und positive Psychologie',
  ],
  geschichte: [
    'Antike: Ägypten, Mesopotamien, Griechenland und das Römische Reich',
    'Mittelalter: Kreuzzüge, Pest, Feudalismus und Kirche',
    'Entdeckungszeitalter: Kolumbus, Magellan, Kolonialismus und Handelsrouten',
    'Revolutionen: Französisch, Amerikanisch, Industriell und ihre Folgen',
    'Erster Weltkrieg: Ursachen, Schlachten, Folgen und Versailler Vertrag',
    'Zweiter Weltkrieg: Hitler, Holocaust, Schlachten und Kriegsende',
    'Kalter Krieg: USA vs UdSSR, Kubakrise, Rüstungswettlauf, Mauerfall',
    'Deutsche Geschichte: Kaiserreich, Weimarer Republik, DDR, Wiedervereinigung',
    'Weltgeschichte 21. Jahrhundert: 9/11, Arabischer Frühling, moderne Konflikte',
  ],
  wissenschaft: [
    'Physik: Mechanik, Gravitation, Relativitätstheorie und Quantenmechanik',
    'Elektrizität, Magnetismus, Optik und Wellenphysik',
    'Chemie: Atome, Elemente, Periodensystem und chemische Bindungen',
    'Chemische Reaktionen, Säuren, Basen und organische Chemie',
    'Biologie: Zellen, DNA, Genetik und Vererbung',
    'Evolution, Ökologie, Ökosysteme und Artenvielfalt',
    'Menschlicher Körper: Organe, Gehirn, Immunsystem und Medizin',
    'Astronomie: Sonnensystem, Sterne, Galaxien und Kosmologie',
    'Technologie: Computer, KI, Quantencomputing und technologische Meilensteine',
  ],
  philosophie: [
    'Vorsokratiker, Sokrates, Platon und die platonische Akademie',
    'Aristoteles: Logik, Ethik, Politik und Metaphysik',
    'Stoizismus, Epikureismus, Skeptizismus und hellenistische Philosophie',
    'Aufklärung: Kant, Locke, Rousseau, Voltaire und ihre Kernideen',
    'Existentialismus: Kierkegaard, Sartre, Camus, de Beauvoir',
    'Ethik: Utilitarismus, Deontologie, Tugendethik und angewandte Ethik',
    'Erkenntnistheorie, Logik, Sprachphilosophie und Wittgenstein',
    'Politische Philosophie: Hobbes, Marx, Rawls und Gesellschaftsvertrag',
    'Nietzsche, Schopenhauer, Hegel und deutsche Idealisten',
  ],
  wirtschaft: [
    'Mikroökonomie: Angebot, Nachfrage, Märkte und Preisbildung',
    'Makroökonomie: BIP, Inflation, Arbeitslosigkeit und Konjunktur',
    'Wirtschaftsgeschichte: Industrialisierung, Weltwirtschaftskrise, Bretton Woods',
    'Berühmte Investoren: Buffett, Soros, Dalio und ihre Strategien',
    'Technologieunternehmen: Apple, Google, Amazon – Gründer und Meilensteine',
    'Finanzmärkte: Aktien, Anleihen, Derivate und Börsengeschichte',
    'Wirtschaftstheorien: Smith, Keynes, Hayek, Friedman und ihre Modelle',
    'Globalisierung, Welthandel, WTO, IWF und internationale Wirtschaft',
    'Startups, Unternehmertum, Disruption und Geschäftsmodelle',
  ],
  natur: [
    'Säugetiere: Verhalten, Rekorde, Anpassungen und Besonderheiten',
    'Vögel, Reptilien, Amphibien und ihre einzigartigen Eigenschaften',
    'Meerestiere: Wale, Haie, Tintenfische und Tiefseebewohner',
    'Insekten, Spinnen und Gliederfüßer – Fakten und Rekorde',
    'Tropischer Regenwald, Savanne, Wüste und Polargebiete als Lebensräume',
    'Bäume, Pflanzen, Pilze und ihre erstaunlichen Eigenschaften',
    'Geologie: Vulkane, Erdbeben, Gesteinsarten und Erdgeschichte',
    'Wetter, Klima, Naturkatastrophen und atmosphärische Phänomene',
    'Umweltschutz, bedrohte Arten, Artensterben und Naturschutzgebiete',
  ],
  kultur: [
    'Deutsche Literatur: Goethe, Schiller, Kafka, Brecht und Klassiker',
    'Weltliteratur: Shakespeare, Tolstoi, Dostojewski, Proust und Nobelpreisträger',
    'Klassische Musik: Bach, Mozart, Beethoven, Wagner und Komponisten',
    'Pop & Rock: Beatles, Rolling Stones, Michael Jackson, Madonna und Meilensteine',
    'Filmgeschichte: Stummfilm, Hollywood, Neue Welle und Meisterwerke',
    'Bildende Kunst: Renaissance, Impressionismus, Surrealismus und moderne Kunst',
    'Architektur: antike Bauwerke, Gotik, Bauhaus und zeitgenössische Ikonen',
    'Theater, Oper, Ballett und darstellende Künste weltweit',
    'Videospiele, Comics, Manga und moderne Popkulturphänomene',
  ],
};

async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.content[0].text;
}

async function generateBatch(category, difficulty, subtopic, round) {
  const prompt = `Du bist ein präziser Quizfragen-Redakteur. Erstelle genau 25 Quizfragen auf Deutsch.

Thema: ${category}
Fokus: ${subtopic}
Schwierigkeit: ${difficulty}/3 – ${DIFFICULTY_DESCRIPTIONS[difficulty]}
Runde: ${round}

QUALITÄTSREGELN – diese sind nicht verhandelbar:
1. FAKTEN: Jede Aussage muss eindeutig wahr und allgemein anerkannt sein. Keine umstrittenen oder unsicheren Fakten. Wenn du dir nicht 100% sicher bist – lass die Frage weg und erstelle eine andere.
2. RICHTIGE ANTWORT: Muss eindeutig und unbestreitbar korrekt sein. Kein Interpretationsspielraum.
3. FALSCHE ANTWORTEN: Plausibel, aber klar falsch für jemanden der es weiß. Nicht absurd.
4. ERKLÄRUNG: Muss mit der richtigen Antwort übereinstimmen und sie begründen. Die Erklärung darf NICHT widersprüchlich zur richtigen Antwort sein. 2-3 präzise Sätze.
5. KEINE Fragen über sehr aktuelle Ereignisse (nach 2023) oder sehr spezifische lokale Fakten.
6. KEINE Fragen wo mehrere Antworten gleichzeitig richtig sein könnten.

Gib NUR das JSON-Array aus, kein Text davor oder danach, keine Markdown-Codeblöcke:

[{"question":"...","answer_a":"...","answer_b":"...","answer_c":"...","answer_d":"...","correct_answer":"a","explanation":"...","category":"${category}","difficulty_score":${difficulty}},...]`;

  const text = await callClaude(prompt);
  // Strip markdown code blocks if present
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('\n--- RAW RESPONSE (first 300 chars) ---\n', text.slice(0, 300));
    throw new Error(`No JSON array found`);
  }
  return JSON.parse(match[0]);
}

async function getExistingQuestions() {
  const { data } = await supabase.from('quiz_questions').select('question');
  return new Set((data || []).map(q => q.question.toLowerCase().trim()));
}

async function insertQuestions(questions) {
  const rows = questions.map(q => ({
    question: q.question.trim(),
    answer_a: q.answer_a.trim(),
    answer_b: q.answer_b.trim(),
    answer_c: q.answer_c.trim(),
    answer_d: q.answer_d.trim(),
    correct_answer: q.correct_answer.toLowerCase().trim(),
    explanation: q.explanation.trim(),
    category: q.category,
    difficulty_score: q.difficulty_score,
    difficulty: ['', 'leicht', 'mittel', 'schwer'][q.difficulty_score] || 'mittel',
  }));
  const { error } = await supabase.from('quiz_questions').insert(rows);
  if (error) throw new Error(`Insert error: ${error.message}`);
  return rows.length;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🧠 Gehirnjogging – Weitere Fragen Generator');
  console.log('=============================================');
  console.log('8 categories × 3 difficulties × 9 sub-topics × 25 = ~5400 questions\n');

  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY not set'); process.exit(1);
  }

  const existingQuestions = await getExistingQuestions();
  console.log(`📚 ${existingQuestions.size} existing questions loaded – these will be skipped\n`);

  let totalInserted = 0, totalSkipped = 0, totalErrors = 0;

  for (const category of CATEGORIES) {
    for (let difficulty = 1; difficulty <= 3; difficulty++) {
      const subtopics = SUBTOPICS[category];

      for (let round = 0; round < subtopics.length; round++) {
        const subtopic = subtopics[round];
        const label = `${category} | d${difficulty}/3 | Runde ${round + 1}/9`;
        process.stdout.write(`⏳ ${label} ... `);

        try {
          const questions = await generateBatch(category, difficulty, subtopic, round + 1);

          // Deduplicate against existing + current run
          const newQ = questions.filter(q => {
            const key = q.question.toLowerCase().trim();
            if (existingQuestions.has(key)) return false;
            existingQuestions.add(key);
            return true;
          });

          // Validate
          const valid = newQ.filter(q =>
            q.question && q.answer_a && q.answer_b && q.answer_c && q.answer_d &&
            ['a','b','c','d'].includes(q.correct_answer?.toLowerCase()) &&
            q.explanation && q.explanation.length > 60
          );

          const skipped = questions.length - valid.length;
          totalSkipped += skipped;

          if (valid.length > 0) {
            const n = await insertQuestions(valid);
            totalInserted += n;
            console.log(`✅ ${n} inserted${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
          } else {
            console.log(`⚠️  All filtered out`);
          }
        } catch (err) {
          console.log(`❌ ${err.message}`);
          totalErrors++;
        }

        await sleep(1500);
      }
    }
  }

  console.log('\n=============================================');
  console.log(`✅ Done! Inserted: ${totalInserted} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
  console.log(`📚 Total in DB now: ${existingQuestions.size}`);
  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
