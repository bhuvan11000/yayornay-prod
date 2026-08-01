-- ============================================================
-- MIGRATION 011: Remove description columns
-- Manual resolution means descriptions are no longer needed.
-- Affected tables: markets, community_proposals
-- (quests/achievements descriptions stay — used by their UI)
-- ============================================================

ALTER TABLE public.markets DROP COLUMN IF EXISTS description;
ALTER TABLE public.community_proposals DROP COLUMN IF EXISTS description;
