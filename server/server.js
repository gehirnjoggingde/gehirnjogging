require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payment');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');

// Start cron jobs
require('./cron/dailyQuizCron');
require('./cron/weeklyScoreCron');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://gehirnjoggingclub.de',
  'https://www.gehirnjoggingclub.de',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, Postman, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── Stripe webhook needs raw body ───────────────────────────────────────────
// Must be registered BEFORE bodyParser.json()
app.use('/api/payment/webhook', bodyParser.raw({ type: 'application/json' }));

// ─── JSON body parser ─────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes); // Twilio incoming messages

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Twilio debug (no credentials exposed) ───────────────────────────────────
app.get('/api/debug/twilio', async (req, res) => {
  const key = process.env.ADMIN_KEY;
  if (!key || req.query.key !== key) return res.status(403).json({ error: 'Forbidden' });

  const sid = process.env.TWILIO_ACCOUNT_SID || '';
  const token = process.env.TWILIO_AUTH_TOKEN || '';
  const quizSid = process.env.TWILIO_QUIZ_TEMPLATE_SID || '';
  const welcomeSid = process.env.TWILIO_WELCOME_TEMPLATE_SID || '';

  let twilioOk = false;
  let twilioError = null;
  try {
    const twilio = require('twilio');
    const client = twilio(sid, token);
    const account = await client.api.accounts(sid).fetch();
    twilioOk = account.status === 'active';
  } catch (e) {
    twilioError = e.message;
  }

  res.json({
    twilio_account_sid: sid ? sid.substring(0, 8) + '...' : 'MISSING',
    twilio_auth_token: token ? '✅ set' : '❌ MISSING',
    quiz_template_sid: quizSid || '❌ MISSING',
    welcome_template_sid: welcomeSid || '❌ MISSING',
    twilio_account_active: twilioOk,
    twilio_error: twilioError,
    ts: new Date().toISOString(),
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Gehirnjogging server running on port ${PORT} (${process.env.NODE_ENV})`);
});
