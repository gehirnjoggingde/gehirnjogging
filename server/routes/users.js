const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const VALID_CATEGORIES = [
  'allgemeinwissen', 'psychologie', 'geschichte',
  'wissenschaft', 'philosophie', 'wirtschaft',
  'natur', 'kultur',
];

// GET /api/users/me
router.get('/me', async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, phone, quiz_time, is_paused, subscription_status, created_at, daily_question_count, difficulty_level, preferred_categories')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  return res.json(user);
});

// PUT /api/users/settings
router.put('/settings', async (req, res) => {
  const { quiz_time, is_paused, daily_question_count, difficulty_level, preferred_categories } = req.body;
  const updates = {};

  if (quiz_time !== undefined) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(quiz_time))
      return res.status(400).json({ error: 'Ungültiges Zeitformat. Erwartet HH:MM' });
    updates.quiz_time = quiz_time;
  }

  if (is_paused !== undefined) {
    // Only toggle is_paused – subscription_status is managed exclusively by Stripe webhooks
    updates.is_paused = Boolean(is_paused);
  }

  if (daily_question_count !== undefined) {
    const count = parseInt(daily_question_count);
    if (count < 1 || count > 5)
      return res.status(400).json({ error: 'Anzahl muss zwischen 1 und 5 liegen' });
    updates.daily_question_count = count;
  }

  if (difficulty_level !== undefined) {
    const level = parseInt(difficulty_level);
    if (level < 1 || level > 3)
      return res.status(400).json({ error: 'Schwierigkeitsgrad muss zwischen 1 und 3 liegen' });
    updates.difficulty_level = level;
  }

  if (preferred_categories !== undefined) {
    if (!Array.isArray(preferred_categories) || preferred_categories.length === 0)
      return res.status(400).json({ error: 'Mindestens eine Kategorie auswählen' });
    const invalid = preferred_categories.filter(c => !VALID_CATEGORIES.includes(c));
    if (invalid.length > 0)
      return res.status(400).json({ error: `Ungültige Kategorien: ${invalid.join(', ')}` });
    updates.preferred_categories = preferred_categories;
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: 'Keine Änderungen angegeben' });

  updates.updated_at = new Date().toISOString();

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select('id, email, name, phone, quiz_time, is_paused, subscription_status, daily_question_count, difficulty_level, preferred_categories')
    .single();

  if (error) {
    console.error('[Settings]', error);
    return res.status(500).json({ error: 'Einstellungen konnten nicht gespeichert werden' });
  }

  return res.json(user);
});

// PUT /api/users/password
router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Aktuelles und neues Passwort erforderlich' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Neues Passwort muss mindestens 8 Zeichen haben' });

  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Aktuelles Passwort ist falsch' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await supabase.from('users').update({ password_hash: passwordHash }).eq('id', req.user.id);

  return res.json({ message: 'Passwort erfolgreich geändert' });
});

// POST /api/users/skip-today
router.post('/skip-today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data: question } = await supabase
    .from('quiz_questions').select('id').eq('scheduled_date', today).single();

  if (!question) return res.json({ message: 'Kein Quiz für heute gefunden' });

  const { data: existing } = await supabase
    .from('user_answers').select('id')
    .eq('user_id', req.user.id).eq('question_id', question.id).single();

  if (existing) return res.json({ message: 'Quiz wurde bereits beantwortet oder übersprungen' });

  await supabase.from('user_answers').insert({
    user_id: req.user.id, question_id: question.id, user_answer: null, is_correct: false,
  });

  return res.json({ message: 'Quiz für heute übersprungen' });
});

module.exports = router;
