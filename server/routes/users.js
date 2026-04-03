const express = require('express');
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, phone, quiz_time, is_paused, subscription_status, created_at')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }

  return res.json(user);
});

// PUT /api/users/settings
// Body: { quiz_time?, is_paused? }
router.put('/settings', async (req, res) => {
  const { quiz_time, is_paused } = req.body;
  const updates = {};

  if (quiz_time !== undefined) {
    // Validate HH:MM format
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(quiz_time)) {
      return res.status(400).json({ error: 'Ungültiges Zeitformat. Erwartet HH:MM' });
    }
    // Only allow times between 09:00 and 22:00
    const [hours] = quiz_time.split(':').map(Number);
    if (hours < 9 || hours > 22) {
      return res.status(400).json({ error: 'Quiz-Zeit muss zwischen 09:00 und 22:00 liegen' });
    }
    updates.quiz_time = quiz_time;
  }

  if (is_paused !== undefined) {
    updates.is_paused = Boolean(is_paused);
    // Sync subscription_status with pause state
    if (Boolean(is_paused)) {
      updates.subscription_status = 'paused';
    } else {
      updates.subscription_status = 'active';
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Keine Änderungen angegeben' });
  }

  updates.updated_at = new Date().toISOString();

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select('id, email, name, phone, quiz_time, is_paused, subscription_status')
    .single();

  if (error) {
    console.error('[Settings]', error);
    return res.status(500).json({ error: 'Einstellungen konnten nicht gespeichert werden' });
  }

  return res.json(user);
});

// POST /api/users/skip-today
// Marks today's quiz as skipped (by inserting a null answer record)
router.post('/skip-today', async (req, res) => {
  // Get today's question
  const today = new Date().toISOString().split('T')[0];

  const { data: question } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('scheduled_date', today)
    .single();

  if (!question) {
    return res.json({ message: 'Kein Quiz für heute gefunden' });
  }

  // Check if already answered/skipped
  const { data: existing } = await supabase
    .from('user_answers')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('question_id', question.id)
    .single();

  if (existing) {
    return res.json({ message: 'Quiz wurde bereits beantwortet oder übersprungen' });
  }

  await supabase.from('user_answers').insert({
    user_id: req.user.id,
    question_id: question.id,
    user_answer: null,
    is_correct: false,
  });

  return res.json({ message: 'Quiz für heute übersprungen' });
});

module.exports = router;
