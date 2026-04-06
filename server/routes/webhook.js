const express = require('express');
const twilio = require('twilio');
const supabase = require('../services/supabaseClient');
const { sendFeedback, sendQuiz } = require('../services/twilioService');

const router = express.Router();

/**
 * POST /api/webhook/twilio
 * Twilio sends incoming WhatsApp messages here.
 * User replies with 1, 2, 3, or 4 → we find their oldest pending question,
 * check the answer, send feedback, then automatically send the next question.
 */
router.post('/twilio', async (req, res) => {
  // Validate Twilio signature in production
  if (process.env.NODE_ENV === 'production') {
    const valid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      req.headers['x-twilio-signature'],
      `${process.env.BACKEND_URL}/api/webhook/twilio`,
      req.body
    );
    if (!valid) return res.status(403).send('Forbidden');
  }

  const from = req.body.From || '';
  const body = (req.body.Body || '').trim();
  const phoneNumber = from.replace('whatsapp:', '');

  // ── 1. Find user ──────────────────────────────────────────
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, daily_question_count, subscription_status')
    .eq('phone', phoneNumber)
    .single();

  if (userError || !user) {
    await sendFeedback(phoneNumber,
      '❓ Wir konnten keinen Account für diese Nummer finden.\nBitte registriere dich auf gehirnjoggingclub.de'
    );
    return res.type('text/xml').send('<Response></Response>');
  }

  if (['cancelled', 'past_due'].includes(user.subscription_status)) {
    await sendFeedback(phoneNumber,
      '⚠️ Dein Abonnement ist nicht mehr aktiv.\nMelde dich auf gehirnjoggingclub.de an.'
    );
    return res.type('text/xml').send('<Response></Response>');
  }

  // ── 2. Find oldest pending question today ─────────────────
  const today = new Date().toISOString().split('T')[0];

  const { data: sentRecords } = await supabase
    .from('user_answers')
    .select('id, question_id, answered_at')
    .eq('user_id', user.id)
    .is('user_answer', null)
    .gte('answered_at', `${today}T00:00:00`)
    .order('answered_at', { ascending: true });

  const sentRecord = sentRecords?.[0] || null;
  const totalSentToday = await getTotalSentToday(user.id, today);

  // ── 3. No pending question ────────────────────────────────
  if (!sentRecord) {
    // Check if user has EVER received a question.
    // If not, they may have just replied to the welcome message before
    // their first question was sent → give them a neutral response instead
    // of the confusing "all done" message.
    const { count: everReceived } = await supabase
      .from('user_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!everReceived || everReceived === 0) {
      await sendFeedback(phoneNumber,
        `🧠 Deine erste Quiz-Frage ist schon unterwegs!\n\nBis gleich! 💪`
      );
    } else {
      await sendFeedback(phoneNumber,
        `🎉 Du hast heute schon alle deine Fragen gemeistert – Respekt!\n\nKomm morgen wieder für frische Fragen. Dein Gehirn wird es dir danken. 🧠💪\n\n📱 Mehr oder weniger Fragen, andere Kategorien oder eine andere Uhrzeit?\nPasse alles bequem im Dashboard an:\n👉 gehirnjoggingclub.de/dashboard`
      );
    }
    return res.type('text/xml').send('<Response></Response>');
  }

  // ── 4. Validate answer ────────────────────────────────────
  const answerMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
  const answer = answerMap[body];

  if (!answer) {
    // Kein gültiger Antwort-Code → prüfen ob User noch nie eine Frage beantwortet hat
    // (z.B. hat gerade auf Welcome-Nachricht geantwortet) → Q1 senden
    const { count: answeredCount } = await supabase
      .from('user_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('user_answer', 'is', null);

    if (answeredCount === 0) {
      const { data: firstQ } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', sentRecord.question_id)
        .single();
      if (firstQ) {
        await sendQuiz(phoneNumber, firstQ, 1, sentRecords?.length || 1);
      }
    } else {
      await sendFeedback(phoneNumber,
        '❓ Bitte antworte mit *1*, *2*, *3* oder *4* auf die Quiz-Frage.'
      );
    }
    return res.type('text/xml').send('<Response></Response>');
  }

  const questionId = sentRecord.question_id;

  // ── 5. Get full question ──────────────────────────────────
  const { data: question } = await supabase
    .from('quiz_questions')
    .select('correct_answer, explanation, answer_a, answer_b, answer_c, answer_d')
    .eq('id', questionId)
    .single();

  if (!question) {
    await sendFeedback(phoneNumber, '⚠️ Frage nicht gefunden. Bitte melde dich bei uns.');
    return res.type('text/xml').send('<Response></Response>');
  }

  // ── 6. Check answer & save ────────────────────────────────
  const is_correct = answer === question.correct_answer.toLowerCase();
  const answerTextMap = {
    a: question.answer_a,
    b: question.answer_b,
    c: question.answer_c,
    d: question.answer_d,
  };

  await supabase.from('user_answers').update({
    user_answer: answer,
    is_correct,
    answered_at: new Date().toISOString(),
  }).eq('id', sentRecord.id);

  // ── 7. Build feedback ─────────────────────────────────────
  const remainingUnanswered = (sentRecords?.length || 1) - 1;
  const dailyCount = user.daily_question_count || 1;
  const answeredNumber = totalSentToday - remainingUnanswered;

  let feedback = '';
  if (is_correct) {
    feedback += `✅ *Richtig!* Stark, ${user.name?.split(' ')[0] || 'du'}!\n\n`;
  } else {
    feedback += `❌ *Leider falsch.*\nRichtige Antwort: *${answerTextMap[question.correct_answer.toLowerCase()]}*\n\n`;
  }

  if (question.explanation) {
    feedback += `💡 *Erklärung:*\n${question.explanation}\n\n`;
  }

  if (dailyCount > 1) {
    if (remainingUnanswered > 0) {
      feedback += `📊 *${answeredNumber} von ${dailyCount} Fragen beantwortet* – gleich kommt die nächste!`;
    } else {
      feedback += `🎉 *Alle ${dailyCount} Fragen für heute erledigt!* Bis morgen! 🧠`;
    }
  } else {
    feedback += `Bis morgen! 🧠`;
  }

  await sendFeedback(phoneNumber, feedback);

  // ── 8. Send next question if available ────────────────────
  if (remainingUnanswered > 0) {
    await sleep(2000);
    const nextRecord = sentRecords[1];
    if (nextRecord) {
      const { data: nextQ } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', nextRecord.question_id)
        .single();

      if (nextQ) {
        const nextNumber = answeredNumber + 1;
        await sendQuiz(phoneNumber, nextQ, nextNumber, dailyCount);
      }
    }
  }

  return res.type('text/xml').send('<Response></Response>');
});

async function getTotalSentToday(userId, today) {
  const { count } = await supabase
    .from('user_answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('answered_at', `${today}T00:00:00`);
  return count || 0;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = router;
