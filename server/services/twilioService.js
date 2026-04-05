const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

/**
 * Sends Q1 via approved WhatsApp template (business-initiated).
 * Falls back to free-form if template SID not configured.
 */
async function sendQuizTemplate(phoneNumber, question) {
  const templateSid = process.env.TWILIO_QUIZ_TEMPLATE_SID;

  if (templateSid) {
    return client.messages.create({
      from: FROM,
      to: `whatsapp:${phoneNumber}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify({
        '1': capitalize(question.category || 'Allgemeinwissen'),
        '2': question.question,
        '3': question.answer_a,
        '4': question.answer_b,
        '5': question.answer_c,
        '6': question.answer_d,
      }),
    });
  }

  // Fallback: free-form (only works within 24h user-initiated window)
  return sendQuiz(phoneNumber, question, 1, 1);
}

/**
 * Sends welcome message via approved WhatsApp template.
 * Falls back to free-form if template SID not configured.
 */
async function sendWelcomeTemplate(phoneNumber, name, dayStr, timeStr) {
  const templateSid = process.env.TWILIO_WELCOME_TEMPLATE_SID;

  if (templateSid) {
    return client.messages.create({
      from: FROM,
      to: `whatsapp:${phoneNumber}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify({
        '1': name,
        '2': dayStr,
        '3': timeStr,
      }),
    });
  }

  // Fallback: free-form
  return sendFeedback(phoneNumber,
    `🧠 Hey ${name}, willkommen im Gehirnjogging Club! 🎉\n\nDu hast deinem Gehirn gerade etwas richtig Gutes gegönnt. Täglich eine kleine Portion Wissen – direkt auf WhatsApp.\n\n📅 Deine erste Quiz-Frage kommt ${dayStr} um ${timeStr} Uhr.\n📚 Kategorie, Schwierigkeit & Uhrzeit kannst du jederzeit anpassen.\n\n👉 gehirnjoggingclub.de/dashboard`
  );
}

/**
 * Sends a quiz question free-form (for Q2, Q3 etc. within 24h window).
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

module.exports = { sendQuiz, sendQuizTemplate, sendWelcomeTemplate, sendFeedback };
