/**
 * Generates ~1000 quiz questions via Claude API and inserts them into Supabase.
 * Run with: node -r dotenv/config server/scripts/generateQuestions.js
 *
 * Generates: 8 categories × 5 difficulty levels × 25 questions = 1000 questions
 */

require('dotenv').config();
const supabase = require('../services/supabaseClient');

const CATEGORIES = [
  'allgemeinwissen',
  'psychologie',
  'geschichte',
  'wissenschaft',
  'philosophie',
  'wirtschaft',
  'natur',
  'kultur',
];

const DIFFICULTY_DESCRIPTIONS = {
  1: 'leicht – Grundwissen, das die meisten kennen, klare Fakten',
  2: 'mittel – erfordert solides Allgemeinwissen oder Interesse am Thema',
  3: 'schwer – detailliertes Wissen, überraschende oder unbekannte Fakten, Expertenniveau',
};

const CATEGORY_CONTEXT = {
  allgemeinwissen: 'allgemeines Wissen über die Welt, Geografie, berühmte Persönlichkeiten, Sport, Kultur',
  psychologie: 'Psychologie, menschliches Verhalten, Experimente, kognitive Verzerrungen, Emotionen, Persönlichkeit',
  geschichte: 'Weltgeschichte, historische Ereignisse, Epochen, Herrscher, Kriege, Entdeckungen',
  wissenschaft: 'Physik, Chemie, Biologie, Astronomie, Mathematik, Entdeckungen und Erfindungen',
  philosophie: 'Philosophie, Denker, ethische Fragen, Erkenntnistheorie, Logik, Lebensweisheit',
  wirtschaft: 'Wirtschaft, Unternehmen, Finanzen, Märkte, berühmte Ökonomen, wirtschaftliche Konzepte',
  natur: 'Tiere, Pflanzen, Ökosysteme, Klimazonen, Naturphänomene, Artenvielfalt',
  kultur: 'Film, Musik, Literatur, Kunst, Medien, Popkultur, berühmte Werke und Künstler',
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
  const text = data.content[0].text;
  return text;
}

async function generateBatch(category, difficulty, batchNum) {
  const prompt = `Du bist ein Quiz-Generator. Erstelle genau 25 Quizfragen auf Deutsch.

Thema: ${category} (${CATEGORY_CONTEXT[category]})
Schwierigkeit: ${difficulty}/5 – ${DIFFICULTY_DESCRIPTIONS[difficulty]}
Batch: ${batchNum} (Fragen müssen einzigartig sein)

Regeln:
- Fakten 100% korrekt
- 4 Antworten, genau eine richtig
- Falsche Antworten plausibel, nicht offensichtlich
- explanation: 2-3 informative Sätze mit Hintergrundwissen
- Vielfältige Aspekte des Themas abdecken

Gib NUR das JSON-Array aus, kein Text davor oder danach, keine Markdown-Codeblöcke:

[{"question":"...","answer_a":"...","answer_b":"...","answer_c":"...","answer_d":"...","correct_answer":"a","explanation":"...","category":"${category}","difficulty_score":${difficulty}},...]`;

  const text = await callClaude(prompt);

  // Extract JSON array
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('\n--- RAW RESPONSE ---\n', text.slice(0, 500), '\n---');
    throw new Error(`No JSON array found in response for ${category} d${difficulty}`);
  }

  const questions = JSON.parse(match[0]);
  return questions;
}

async function getExistingQuestions() {
  const { data } = await supabase
    .from('quiz_questions')
    .select('question');
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
  console.log('🧠 Gehirnjogging Question Generator');
  console.log('=====================================');
  console.log(`Generating questions for ${CATEGORIES.length} categories × 3 difficulties × 25 = ~600 questions\n`);

  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY not set in .env');
    process.exit(1);
  }

  const existingQuestions = await getExistingQuestions();
  console.log(`📚 Found ${existingQuestions.size} existing questions in database\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const category of CATEGORIES) {
    for (let difficulty = 1; difficulty <= 3; difficulty++) {
      const label = `${category} (Schwierigkeit ${difficulty}/5)`;
      process.stdout.write(`⏳ Generating: ${label} ... `);

      try {
        const questions = await generateBatch(category, difficulty, difficulty);

        // Filter duplicates
        const newQuestions = questions.filter(q => {
          const key = q.question.toLowerCase().trim();
          if (existingQuestions.has(key)) return false;
          existingQuestions.add(key); // add to set to avoid duplicates within this run
          return true;
        });

        // Validate
        const valid = newQuestions.filter(q =>
          q.question && q.answer_a && q.answer_b && q.answer_c && q.answer_d &&
          ['a', 'b', 'c', 'd'].includes(q.correct_answer?.toLowerCase()) &&
          q.explanation && q.explanation.length > 50
        );

        const skipped = questions.length - valid.length;
        totalSkipped += skipped;

        if (valid.length > 0) {
          const inserted = await insertQuestions(valid);
          totalInserted += inserted;
          console.log(`✅ ${inserted} inserted${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
        } else {
          console.log(`⚠️  All skipped (duplicates or invalid)`);
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
        totalErrors++;
      }

      // Rate limit: 1.5s between calls
      await sleep(1500);
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Done! Inserted: ${totalInserted} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
  console.log(`📚 Total questions in DB: ${existingQuestions.size}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
