-- Run this in Supabase SQL Editor
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_question_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS difficulty_level      INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS preferred_categories  TEXT[]  DEFAULT ARRAY['allgemeinwissen'];

-- Add numeric difficulty to quiz_questions for precise filtering
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS difficulty_score INTEGER DEFAULT 5;

-- Update existing questions with default scores
UPDATE quiz_questions SET difficulty_score = 3 WHERE difficulty = 'easy';
UPDATE quiz_questions SET difficulty_score = 5 WHERE difficulty = 'medium';
UPDATE quiz_questions SET difficulty_score = 8 WHERE difficulty = 'hard';

-- Index for fast category + difficulty filtering
CREATE INDEX IF NOT EXISTS idx_questions_category_diff
  ON quiz_questions(category, difficulty_score);
