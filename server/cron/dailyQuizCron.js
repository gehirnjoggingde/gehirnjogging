const cron = require('node-cron');
const supabase = require('../services/supabaseClient');
const { sendQuiz } = require('../services/twilioService');
const { getQuestionsForUser } = require('../services/quizService');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await runQuizDispatch();
});

async function runQuizDispatch() {
  const now = new Date();
  const currentHour   = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  console.log(`[Cron] Dispatch at ${pad(currentHour)}:${pad(currentMinute)} UTC`);

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, quiz_time, daily_question_count, difficulty_level, preferred_categories')
    .eq('is_paused', false)
    .in('subscription_status', ['active']);

  if (error) { console.error('[Cron] Fetch error:', error); return; }
  if (!users?.length) { console.log('[Cron] No active users'); return; }

  // Filter by time window (±4 min)
  const targets = users.filter(u => {
    if (!u.quiz_time) return false;
    const [hh, mm] = u.quiz_time.split(':').map(Number);
    return Math.abs((hh * 60 + mm) - (currentHour * 60 + currentMinute)) <= 4;
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

  const questions = await getQuestionsForUser(user, remaining);
  if (!questions.length) {
    console.error(`[Cron] No questions available for ${user.phone}`);
    return;
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await sendQuiz(user.phone, q, i + 1 + alreadySentCount, count);
    await supabase.from('user_answers').insert({
      user_id: user.id,
      question_id: q.id,
      user_answer: null,
      is_correct: false,
      answered_at: new Date().toISOString(),
    });
    if (i < questions.length - 1) await sleep(2000);
  }

  console.log(`[Cron] ✓ Sent ${questions.length} question(s) to ${user.phone}`);
}

function pad(n) { return String(n).padStart(2, '0'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { runQuizDispatch };
