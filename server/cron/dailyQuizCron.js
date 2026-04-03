const cron = require('node-cron');
const supabase = require('../services/supabaseClient');
const { sendQuiz } = require('../services/twilioService');
const { getTodayQuestion } = require('../services/quizService');

/**
 * Cron runs every 5 minutes.
 * For each active user whose quiz_time matches (±4 min), we send the daily quiz.
 *
 * Schedules in UTC. If your users are in Germany (CET = UTC+1, CEST = UTC+2),
 * you need to subtract 1 or 2 hours from the times they set.
 * Simpler approach: store times in UTC in the DB and let the frontend convert.
 *
 * For MVP: we send at the exact UTC minute the user has set.
 */

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await runQuizDispatch();
});

async function runQuizDispatch() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  console.log(`[Cron] Running quiz dispatch at ${pad(currentHour)}:${pad(currentMinute)} UTC`);

  // Fetch all active, non-paused users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, quiz_time')
    .eq('is_paused', false)
    .in('subscription_status', ['active']);

  if (error) {
    console.error('[Cron] Failed to fetch users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('[Cron] No active users found');
    return;
  }

  // Filter users whose quiz_time falls within the current 5-minute window
  const targets = users.filter(user => {
    if (!user.quiz_time) return false;
    const [hh, mm] = user.quiz_time.split(':').map(Number);
    // Accept if the user's time is within [currentMinute-4, currentMinute]
    const userMinutesTotal = hh * 60 + mm;
    const nowMinutesTotal = currentHour * 60 + currentMinute;
    return Math.abs(userMinutesTotal - nowMinutesTotal) <= 4;
  });

  if (targets.length === 0) {
    console.log('[Cron] No users scheduled for this window');
    return;
  }

  // Get today's question (same question for everyone)
  let question;
  try {
    question = await getTodayQuestion();
  } catch (err) {
    console.error('[Cron] Failed to get today\'s question:', err);
    return;
  }

  if (!question) {
    console.error('[Cron] No question available for today');
    return;
  }

  console.log(`[Cron] Sending quiz to ${targets.length} users`);

  // Send to each user with rate limiting (avoid Twilio rate limits)
  for (const user of targets) {
    try {
      await sendQuizToUser(user, question);
      // Small delay between messages
      await sleep(200);
    } catch (err) {
      console.error(`[Cron] Failed to send to ${user.phone}:`, err.message);
    }
  }

  console.log('[Cron] Dispatch complete');
}

async function sendQuizToUser(user, question) {
  // Check if user already received today's quiz
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('user_answers')
    .select('id')
    .eq('user_id', user.id)
    .eq('question_id', question.id)
    .gte('answered_at', `${today}T00:00:00`)
    .single();

  if (existing) {
    console.log(`[Cron] ${user.phone} already received today's quiz – skipping`);
    return;
  }

  // Send WhatsApp message
  await sendQuiz(user.phone, question);

  // Record that the quiz was sent (null answer = pending)
  await supabase.from('user_answers').insert({
    user_id: user.id,
    question_id: question.id,
    user_answer: null,
    is_correct: false,
    answered_at: new Date().toISOString(),
  });

  console.log(`[Cron] ✓ Sent to ${user.phone}`);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { runQuizDispatch };
