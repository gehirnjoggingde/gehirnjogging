/**
 * reviewQuestions.js
 *
 * Reviews every question in the DB with Claude Sonnet.
 * For each question it checks:
 *   - Is the correct answer actually correct?
 *   - Does the explanation match the correct answer (no contradictions)?
 *   - Are the wrong answers clearly wrong?
 *   - Is the question unambiguous?
 *
 * Actions:
 *   "ok"     → keep as-is
 *   "fix"    → update with corrected fields
 *   "delete" → remove from DB
 *
 * Run: node -r dotenv/config scripts/reviewQuestions.js
 *
 * Results are also written to review_results.json for inspection.
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const supabase = require('../services/supabaseClient');

const BATCH_SIZE  = 15;   // questions per Claude call
const SLEEP_MS    = 1200; // pause between API calls

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

function buildPrompt(questions) {
  return `Du bist ein strenger Fakten-Checker für ein deutsches Quizspiel. Überprüfe diese ${questions.length} Quizfragen.

Für jede Frage prüfe:
1. Ist die als "correct_answer" markierte Antwort (a/b/c/d) tatsächlich die einzig richtige?
2. Stimmt die "explanation" mit der richtigen Antwort überein? Widerspricht sie ihr?
3. Sind die drei falschen Antworten tatsächlich falsch?
4. Ist die Frage eindeutig (könnte nicht auch eine andere Antwort richtig sein)?

Entscheide für jede Frage:
- "ok"     → alles korrekt, keine Änderung nötig
- "fix"    → etwas ist falsch/irreführend, gib das korrigierte Objekt an (nur geänderte Felder + id)
- "delete" → die Frage ist fundamental falsch, mehrdeutig oder die richtige Antwort ist zweifelhaft

Sei STRENG. Lieber löschen als eine falsche Frage behalten.
Bei "fix": Wenn die richtige Antwort falsch ist, korrigiere correct_answer UND explanation.
Bei Erklärungen die der richtigen Antwort widersprechen: immer "fix" oder "delete".

Fragen:
${JSON.stringify(questions.map(q => ({
  id: q.id,
  question: q.question,
  answer_a: q.answer_a,
  answer_b: q.answer_b,
  answer_c: q.answer_c,
  answer_d: q.answer_d,
  correct_answer: q.correct_answer,
  explanation: q.explanation,
  category: q.category,
})), null, 2)}

Antworte NUR mit einem JSON-Array, kein Text davor oder danach:
[
  {"id": "uuid", "action": "ok"},
  {"id": "uuid", "action": "fix", "reason": "...", "correct_answer": "b", "explanation": "korrigierte Erklärung..."},
  {"id": "uuid", "action": "delete", "reason": "..."}
]`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Gehirnjogging – Fragen-Review');
  console.log('=================================');

  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY not set'); process.exit(1);
  }

  // Fetch all questions
  const { data: allQuestions, error } = await supabase
    .from('quiz_questions')
    .select('id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, category, difficulty_score')
    .order('category', { ascending: true });

  if (error) { console.error('DB error:', error); process.exit(1); }

  console.log(`📚 ${allQuestions.length} Fragen geladen\n`);

  const results = { ok: 0, fixed: 0, deleted: 0, errors: 0, details: [] };

  // Process in batches
  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allQuestions.length / BATCH_SIZE);

    process.stdout.write(`⏳ Batch ${batchNum}/${totalBatches} (${batch[0].category}) ... `);

    try {
      const raw = await callClaude(buildPrompt(batch));

      // Extract JSON array
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON array in response');

      const decisions = JSON.parse(match[0]);

      let batchOk = 0, batchFixed = 0, batchDeleted = 0;

      for (const decision of decisions) {
        if (!decision.id || !decision.action) continue;

        results.details.push(decision);

        if (decision.action === 'ok') {
          batchOk++;
          results.ok++;

        } else if (decision.action === 'fix') {
          // Build update object from whichever fields were provided
          const update = {};
          if (decision.correct_answer) update.correct_answer = decision.correct_answer.toLowerCase().trim();
          if (decision.explanation)    update.explanation    = decision.explanation.trim();
          if (decision.question)       update.question       = decision.question.trim();
          if (decision.answer_a)       update.answer_a       = decision.answer_a.trim();
          if (decision.answer_b)       update.answer_b       = decision.answer_b.trim();
          if (decision.answer_c)       update.answer_c       = decision.answer_c.trim();
          if (decision.answer_d)       update.answer_d       = decision.answer_d.trim();

          if (Object.keys(update).length > 0) {
            const { error: upErr } = await supabase
              .from('quiz_questions')
              .update(update)
              .eq('id', decision.id);
            if (upErr) {
              console.error(`\n  ⚠️  Update failed for ${decision.id}:`, upErr.message);
            } else {
              batchFixed++;
              results.fixed++;
            }
          }

        } else if (decision.action === 'delete') {
          const { error: delErr } = await supabase
            .from('quiz_questions')
            .delete()
            .eq('id', decision.id);
          if (delErr) {
            console.error(`\n  ⚠️  Delete failed for ${decision.id}:`, delErr.message);
          } else {
            batchDeleted++;
            results.deleted++;
          }
        }
      }

      console.log(`✅  ok:${batchOk}  fix:${batchFixed}  del:${batchDeleted}`);

    } catch (err) {
      console.log(`❌ ${err.message}`);
      results.errors++;
    }

    if (i + BATCH_SIZE < allQuestions.length) {
      await sleep(SLEEP_MS);
    }
  }

  // Write full results to file for inspection
  const outPath = path.join(__dirname, 'review_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results.details, null, 2));

  console.log('\n=================================');
  console.log(`✅  Behalten:    ${results.ok}`);
  console.log(`✏️   Korrigiert:  ${results.fixed}`);
  console.log(`🗑️   Gelöscht:    ${results.deleted}`);
  console.log(`❌  Fehler:      ${results.errors}`);
  console.log(`\n📄 Detailergebnisse: scripts/review_results.json`);
  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
