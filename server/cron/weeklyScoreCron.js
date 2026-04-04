const cron = require('node-cron');
const supabase = require('../services/supabaseClient');
const { sendFeedback } = require('../services/twilioService');

/**
 * Weekly score summary – runs every Sunday.
 * Checks if current Berlin time is between 10:00 and 10:09,
 * then sends each active user their weekly stats via WhatsApp.
 */
cron.schedule('*/10 * * * 0', async () => {
  await runWeeklyScore();
});

async function runWeeklyScore() {
  // Only fire at 10:00 Berlin time on Sundays
  const berlinHour = getBerlinHour();
  if (berlinHour !== 10) return;

  console.log('[WeeklyCron] Sending weekly scores...');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, subscription_status, is_paused')
    .eq('is_paused', false)
    .in('subscription_status', ['active']);

  if (error || !users?.length) {
    console.log('[WeeklyCron] No users or error:', error?.message);
    return;
  }

  // Get Monday 00:00:00 Berlin time as UTC ISO string
  const weekStart = getMondayStartISO();

  console.log(`[WeeklyCron] Processing ${users.length} users, week since ${weekStart}`);

  for (const user of users) {
    try {
      await sendWeeklyScore(user, weekStart);
      await sleep(500);
    } catch (err) {
      console.error(`[WeeklyCron] Failed for ${user.phone}:`, err.message);
    }
  }

  console.log('[WeeklyCron] Done');
}

async function sendWeeklyScore(user, weekStart) {
  const { data: answers } = await supabase
    .from('user_answers')
    .select('is_correct, answered_at')
    .eq('user_id', user.id)
    .not('user_answer', 'is', null)
    .gte('answered_at', weekStart);

  const total   = answers?.length || 0;
  const correct = answers?.filter(a => a.is_correct).length || 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // All-time streak
  const { data: allAnswers } = await supabase
    .from('user_answers')
    .select('answered_at')
    .eq('user_id', user.id)
    .not('user_answer', 'is', null)
    .order('answered_at', { ascending: false });

  const streak = calcStreak(allAnswers || []);

  // Motivational line based on accuracy
  let motivation;
  if (total === 0) {
    motivation = 'Diese Woche war noch keine Zeit – diese Woche klappt es bestimmt! 💪';
  } else if (accuracy >= 80) {
    motivation = 'Beeindruckend! Du bist auf einem sehr guten Weg. 🚀';
  } else if (accuracy >= 60) {
    motivation = 'Solide Woche! Bleib dran – du wirst immer besser. 💪';
  } else if (accuracy >= 40) {
    motivation = 'Gut, dass du dabei bist! Jede Frage macht dich schlauer. 🧠';
  } else {
    motivation = 'Der Anfang ist immer das Schwerste. Weiter machen! 🔥';
  }

  const firstName = user.name?.split(' ')[0] || 'du';

  const msg =
    `🧠 *Gehirnjogging – Dein Wochenrückblick*\n\n` +
    `Hey ${firstName}! Hier ist deine Bilanz für diese Woche:\n\n` +
    (total > 0
      ? `✅ *${correct} von ${total}* Fragen richtig\n` +
        `🎯 *${accuracy}%* Genauigkeit\n` +
        `🔥 *${streak} Tage* Streak\n\n`
      : `😴 Diese Woche keine Fragen beantwortet.\n\n`) +
    `${motivation}\n\n` +
    `Bis nächste Woche! 💪\n` +
    `_gehirnjoggingclub.de_`;

  await sendFeedback(user.phone, msg);
  console.log(`[WeeklyCron] ✓ Sent to ${user.phone}`);
}

function calcStreak(answers) {
  const daySet = new Set(answers.map(a => a.answered_at.split('T')[0]));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daySet.has(d.toISOString().split('T')[0])) streak++;
    else break;
  }
  return streak;
}

function getBerlinHour() {
  const berlinStr = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    hour12: false,
  });
  return parseInt(berlinStr, 10);
}

function getMondayStartISO() {
  // Get Monday 00:00:00 of the current week in Berlin time, as UTC ISO string
  const now = new Date();
  const berlinDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const day = berlinDate.getDay(); // 0=Sun, 1=Mon ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  berlinDate.setDate(berlinDate.getDate() + diffToMonday);
  berlinDate.setHours(0, 0, 0, 0);
  // Convert back to UTC ISO
  const utcMs = berlinDate.getTime() - (berlinDate.getTimezoneOffset() * 60000);
  // Simpler: just use the date string and assume start of day
  const y = berlinDate.getFullYear();
  const m = String(berlinDate.getMonth() + 1).padStart(2, '0');
  const d = String(berlinDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { runWeeklyScore };
