const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

const ANSWER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

/**
 * Sends the daily quiz question to a user via WhatsApp.
 * @param {string} phoneNumber - E.g. "+491234567890"
 * @param {object} question    - { question, answer_a, answer_b, answer_c, answer_d, category }
 */
async function sendQuiz(phoneNumber, question) {
  const categoryLabel = question.category ? `📚 ${capitalize(question.category)}\n` : '';

  const message = [
    `🧠 *Gehirnjogging Quiz*`,
    `${categoryLabel}`,
    question.question,
    ``,
    `${ANSWER_EMOJIS[0]} ${question.answer_a}`,
    `${ANSWER_EMOJIS[1]} ${question.answer_b}`,
    `${ANSWER_EMOJIS[2]} ${question.answer_c}`,
    `${ANSWER_EMOJIS[3]} ${question.answer_d}`,
    ``,
    `Antworte mit 1, 2, 3 oder 4`,
  ].join('\n');

  return client.messages.create({
    from: FROM,
    to: `whatsapp:${phoneNumber}`,
    body: message,
  });
}

/**
 * Sends a text feedback message (used after the user answers).
 */
async function sendFeedback(phoneNumber, text) {
  return client.messages.create({
    from: FROM,
    to: `whatsapp:${phoneNumber}`,
    body: text,
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { sendQuiz, sendFeedback };
