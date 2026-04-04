const supabase = require('./supabaseClient');

const CATEGORIES = ['allgemeinwissen', 'geschichte', 'psychologie', 'wissenschaft', 'philosophie', 'wirtschaft', 'natur', 'kultur'];

/**
 * Maps a user's difficulty_level (1-10) to a score range for filtering.
 * Questions within ±2 of the user's level are accepted.
 */
function difficultyRange(level) {
  return { min: Math.max(1, level - 2), max: Math.min(10, level + 2) };
}

/**
 * Returns N questions for a specific user, respecting their preferences.
 * @param {object} user – must have preferred_categories, difficulty_level, daily_question_count, id
 * @param {number} count – override count (optional)
 */
async function getQuestionsForUser(user, count = null) {
  const questionCount = count ?? user.daily_question_count ?? 1;
  const categories = user.preferred_categories?.length > 0
    ? user.preferred_categories
    : ['allgemeinwissen'];
  const targetLevel = user.difficulty_level ?? 5;

  // Exclude ALL questions ever sent to this user (answered OR pending)
  // This prevents any question from being sent twice
  const { data: everSent } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', user.id);

  const excludeIds = (everSent || []).map(a => a.question_id);

  function buildQuery(catFilter, minDiff, maxDiff) {
    let q = supabase
      .from('quiz_questions')
      .select('*')
      .limit(questionCount * 8);
    if (catFilter) q = q.in('category', catFilter);
    if (minDiff !== null) q = q.gte('difficulty_score', minDiff);
    if (maxDiff !== null) q = q.lte('difficulty_score', maxDiff);
    if (excludeIds.length > 0) q = q.not('id', 'in', `(${excludeIds.join(',')})`);
    return q;
  }

  // Attempt order: exact level → ±1 → ±2 → category only → any question
  const attempts = [
    () => buildQuery(categories, targetLevel, targetLevel),
    () => buildQuery(categories, targetLevel - 1, targetLevel + 1),
    () => buildQuery(categories, targetLevel - 2, targetLevel + 2),
    () => buildQuery(categories, null, null),
    () => buildQuery(null, null, null),
  ];

  let pool = [];
  for (const attempt of attempts) {
    if (pool.length >= questionCount) break;
    const { data } = await attempt();
    const fresh = (data || []).filter(q => !pool.some(p => p.id === q.id));
    pool = [...pool, ...fresh];
  }

  // Fallback 1: ignore difficulty filter, keep category
  if (pool.length < questionCount) {
    let q2 = supabase.from('quiz_questions').select('*').in('category', categories).limit(50);
    if (answeredIds.length > 0) q2 = q2.not('id', 'in', `(${answeredIds.join(',')})`);
    const { data: more } = await q2;
    pool = [...pool, ...(more || [])];
  }

  // Fallback 2: any question
  if (pool.length < questionCount) {
    const { data: any } = await supabase.from('quiz_questions').select('*').limit(50);
    pool = [...pool, ...(any || [])];
  }

  if (pool.length === 0) return [];

  // Shuffle + pick N
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const unique = [];
  const seen = new Set();
  for (const q of shuffled) {
    if (!seen.has(q.id)) { seen.add(q.id); unique.push(q); }
    if (unique.length >= questionCount) break;
  }

  return unique;
}

/**
 * Gets today's question for a single user (backwards-compatible).
 */
async function getTodayQuestion(user = null) {
  const today = new Date().toISOString().split('T')[0];

  // Scheduled question takes priority
  const { data: scheduled } = await supabase
    .from('quiz_questions').select('*').eq('scheduled_date', today).single();
  if (scheduled) return scheduled;

  if (user) {
    const qs = await getQuestionsForUser(user, 1);
    return qs[0] ?? null;
  }

  // Generic random fallback
  const { data } = await supabase.from('quiz_questions').select('*').limit(20);
  if (!data || data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)];
}

/**
 * Calls Claude API to auto-generate a quiz question.
 */
async function generateDailyQuiz(category = null) {
  const cat = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const prompt = `Generiere eine Quiz-Frage zum Thema "${cat}" (auf Deutsch).

Format (nur JSON):
{
  "question": "...",
  "answer_a": "...",
  "answer_b": "...",
  "answer_c": "...",
  "answer_d": "...",
  "correct_answer": "a",
  "explanation": "...",
  "category": "${cat}",
  "difficulty": "medium",
  "difficulty_score": 5
}`;

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

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const data = await response.json();
  const match = data.content[0].text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Claude response');
  return JSON.parse(match[0]);
}

module.exports = { getTodayQuestion, getQuestionsForUser, generateDailyQuiz };
