const express = require('express');
const supabase = require('../services/supabaseClient');
const { generateDailyQuiz } = require('../services/quizService');

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

module.exports = router;
