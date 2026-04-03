const supabase = require('./supabaseClient');

const CATEGORIES = ['allgemeinwissen', 'geschichte', 'psychologie', 'wissenschaft', 'philosophie'];

/**
 * Returns today's quiz question.
 * Priority: scheduled_date match → fallback to a random unsent question.
 * Optionally generates a new one via Claude API if DB is empty.
 */
async function getTodayQuestion() {
  const today = new Date().toISOString().split('T')[0];

  // 1. Check for a question scheduled for today
  const { data: scheduled } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('scheduled_date', today)
    .single();

  if (scheduled) return scheduled;

  // 2. Pick a random question that hasn't been used in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentlyUsed } = await supabase
    .from('user_answers')
    .select('question_id')
    .gte('answered_at', thirtyDaysAgo.toISOString());

  const excludeIds = [...new Set((recentlyUsed || []).map(a => a.question_id))];

  let query = supabase.from('quiz_questions').select('*');
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data: candidates } = await query.limit(50);

  if (candidates && candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 3. All questions exhausted – generate a new one if Claude API key is configured
  if (process.env.CLAUDE_API_KEY) {
    console.log('[QuizService] Generating new question via Claude API...');
    const generated = await generateDailyQuiz();

    const { data: saved } = await supabase
      .from('quiz_questions')
      .insert(generated)
      .select('*')
      .single();

    return saved;
  }

  // 4. Fallback: use any question at all
  const { data: any } = await supabase
    .from('quiz_questions')
    .select('*')
    .limit(1)
    .single();

  return any;
}

/**
 * Calls Claude API to generate a quiz question.
 * Returns a plain object ready to INSERT into quiz_questions.
 */
async function generateDailyQuiz() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const prompt = `Generiere eine Quiz-Frage zum Thema "${category}" (auf Deutsch).

Format (nur JSON, keine anderen Zeichen):
{
  "question": "...",
  "answer_a": "...",
  "answer_b": "...",
  "answer_c": "...",
  "answer_d": "...",
  "correct_answer": "a",
  "explanation": "...",
  "category": "${category}",
  "difficulty": "medium"
}

Die Frage soll interessant, lehrreich und mittelschwer sein. Die Erklärung soll 1-2 Sätze sein.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  // Extract JSON even if there's surrounding whitespace or markdown code fences
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  return JSON.parse(jsonMatch[0]);
}

module.exports = { getTodayQuestion, generateDailyQuiz };
