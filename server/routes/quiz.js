const express = require('express');
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/quiz/today
// Returns today's question (without revealing correct answer)
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Check if user already answered today
  const { data: existingAnswer } = await supabase
    .from('user_answers')
    .select('user_answer, is_correct, question_id')
    .eq('user_id', req.user.id)
    .gte('answered_at', `${today}T00:00:00`)
    .lte('answered_at', `${today}T23:59:59`)
    .single();

  if (existingAnswer) {
    // Return question with the user's result
    const { data: question } = await supabase
      .from('quiz_questions')
      .select('id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, category')
      .eq('id', existingAnswer.question_id)
      .single();

    return res.json({
      question,
      alreadyAnswered: true,
      userAnswer: existingAnswer.user_answer,
      isCorrect: existingAnswer.is_correct,
    });
  }

  // Get today's scheduled question or pick a random one the user hasn't seen
  let question = null;

  const { data: scheduled } = await supabase
    .from('quiz_questions')
    .select('id, question, answer_a, answer_b, answer_c, answer_d, category')
    .eq('scheduled_date', today)
    .single();

  if (scheduled) {
    question = scheduled;
  } else {
    // Pick a random question the user hasn't answered yet
    const { data: answeredIds } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', req.user.id);

    const excludeIds = (answeredIds || []).map(a => a.question_id);

    let query = supabase
      .from('quiz_questions')
      .select('id, question, answer_a, answer_b, answer_c, answer_d, category');

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: candidates } = await query.limit(50);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ error: 'Keine Quizfragen verfügbar' });
    }

    question = candidates[Math.floor(Math.random() * candidates.length)];
  }

  return res.json({ question, alreadyAnswered: false });
});

// POST /api/quiz/answer
// Body: { question_id, user_answer }  – user_answer is 'a', 'b', 'c', or 'd'
router.post('/answer', async (req, res) => {
  const { question_id, user_answer } = req.body;

  if (!question_id || !user_answer) {
    return res.status(400).json({ error: 'question_id und user_answer erforderlich' });
  }

  if (!['a', 'b', 'c', 'd'].includes(user_answer.toLowerCase())) {
    return res.status(400).json({ error: 'Antwort muss a, b, c oder d sein' });
  }

  const { data: question, error: qErr } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer, explanation, answer_a, answer_b, answer_c, answer_d')
    .eq('id', question_id)
    .single();

  if (qErr || !question) {
    return res.status(404).json({ error: 'Frage nicht gefunden' });
  }

  const normalizedAnswer = user_answer.toLowerCase();
  const is_correct = normalizedAnswer === question.correct_answer.toLowerCase();

  // Save answer (upsert in case of retry)
  await supabase.from('user_answers').upsert({
    user_id: req.user.id,
    question_id: question.id,
    user_answer: normalizedAnswer,
    is_correct,
    answered_at: new Date().toISOString(),
  }, { onConflict: 'user_id,question_id' });

  // Map letter to text for response
  const answerTextMap = {
    a: question.answer_a,
    b: question.answer_b,
    c: question.answer_c,
    d: question.answer_d,
  };

  return res.json({
    is_correct,
    correct_answer: question.correct_answer,
    correct_answer_text: answerTextMap[question.correct_answer],
    explanation: question.explanation,
  });
});

// GET /api/quiz/stats
// Returns basic user stats
router.get('/stats', async (req, res) => {
  const { data: answers } = await supabase
    .from('user_answers')
    .select('is_correct, answered_at')
    .eq('user_id', req.user.id)
    .not('user_answer', 'is', null);

  if (!answers) return res.json({ total: 0, correct: 0, streak: 0 });

  const total = answers.length;
  const correct = answers.filter(a => a.is_correct).length;

  // Calculate current streak (consecutive days with at least one correct answer)
  const daySet = new Set(answers
    .filter(a => a.is_correct)
    .map(a => a.answered_at.split('T')[0]));

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (daySet.has(ds)) streak++;
    else break;
  }

  return res.json({ total, correct, streak, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 });
});

module.exports = router;
