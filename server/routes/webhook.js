const express = require('express');
const twilio = require('twilio');
const supabase = require('../services/supabaseClient');
const { sendFeedback } = require('../services/twilioService');

const router = express.Router();

/**
 * POST /api/webhook/twilio
 * Twilio sends incoming WhatsApp messages here.
 * User replies with 1, 2, 3, or 4 → we find their pending question and check the answer.
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
    if (!valid) {
      return res.status(403).send('Forbidden');
    }
  }

  const from = req.body.From; // e.g. "whatsapp:+491234567890"
  const body = (req.body.Body || '').trim();

  // Extract phone number (strip "whatsapp:" prefix)
  const phoneNumber = from.replace('whatsapp:', '');

  // Find user by phone
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, subscription_status')
    .eq('phone', phoneNumber)
    .single();

  if (userError || !user) {
    await sendFeedback(phoneNumber,
      `Wir konnten keinen Account für diese Nummer finden. Bitte registriere dich auf unserer Website.`
    );
    return res.type('text/xml').send('<Response></Response>');
  }

  if (user.subscription_status === 'cancelled' || user.subscription_status === 'past_due') {
    await sendFeedback(phoneNumber,
      `Dein Abonnement ist nicht aktiv. Bitte melde dich auf unserer Website an.`
    );
    return res.type('text/xml').send('<Response></Response>');
  }

  // Map "1"→"a", "2"→"b", "3"→"c", "4"→"d"
  const answerMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
  const answer = answerMap[body];

  if (!answer) {
    await sendFeedback(phoneNumber,
      `Bitte antworte mit 1️⃣, 2️⃣, 3️⃣ oder 4️⃣ auf das heutige Quiz.`
    );
    return res.type('text/xml').send('<Response></Response>');
  }

  // Find today's unanswered question for this user
  const today = new Date().toISOString().split('T')[0];

  // Get the question that was sent to the user today (most recent unanswered)
  const { data: sentRecord } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', user.id)
    .is('user_answer', null) // null = sent but not answered
    .gte('answered_at', `${today}T00:00:00`)
    .order('answered_at', { ascending: false })
    .limit(1)
    .single();

  // Fallback: get scheduled question for today
  let questionId = sentRecord?.question_id;

  if (!questionId) {
    const { data: scheduled } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('scheduled_date', today)
      .single();
    questionId = scheduled?.id;
  }

  if (!questionId) {
    await sendFeedback(phoneNumber, `Für heute gibt es kein offenes Quiz. Bis morgen! 🧠`);
    return res.type('text/xml').send('<Response></Response>');
  }

  // Get full question
  const { data: question } = await supabase
    .from('quiz_questions')
    .select('correct_answer, explanation, answer_a, answer_b, answer_c, answer_d')
    .eq('id', questionId)
    .single();

  const is_correct = answer === question.correct_answer.toLowerCase();

  const answerTextMap = {
    a: question.answer_a,
    b: question.answer_b,
    c: question.answer_c,
    d: question.answer_d,
  };

  // Save answer
  await supabase.from('user_answers').upsert({
    user_id: user.id,
    question_id: questionId,
    user_answer: answer,
    is_correct,
    answered_at: new Date().toISOString(),
  }, { onConflict: 'user_id,question_id' });

  // Build feedback message
  let feedback;
  if (is_correct) {
    feedback = `✅ *Richtig!* Super gemacht, ${user.name}!\n\n`;
  } else {
    feedback = `❌ *Leider falsch.* Die richtige Antwort war:\n*${answerTextMap[question.correct_answer]}*\n\n`;
  }

  if (question.explanation) {
    feedback += `💡 *Erklärung:*\n${question.explanation}`;
  }

  feedback += `\n\nBis morgen! 🧠`;

  await sendFeedback(phoneNumber, feedback);

  return res.type('text/xml').send('<Response></Response>');
});

module.exports = router;
