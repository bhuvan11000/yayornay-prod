-- ============================================================
-- MIGRATION 012: Purge expired markets
-- Permanently deletes markets (and ALL related data) that were
-- resolved or cancelled more than 7 weeks ago.
--
-- Criteria: status IN ('resolved', 'cancelled')
--           AND resolved_at <= NOW() - INTERVAL '7 weeks'
--
-- Both resolve_market() and cancel_market() set resolved_at,
-- so this single timestamp anchors the cutoff for both paths.
--
-- Related data:
--   - market_price_history: removed via ON DELETE CASCADE
--   - predictions:          no cascade -> deleted explicitly
--   - market_disputes:      no cascade -> deleted explicitly
-- ============================================================

CREATE OR REPLACE FUNCTION purge_expired_markets()
RETURNS JSONB AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := NOW() - INTERVAL '7 weeks';
  v_market_ids UUID[];
  v_markets INTEGER := 0;
  v_predictions INTEGER := 0;
  v_disputes INTEGER := 0;
  v_history INTEGER := 0;
BEGIN
  SELECT ARRAY_AGG(id) INTO v_market_ids
  FROM public.markets
  WHERE status IN ('resolved', 'cancelled')
    AND resolved_at IS NOT NULL
    AND resolved_at <= v_cutoff;

  IF v_market_ids IS NULL OR CARDINALITY(v_market_ids) = 0 THEN
    RETURN jsonb_build_object(
      'markets_deleted', 0,
      'predictions_deleted', 0,
      'disputes_deleted', 0,
      'price_history_deleted', 0
    );
  END IF;

  SELECT COUNT(*) INTO v_history
  FROM public.market_price_history
  WHERE market_id = ANY(v_market_ids);

  DELETE FROM public.predictions
  WHERE market_id = ANY(v_market_ids);
  GET DIAGNOSTICS v_predictions = ROW_COUNT;

  DELETE FROM public.market_disputes
  WHERE market_id = ANY(v_market_ids);
  GET DIAGNOSTICS v_disputes = ROW_COUNT;

  DELETE FROM public.markets
  WHERE id = ANY(v_market_ids);
  GET DIAGNOSTICS v_markets = ROW_COUNT;

  RETURN jsonb_build_object(
    'markets_deleted', v_markets,
    'predictions_deleted', v_predictions,
    'disputes_deleted', v_disputes,
    'price_history_deleted', v_history
  );
END;
$$ LANGUAGE plpgsql;
