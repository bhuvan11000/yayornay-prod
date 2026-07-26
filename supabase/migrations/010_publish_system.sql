-- ============================================================
-- PREDICT ARENA — Draft & Publish System
-- Version: 010
--
-- Adds 'draft' status for pre-publish AI markets and 'admin'
-- source for manually created admin markets.
-- ============================================================

-- Extend status check to include 'draft'
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS markets_status_check;
ALTER TABLE public.markets ADD CONSTRAINT markets_status_check
  CHECK (status IN ('open', 'closed', 'resolving', 'resolved', 'review', 'cancelled', 'pending', 'rejected', 'draft'));

-- Extend source check to include 'admin'
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS markets_source_check;
ALTER TABLE public.markets ADD CONSTRAINT markets_source_check
  CHECK (source IN ('ai', 'community', 'admin'));
