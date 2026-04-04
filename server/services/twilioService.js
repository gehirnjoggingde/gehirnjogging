const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

/**
 * Sends a quiz question via WhatsApp.
 * @param {string} phoneNumber
 * @param {object} question
 * @param {number} questionNumber  – e.g. 1 if first of the day
 * @param {number} totalCount      – total questions for today
 */
async function sendQuiz(phoneNumber, question, questionNumber = 1, totalCount = 1) {
  const categoryLabel = question.category
    ? `📚 ${capitalize(question.category)}\n`
    : '';

  const counter = totalCount > 1 ? ` (${questionNumber}/${totalCount})` : '';

  const message = [
    `🧠 *Gehirnjogging Quiz${counter}*`,
    categoryLabel,
    question.question,
    ``,
    `1️⃣ ${question.answer_a}`,
    `2️⃣ ${question.answer_b}`,
    `3️⃣ ${question.answer_c}`,
    `4️⃣ ${question.answer_d}`,
    ``,
    `Antworte mit 1, 2, 3 oder 4`,
  ].join('\n');

  return client.messages.create({
    from: FROM,
    to: `whatsapp:${phoneNumber}`,
    body: message,
  });
}

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
