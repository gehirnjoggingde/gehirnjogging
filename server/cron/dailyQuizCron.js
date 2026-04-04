const cron = require('node-cron');
const supabase = require('../services/supabaseClient');
const { sendQuiz } = require('../services/twilioService');
const { getQuestionsForUser } = require('../services/quizService');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await runQuizDispatch();
});

/**
 * Get current time in Europe/Berlin as total minutes since midnight.
 * Handles both CET (UTC+1) and CEST (UTC+2) automatically.
 */
function getBerlinMinutes() {
  const now = new Date();
  const berlinStr = now.toLocaleString('en-US', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [h, m] = berlinStr.split(':').map(Number);
  return h * 60 + m;
}

async function runQuizDispatch() {
  const berlinMinutes = getBerlinMinutes();
  const bh = Math.floor(berlinMinutes / 60);
  const bm = berlinMinutes % 60;
  console.log(`[Cron] Dispatch at ${pad(bh)}:${pad(bm)} Berlin time`);

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, quiz_time, daily_question_count, difficulty_level, preferred_categories')
    .eq('is_paused', false)
    .in('subscription_status', ['active']);

  if (error) { console.error('[Cron] Fetch error:', error); return; }
  if (!users?.length) { console.log('[Cron] No active users'); return; }

  // Filter by time window (±4 min) – quiz_time is stored as Berlin local time
  const targets = users.filter(u => {
    if (!u.quiz_time) return false;
    const [hh, mm] = u.quiz_time.split(':').map(Number);
    return Math.abs((hh * 60 + mm) - berlinMinutes) <= 4;
  });

  if (!targets.length) { console.log('[Cron] No users in this window'); return; }

  console.log(`[Cron] Sending to ${targets.length} users`);

  for (const user of targets) {
    try {
      await sendQuizToUser(user);
      await sleep(300);
    } catch (err) {
      console.error(`[Cron] Failed for ${user.phone}:`, err.message);
    }
  }

  console.log('[Cron] Done');
}

async function sendQuizToUser(user) {
  const today = new Date().toISOString().split('T')[0];
  const count = user.daily_question_count || 1;

  // Check how many already sent today
  const { data: sentToday } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', user.id)
    .gte('answered_at', `${today}T00:00:00`);

  const alreadySentCount = sentToday?.length || 0;
  const remaining = count - alreadySentCount;

  if (remaining <= 0) {
    console.log(`[Cron] ${user.phone} already received all ${count} questions today`);
    return;
  }

  // Sequential mode: cron only sends the FIRST question of the day.
  // After the user answers, the webhook automatically sends the next one.
  const questions = await getQuestionsForUser(user, count);
  if (!questions.length) {
    console.error(`[Cron] No questions available for ${user.phone}`);
    return;
  }

  // Pre-insert all questions as pending (null answer) so webhook can track order
  for (const q of questions) {
    await supabase.from('user_answers').insert({
      user_id: user.id,
      question_id: q.id,
      user_answer: null,
      is_correct: false,
      answered_at: new Date().toISOString(),
    });
    await sleep(50); // tiny delay so timestamps differ (preserves order)
  }

  // Only send the FIRST question now – rest are triggered by webhook answers
  const firstQ = questions[0];
  await sendQuiz(user.phone, firstQ, 1, count);

  console.log(`[Cron] ✓ Queued ${questions.length} question(s) for ${user.phone}, sent Q1`);
}

function pad(n) { return String(n).padStart(2, '0'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { runQuizDispatch };
