-- ============================================================
-- Gehirnjogging – Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR UNIQUE NOT NULL,
  name                  VARCHAR NOT NULL,
  phone                 VARCHAR UNIQUE NOT NULL,
  password_hash         VARCHAR NOT NULL,
  quiz_time             VARCHAR DEFAULT '09:00',      -- HH:MM (UTC)
  is_paused             BOOLEAN DEFAULT FALSE,
  stripe_customer_id    VARCHAR,
  stripe_subscription_id VARCHAR,
  subscription_status   VARCHAR DEFAULT 'pending',   -- pending, active, paused, past_due, cancelled
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question        TEXT NOT NULL,
  answer_a        TEXT NOT NULL,
  answer_b        TEXT NOT NULL,
  answer_c        TEXT NOT NULL,
  answer_d        TEXT NOT NULL,
  correct_answer  VARCHAR NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  explanation     TEXT,
  category        VARCHAR,         -- allgemeinwissen, geschichte, psychologie, wissenschaft, philosophie
  difficulty      VARCHAR DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  scheduled_date  DATE,            -- NULL = available for random selection
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User Answers (also tracks sent-but-unanswered via user_answer = NULL)
CREATE TABLE IF NOT EXISTS user_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_answer   VARCHAR,           -- NULL = quiz was sent, not yet answered
  is_correct    BOOLEAN DEFAULT FALSE,
  answered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);

-- Stripe Events Log (idempotent webhook processing)
CREATE TABLE IF NOT EXISTS stripe_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      VARCHAR UNIQUE NOT NULL,
  event_type    VARCHAR NOT NULL,
  customer_id   VARCHAR,
  data          JSONB,
  processed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_phone             ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer   ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_status            ON users(subscription_status, is_paused);
CREATE INDEX IF NOT EXISTS idx_questions_scheduled     ON quiz_questions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_answers_user            ON user_answers(user_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_answers_question        ON user_answers(question_id);

-- ── Row Level Security (enable but keep permissive for backend service key) ──
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events  ENABLE ROW LEVEL SECURITY;

-- Backend uses the service-role key which bypasses RLS.
-- These policies allow the anon key (frontend-safe reads) if ever needed.
-- For MVP: only the backend (service key) accesses these tables directly.

-- ── Trigger: keep updated_at current on users ─────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Sample quiz questions (optional – delete before production) ──
INSERT INTO quiz_questions (question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, category, difficulty)
VALUES
  (
    'Welcher Psychologe entwickelte das Konzept der "erlernten Hilflosigkeit"?',
    'Sigmund Freud', 'Martin Seligman', 'Carl Jung', 'Abraham Maslow',
    'b',
    'Martin Seligman entdeckte erlernte Hilflosigkeit in Experimenten mit Hunden, die zeigten, dass wiederholte unkontrollierbare Erlebnisse zu Passivität führen.',
    'psychologie', 'medium'
  ),
  (
    'In welchem Jahr fiel die Berliner Mauer?',
    '1987', '1989', '1991', '1985',
    'b',
    'Am 9. November 1989 öffnete die DDR ihre Grenzen. Tausende Berliner begannen sofort, die Mauer niederzureißen.',
    'geschichte', 'easy'
  ),
  (
    'Welches Element hat das chemische Symbol "Au"?',
    'Silber', 'Kupfer', 'Gold', 'Platin',
    'c',
    'Au kommt vom lateinischen "Aurum" (Gold). Gold war eines der ersten Metalle, das von Menschen genutzt wurde.',
    'wissenschaft', 'easy'
  ),
  (
    'Wer schrieb "Also sprach Zarathustra"?',
    'Arthur Schopenhauer', 'Immanuel Kant', 'Friedrich Nietzsche', 'Georg Hegel',
    'c',
    'Friedrich Nietzsche schrieb dieses philosophische Werk 1883–1885, in dem er Konzepte wie den Übermenschen und den Willen zur Macht entwickelte.',
    'philosophie', 'medium'
  ),
  (
    'Wie viele Knochen hat ein erwachsener Mensch?',
    '196', '206', '216', '226',
    'b',
    'Ein erwachsener Mensch hat 206 Knochen. Babys werden mit ca. 270–300 Knochen geboren, viele davon verschmelzen im Laufe des Wachstums.',
    'wissenschaft', 'medium'
  );
