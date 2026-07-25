CREATE OR REPLACE FUNCTION cancel_market(
  p_market_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_market RECORD;
  v_pred RECORD;
  v_refunded INTEGER := 0;
  v_total_refund INTEGER := 0;
BEGIN
  SELECT * INTO v_market FROM public.markets
    WHERE id = p_market_id FOR UPDATE;

  IF v_market IS NULL THEN
    RAISE EXCEPTION 'Market not found';
  END IF;
  IF v_market.status NOT IN ('open', 'closed', 'resolved', 'review') THEN
    RAISE EXCEPTION 'Market cannot be cancelled in current status';
  END IF;

  FOR v_pred IN
    SELECT * FROM public.predictions
    WHERE market_id = p_market_id AND result IN ('pending', 'won', 'lost')
    FOR UPDATE
  LOOP
    UPDATE public.predictions SET
      payout = v_pred.coins_spent,
      result = 'refunded'
    WHERE id = v_pred.id;

    UPDATE public.users SET
      coins = coins + v_pred.coins_spent
    WHERE id = v_pred.user_id;

    v_refunded := v_refunded + 1;
    v_total_refund := v_total_refund + v_pred.coins_spent;
  END LOOP;

  UPDATE public.markets SET
    status = 'cancelled',
    resolution = NULL,
    resolved_at = NOW()
  WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'refunded_count', v_refunded,
    'total_refund', v_total_refund
  );
END;
$$ LANGUAGE plpgsql;
