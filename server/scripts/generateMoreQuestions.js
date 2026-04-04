/**
 * Generates ~3000 MORE quiz questions via Claude API.
 * Runs AFTER generateQuestions.js – automatically skips all existing questions.
 * Uses sub-topic rotation to guarantee variety across batches.
 *
 * Run with: node -r dotenv/config scripts/generateMoreQuestions.js
 *
 * 8 categories × 3 difficulties × 5 sub-topic rounds × 25 questions = 3000
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

// 5 different sub-topic angles per category to guarantee variety
const SUBTOPICS = {
  allgemeinwissen: [
    'Geografie, Länder, Hauptstädte, Weltrekorde und internationale Organisationen',
    'Berühmte Persönlichkeiten, Erfinder, Entdecker und Nobelpreisträger',
    'Sport, Olympische Spiele, Weltmeisterschaften und sportliche Rekorde',
    'Sprache, Redewendungen, Etymologie und linguistische Kuriositäten',
    'Alltag, Lebensmittel, Traditionen, Feiertage und Popkultur weltweit',
  ],
  psychologie: [
    'Klassische Experimente: Milgram, Stanford, Asch, Pavlov und ihre Erkenntnisse',
    'Kognitive Verzerrungen, Denkfehler und unbewusste Entscheidungsmuster',
    'Persönlichkeitstheorien, Persönlichkeitsstörungen und Charaktermodelle',
    'Entwicklungspsychologie, Kindheit, Bindungstheorie und Lerntheorien',
    'Sozialpsychologie, Gruppenverhalten, Konformität und soziale Einflüsse',
  ],
  geschichte: [
    'Antike Hochkulturen: Ägypten, Griechenland, Rom, Mesopotamien und China',
    'Mittelalter, Kreuzzüge, Pest, Feudalsystem und europäische Königreiche',
    'Neuzeit: Entdeckungen, Reformation, Absolutismus und Revolutionen',
    'Weltkriege, Kalter Krieg, Holocaust und politische Umbrüche des 20. Jahrhunderts',
    'Deutsche Geschichte, Weimarer Republik, DDR, Wiedervereinigung und Nachkriegszeit',
  ],
  wissenschaft: [
    'Physik: Quantenmechanik, Relativitätstheorie, Thermodynamik und Elektrizität',
    'Chemie: Elemente, Verbindungen, chemische Reaktionen und das Periodensystem',
    'Biologie: Zellen, Genetik, Evolution, Ökosysteme und menschlicher Körper',
    'Astronomie: Planeten, Sterne, Galaxien, Schwarze Löcher und Raumfahrt',
    'Mathematik, Informatik, Erfindungen und technologische Meilensteine',
  ],
  philosophie: [
    'Antike Philosophen: Sokrates, Platon, Aristoteles und ihre Kernthesen',
    'Ethik, Moralphilosophie, Utilitarismus und deontologische Theorien',
    'Erkenntnistheorie, Bewusstsein, freier Wille und Wahrnehmungstheorien',
    'Politische Philosophie: Demokratie, Gerechtigkeit, Freiheit und Gesellschaftsvertrag',
    'Moderne Philosophen: Kant, Nietzsche, Sartre, Wittgenstein und ihre Ideen',
  ],
  wirtschaft: [
    'Volkswirtschaft, Wirtschaftssysteme, Konjunkturzyklen und Makroökonomie',
    'Berühmte Unternehmen, Gründer, Geschäftsmodelle und Innovationen',
    'Finanzwelt: Aktien, Börse, Währungen, Kryptowährungen und Investments',
    'Wirtschaftsgeschichte: Industrialisierung, Weltwirtschaftskrise und Globalisierung',
    'Wirtschaftstheorien, Ökonomen und wirtschaftspolitische Konzepte',
  ],
  natur: [
    'Tiere: Verhalten, Rekorde, Anpassungen und bedrohte Arten',
    'Pflanzen, Pilze, Algen und botanische Besonderheiten weltweit',
    'Ökosysteme, Klimazonen, Biome und Naturphänomene',
    'Geologie, Vulkane, Erdbeben, Mineralien und Erdgeschichte',
    'Klimawandel, Umweltschutz, Artensterben und Naturkatastrophen',
  ],
  kultur: [
    'Weltliteratur, berühmte Autoren, Romane und literarische Epochen',
    'Musik: klassisch, Jazz, Rock, Pop – Bands, Komponisten und Meilensteine',
    'Film, Kino, Oscar-Geschichte, Regisseure und Kultfilme',
    'Bildende Kunst, Kunstbewegungen, Gemälde und berühmte Künstler',
    'Architektur, Design, Modegeschichte und kulturelle Phänomene',
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
      model: 'claude-haiku-4-5-20251001',
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
  const prompt = `Du bist ein Quiz-Generator. Erstelle genau 25 Quizfragen auf Deutsch.

Thema: ${category}
Fokus dieses Batches: ${subtopic}
Schwierigkeit: ${difficulty}/3 – ${DIFFICULTY_DESCRIPTIONS[difficulty]}
Runde: ${round} (alle Fragen müssen einzigartig und neu sein)

Regeln:
- Fakten 100% korrekt und verifizierbar
- 4 Antworten, genau eine richtig
- Falsche Antworten müssen plausibel klingen, nicht offensichtlich falsch
- explanation: 2-4 informative Sätze mit interessantem Hintergrundwissen
- Fragen vielfältig innerhalb des Fokus-Themas
- Keine einfachen "Wer erfand X?" Fragen – lieber unerwartete Fakten

Gib NUR das JSON-Array aus, kein Text davor oder danach, keine Markdown-Codeblöcke:

[{"question":"...","answer_a":"...","answer_b":"...","answer_c":"...","answer_d":"...","correct_answer":"a","explanation":"...","category":"${category}","difficulty_score":${difficulty}},...]`;

  const text = await callClaude(prompt);
  const match = text.match(/\[[\s\S]*\]/);
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
  console.log('8 categories × 3 difficulties × 5 sub-topics × 25 = ~3000 questions\n');

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
        const label = `${category} | d${difficulty}/3 | Runde ${round + 1}/5`;
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
