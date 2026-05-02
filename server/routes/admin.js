const express = require('express');
const supabase = require('../services/supabaseClient');
const { generateDailyQuiz } = require('../services/quizService');
const { sendQuizToUser } = require('../cron/dailyQuizCron');

const router = express.Router();

// Simple admin key check – replace with proper auth in production
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Nicht autorisiert' });
  }
  next();
}

// POST /api/admin/add-question
router.post('/add-question', adminAuth, async (req, res) => {
  const {
    question, answer_a, answer_b, answer_c, answer_d,
    correct_answer, explanation, category, difficulty, scheduled_date,
  } = req.body;

  if (!question || !answer_a || !answer_b || !answer_c || !answer_d || !correct_answer) {
    return res.status(400).json({ error: 'Pflichtfelder fehlen' });
  }

  if (!['a', 'b', 'c', 'd'].includes(correct_answer.toLowerCase())) {
    return res.status(400).json({ error: 'correct_answer muss a, b, c oder d sein' });
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      question,
      answer_a,
      answer_b,
      answer_c,
      answer_d,
      correct_answer: correct_answer.toLowerCase(),
      explanation,
      category,
      difficulty: difficulty || 'medium',
      scheduled_date: scheduled_date || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Add Question]', error);
    return res.status(500).json({ error: 'Frage konnte nicht gespeichert werden' });
  }

  return res.status(201).json({ question_id: data.id });
});

// GET /api/admin/questions
router.get('/questions', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', adminAuth, async (req, res) => {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Gelöscht' });
});

// POST /api/admin/generate-question
// Uses Claude API to auto-generate a quiz question
router.post('/generate-question', adminAuth, async (req, res) => {
  try {
    const question = await generateDailyQuiz();

    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select('id')
      .single();

    if (error) throw error;
    return res.status(201).json({ question_id: data.id, ...question });
  } catch (err) {
    console.error('[Generate Question]', err);
    return res.status(500).json({ error: 'Frage konnte nicht generiert werden' });
  }
});

// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, phone, quiz_time, is_paused, subscription_status, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/admin/send-quiz-now
// Manually trigger quiz sending for all active users (bypasses time window).
// Deletes today's pending (unanswered) records first so they get fresh questions.
router.post('/send-quiz-now', adminAuth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Get all active, non-paused users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, quiz_time, daily_question_count, difficulty_level, preferred_categories')
    .eq('is_paused', false)
    .in('subscription_status', ['active']);

  if (error) return res.status(500).json({ error: error.message });
  if (!users?.length) return res.json({ sent: 0, message: 'Keine aktiven Nutzer' });

  const results = [];

  for (const user of users) {
    try {
      // Delete today's pending (unsent) records so cron logic sees 0 sent
      await supabase
        .from('user_answers')
        .delete()
        .eq('user_id', user.id)
        .is('user_answer', null)
        .gte('answered_at', `${today}T00:00:00`);

      await sendQuizToUser(user);
      results.push({ phone: user.phone, status: 'ok' });
    } catch (err) {
      console.error(`[Admin send-quiz-now] Failed for ${user.phone}:`, err.message);
      results.push({ phone: user.phone, status: 'error', error: err.message });
    }
  }

  const sent = results.filter(r => r.status === 'ok').length;
  console.log(`[Admin send-quiz-now] Done – ${sent}/${users.length} sent`);
  return res.json({ sent, total: users.length, results });
});

module.exports = router;
