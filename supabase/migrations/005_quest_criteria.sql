-- ============================================================
-- PREDICT ARENA — Quest Criteria Column
-- Version: 005
--
-- Adds a criteria JSONB column to store quest-specific
-- conditions (e.g., min confidence, target category).
-- ============================================================

ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS criteria JSONB;

-- Daily quest criteria
UPDATE public.quests SET criteria = '{"distinct_categories": true}'  WHERE title = 'Category Explorer';
UPDATE public.quests SET criteria = '{"min_confidence": 3}'          WHERE title = 'Confident Call';
UPDATE public.quests SET criteria = NULL                              WHERE title IN ('Make a Prediction', 'Triple Threat', 'Community Voice');

-- Weekly quest criteria
UPDATE public.quests SET criteria = '{"distinct_categories": true}'  WHERE title = 'Category Master';
UPDATE public.quests SET criteria = NULL                              WHERE title IN ('Winning Week', 'Active Trader', 'Streak Builder');
