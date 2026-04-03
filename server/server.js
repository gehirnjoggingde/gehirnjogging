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

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Gehirnjogging server running on port ${PORT} (${process.env.NODE_ENV})`);
});
