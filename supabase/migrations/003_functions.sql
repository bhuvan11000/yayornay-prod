-- ============================================================
-- PREDICT ARENA — PostgreSQL Functions
-- Version: 003
--
-- All write operations that touch multiple tables run as
-- PostgreSQL functions via supabase.rpc(). This guarantees
-- atomicity and uses FOR UPDATE row locking to prevent
-- concurrent trade corruption.
-- ============================================================

-- ============================================================
-- HELPER: Calculate shares using LMSR binary search
-- Returns the number of shares received for a given cost
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_shares(
  q_yes REAL,
  q_no REAL,
  b REAL,
  p_position TEXT,
  coins REAL
) RETURNS REAL AS $$
DECLARE
  low REAL := 0;
  high REAL := coins / 0.01;
  mid REAL;
  cost REAL;
  current_q REAL;
  other_q REAL;
BEGIN
  IF p_position = 'yes' THEN
    current_q := q_yes;
    other_q := q_no;
  ELSE
    current_q := q_no;
    other_q := q_yes;
  END IF;

  -- Binary search for shares
  WHILE high - low > 0.001 LOOP
    mid := (low + high) / 2;
    cost := b * LN(EXP((current_q + mid) / b) + EXP(other_q / b))
          - b * LN(EXP(current_q / b) + EXP(other_q / b));

    IF cost < coins THEN
      low := mid;
    ELSE
      high := mid;
    END IF;
  END LOOP;

  RETURN low;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER: Get rank name from coin balance
-- ============================================================
CREATE OR REPLACE FUNCTION get_rank_from_coins(p_coins INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_coins >= 250000 THEN RETURN 'Omniscient';
  ELSIF p_coins >= 75000 THEN RETURN 'Prophet';
  ELSIF p_coins >= 25000 THEN RETURN 'Visionary';
  ELSIF p_coins >= 10000 THEN RETURN 'Forecaster';
  ELSIF p_coins >= 5000 THEN RETURN 'Strategist';
  ELSIF p_coins >= 2500 THEN RETURN 'Analyst';
  ELSE RETURN 'Unranked';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: place_prediction
-- Atomic transaction with FOR UPDATE row locking.
-- Includes LMSR share calculation, coin deduction, rank
-- recalculation, prediction insert, market state update,
-- and price history insert.
-- ============================================================
CREATE OR REPLACE FUNCTION place_prediction(
  p_user_id UUID,
  p_market_id UUID,
  p_position TEXT,
  p_coins INTEGER,
  p_confidence INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_market RECORD;
  v_user RECORD;
  v_actual_coins INTEGER;
  v_shares REAL;
  v_new_q_yes REAL;
  v_new_q_no REAL;
  v_new_price_yes REAL;
  v_new_price_no REAL;
  v_new_volume INTEGER;
  v_prediction_id UUID;
  v_new_rank TEXT;
BEGIN
  v_actual_coins := p_coins * p_confidence;

  -- Lock market row to prevent concurrent trades
  SELECT * INTO v_market FROM public.markets
    WHERE id = p_market_id FOR UPDATE;

  IF v_market IS NULL THEN
    RAISE EXCEPTION 'Market not found';
  END IF;
  IF v_market.status != 'open' THEN
    RAISE EXCEPTION 'Market is not open';
  END IF;
  IF v_market.closes_at <= NOW() THEN
    RAISE EXCEPTION 'Market has closed';
  END IF;

  -- Lock user row to prevent double-spend
  SELECT * INTO v_user FROM public.users
    WHERE id = p_user_id FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF v_user.coins < v_actual_coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Calculate shares received for v_actual_coins using binary search
  v_shares := calculate_shares(
    v_market.q_yes, v_market.q_no, v_market.b,
    p_position, v_actual_coins::REAL
  );

  -- Guard against zero shares
  IF v_shares <= 0 THEN
    RAISE EXCEPTION 'Investment too small to receive any shares';
  END IF;

  -- Calculate new market state
  IF p_position = 'yes' THEN
    v_new_q_yes := v_market.q_yes + v_shares;
    v_new_q_no := v_market.q_no;
  ELSE
    v_new_q_yes := v_market.q_yes;
    v_new_q_no := v_market.q_no + v_shares;
  END IF;

  v_new_price_yes := EXP(v_new_q_yes / v_market.b) /
    (EXP(v_new_q_yes / v_market.b) + EXP(v_new_q_no / v_market.b));
  v_new_price_no := 1.0 - v_new_price_yes;

  v_new_volume := v_market.volume + v_actual_coins;

  -- ===== ATOMIC WRITES =====

  -- Deduct coins and award XP for placing prediction
  UPDATE public.users SET
    coins = coins - v_actual_coins,
    xp = xp + 10,
    total_predictions = total_predictions + 1
  WHERE id = p_user_id;

  -- Update rank based on new coin balance
  v_new_rank := get_rank_from_coins(v_user.coins - v_actual_coins);
  UPDATE public.users SET
    rank = v_new_rank
  WHERE id = p_user_id;

  -- Insert prediction
  v_prediction_id := gen_random_uuid();
  INSERT INTO public.predictions (
    id, user_id, market_id, position, shares,
    entry_price, coins_spent, confidence, result
  ) VALUES (
    v_prediction_id, p_user_id, p_market_id, p_position, v_shares,
    CASE WHEN p_position = 'yes' THEN v_new_price_yes ELSE v_new_price_no END,
    v_actual_coins, p_confidence, 'pending'
  );

  -- Update market
  UPDATE public.markets SET
    q_yes = v_new_q_yes,
    q_no = v_new_q_no,
    yes_price = v_new_price_yes,
    no_price = v_new_price_no,
    volume = v_new_volume,
    participant_count = (
      SELECT COUNT(DISTINCT user_id) FROM public.predictions
      WHERE market_id = p_market_id AND result IN ('pending', 'won', 'lost')
    )
  WHERE id = p_market_id;

  -- Record price history
  INSERT INTO public.market_price_history (id, market_id, yes_price, no_price, volume)
  VALUES (gen_random_uuid(), p_market_id, v_new_price_yes, v_new_price_no, v_new_volume);

  -- Update betting streak
  UPDATE public.users SET
    last_bet_date = CURRENT_DATE
  WHERE id = p_user_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'prediction_id', v_prediction_id,
    'shares', v_shares,
    'entry_price', CASE WHEN p_position = 'yes' THEN v_new_price_yes ELSE v_new_price_no END,
    'coins_spent', v_actual_coins,
    'new_yes_price', v_new_price_yes,
    'new_no_price', v_new_price_no,
    'user_coins', v_user.coins - v_actual_coins,
    'user_xp', v_user.xp + 10,
    'user_rank', v_new_rank
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: sell_shares
-- Handle partial sells (reduce shares, track cost basis) and
-- full sells (mark as 'sold'). Update market state, record
-- price history.
-- ============================================================
CREATE OR REPLACE FUNCTION sell_shares(
  p_user_id UUID,
  p_prediction_id UUID,
  p_shares_to_sell REAL
) RETURNS JSONB AS $$
DECLARE
  v_prediction RECORD;
  v_market RECORD;
  v_user RECORD;
  v_revenue REAL;
  v_new_q_yes REAL;
  v_new_q_no REAL;
  v_new_price_yes REAL;
  v_new_price_no REAL;
  v_remaining_shares REAL;
  v_new_volume INTEGER;
BEGIN
  -- Lock prediction
  SELECT * INTO v_prediction FROM public.predictions
    WHERE id = p_prediction_id FOR UPDATE;

  IF v_prediction IS NULL THEN
    RAISE EXCEPTION 'Prediction not found';
  END IF;
  IF v_prediction.user_id != p_user_id THEN
    RAISE EXCEPTION 'Not your prediction';
  END IF;
  IF v_prediction.result != 'pending' THEN
    RAISE EXCEPTION 'Prediction has already been resolved or sold';
  END IF;
  IF p_shares_to_sell <= 0 THEN
    RAISE EXCEPTION 'Shares to sell must be positive';
  END IF;
  -- Use a small epsilon (0.001) to tolerate REAL floating-point drift between
  -- what the DB stores and what the client sends (e.g. 702.6500015 vs 702.65).
  IF p_shares_to_sell > v_prediction.shares + 0.001 THEN
    RAISE EXCEPTION 'Not enough shares to sell';
  END IF;

  -- Lock market
  SELECT * INTO v_market FROM public.markets
    WHERE id = v_prediction.market_id FOR UPDATE;

  IF v_market IS NULL THEN
    RAISE EXCEPTION 'Market not found';
  END IF;
  IF v_market.status != 'open' THEN
    RAISE EXCEPTION 'Market is not open for selling';
  END IF;

  -- Lock user
  SELECT * INTO v_user FROM public.users
    WHERE id = p_user_id FOR UPDATE;

  -- ===== LMSR SELL CALCULATION =====
  -- Revenue = C(q_yes, q_no) - C(q_yes - n, q_no) for YES
  -- Revenue = C(q_yes, q_no) - C(q_yes, q_no - n) for NO
  IF v_prediction.position = 'yes' THEN
    v_revenue := v_market.b * LN(EXP(v_market.q_yes / v_market.b) + EXP(v_market.q_no / v_market.b))
               - v_market.b * LN(EXP((v_market.q_yes - p_shares_to_sell) / v_market.b) + EXP(v_market.q_no / v_market.b));
    v_new_q_yes := v_market.q_yes - p_shares_to_sell;
    v_new_q_no := v_market.q_no;
  ELSE
    v_revenue := v_market.b * LN(EXP(v_market.q_yes / v_market.b) + EXP(v_market.q_no / v_market.b))
               - v_market.b * LN(EXP(v_market.q_yes / v_market.b) + EXP((v_market.q_no - p_shares_to_sell) / v_market.b));
    v_new_q_yes := v_market.q_yes;
    v_new_q_no := v_market.q_no - p_shares_to_sell;
  END IF;

  -- Floor revenue to integer (coins are whole numbers)
  v_revenue := FLOOR(v_revenue);

  -- Calculate new prices
  v_new_price_yes := EXP(v_new_q_yes / v_market.b) /
    (EXP(v_new_q_yes / v_market.b) + EXP(v_new_q_no / v_market.b));
  v_new_price_no := 1.0 - v_new_price_yes;

  v_new_volume := v_market.volume;

  -- ===== ATOMIC WRITES =====

  -- Add coins to user
  UPDATE public.users SET
    coins = coins + v_revenue::INTEGER
  WHERE id = p_user_id;

  -- Update prediction
  v_remaining_shares := v_prediction.shares - p_shares_to_sell;

  IF v_remaining_shares <= 0 THEN
    -- Full sell: mark as sold
    UPDATE public.predictions SET
      shares = 0,
      result = 'sold',
      payout = v_revenue::INTEGER
    WHERE id = p_prediction_id;
  ELSE
    -- Partial sell: reduce shares, adjust cost basis proportionally
    UPDATE public.predictions SET
      shares = v_remaining_shares,
      coins_spent = FLOOR(v_prediction.coins_spent * (v_remaining_shares / v_prediction.shares))
    WHERE id = p_prediction_id;
  END IF;

  -- Update market state
  UPDATE public.markets SET
    q_yes = v_new_q_yes,
    q_no = v_new_q_no,
    yes_price = v_new_price_yes,
    no_price = v_new_price_no,
    volume = v_new_volume
  WHERE id = v_market.id;

  -- Record price history
  INSERT INTO public.market_price_history (id, market_id, yes_price, no_price, volume)
  VALUES (gen_random_uuid(), v_market.id, v_new_price_yes, v_new_price_no, v_new_volume);

  -- Check rank change
  UPDATE public.users SET
    rank = get_rank_from_coins(v_user.coins + v_revenue::INTEGER)
  WHERE id = p_user_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'coins_received', v_revenue::INTEGER,
    'shares_sold', p_shares_to_sell,
    'shares_remaining', GREATEST(v_remaining_shares, 0),
    'new_yes_price', v_new_price_yes,
    'new_no_price', v_new_price_no,
    'user_coins', v_user.coins + v_revenue::INTEGER
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: resolve_market
-- Pay out winners at 1.00/share, update accuracy, net_profit,
-- and XP for all affected users. Set dispute_deadline.
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_market(
  p_market_id UUID,
  p_resolution TEXT,
  p_source TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_market RECORD;
  v_pred RECORD;
  v_payout INTEGER;
  v_profit INTEGER;
  v_winners INTEGER := 0;
  v_losers INTEGER := 0;
  v_total_payout INTEGER := 0;
  v_user_update RECORD;
BEGIN
  -- Lock market
  SELECT * INTO v_market FROM public.markets
    WHERE id = p_market_id FOR UPDATE;

  IF v_market IS NULL THEN
    RAISE EXCEPTION 'Market not found';
  END IF;
  IF v_market.status NOT IN ('open', 'closed', 'resolving') THEN
    RAISE EXCEPTION 'Market cannot be resolved in current status';
  END IF;
  IF p_resolution NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Resolution must be yes or no';
  END IF;

  -- Process all pending predictions
  FOR v_pred IN
    SELECT * FROM public.predictions
    WHERE market_id = p_market_id AND result = 'pending'
    FOR UPDATE
  LOOP
    IF v_pred.position = p_resolution THEN
      -- WINNER: payout = shares * 1.00
      v_payout := FLOOR(v_pred.shares);
      v_profit := v_payout - v_pred.coins_spent;

      UPDATE public.predictions SET
        payout = v_payout,
        result = 'won'
      WHERE id = v_pred.id;

      UPDATE public.users SET
        coins = coins + v_payout,
        correct_predictions = correct_predictions + 1,
        accuracy = (COALESCE(correct_predictions, 0) + 1)::REAL / NULLIF(total_predictions, 0),
        net_profit = net_profit + v_profit,
        xp = xp + (25 * v_pred.confidence)
      WHERE id = v_pred.user_id;

      v_winners := v_winners + 1;
      v_total_payout := v_total_payout + v_payout;
    ELSE
      -- LOSER: payout = 0, XP = 5
      UPDATE public.predictions SET
        payout = 0,
        result = 'lost'
      WHERE id = v_pred.id;

      UPDATE public.users SET
        accuracy = COALESCE(correct_predictions, 0)::REAL / NULLIF(total_predictions, 0),
        net_profit = net_profit - v_pred.coins_spent,
        xp = xp + 5
      WHERE id = v_pred.user_id;

      v_losers := v_losers + 1;
    END IF;
  END LOOP;

  -- Recalculate ranks for all affected users
  FOR v_user_update IN
    SELECT DISTINCT user_id FROM public.predictions
    WHERE market_id = p_market_id
  LOOP
    UPDATE public.users SET
      rank = get_rank_from_coins(coins)
    WHERE id = v_user_update.user_id;
  END LOOP;

  -- Update market status
  UPDATE public.markets SET
    status = 'resolved',
    resolution = p_resolution,
    resolution_source = p_source,
    resolved_at = NOW(),
    dispute_deadline = NOW() + INTERVAL '24 hours'
  WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'resolution', p_resolution,
    'winners', v_winners,
    'losers', v_losers,
    'total_payout', v_total_payout
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: claim_daily_reward
-- Manual-claim daily reward, rank-scaled, with inactivity lock.
-- Sunday 3x multiplier.
-- ============================================================
CREATE OR REPLACE FUNCTION claim_daily_reward(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_is_sunday BOOLEAN;
  v_reward_coins INTEGER;
  v_reward_xp INTEGER;
  v_current_date DATE;
  v_is_active BOOLEAN;
  v_new_rank TEXT;
BEGIN
  SELECT * INTO v_user FROM public.users
    WHERE id = p_user_id FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_current_date := CURRENT_DATE;
  v_is_sunday := EXTRACT(DOW FROM v_current_date) = 0;

  -- Check inactivity lock: last 7 days
  v_is_active := v_user.last_bet_date IS NOT NULL
    AND v_user.last_bet_date >= v_current_date - INTERVAL '7 days';

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Daily rewards locked: place a bet to reactivate';
  END IF;

  -- Check if already claimed today
  IF v_user.last_reward_claim = v_current_date THEN
    RAISE EXCEPTION 'Daily reward already claimed today';
  END IF;

  -- Calculate reward based on rank
  CASE v_user.rank
    WHEN 'Omniscient' THEN
      v_reward_coins := 1000; v_reward_xp := 100;
    WHEN 'Prophet' THEN
      v_reward_coins := 500; v_reward_xp := 50;
    WHEN 'Visionary' THEN
      v_reward_coins := 250; v_reward_xp := 25;
    WHEN 'Forecaster' THEN
      v_reward_coins := 150; v_reward_xp := 15;
    WHEN 'Strategist' THEN
      v_reward_coins := 100; v_reward_xp := 10;
    WHEN 'Analyst' THEN
      v_reward_coins := 75; v_reward_xp := 8;
    ELSE -- Unranked
      v_reward_coins := 50; v_reward_xp := 5;
  END CASE;

  -- Apply Sunday 3x multiplier
  IF v_is_sunday THEN
    v_reward_coins := v_reward_coins * 3;
    v_reward_xp := v_reward_xp * 3;
  END IF;

  -- Apply rewards
  UPDATE public.users SET
    coins = coins + v_reward_coins,
    xp = xp + v_reward_xp,
    last_reward_claim = v_current_date
  WHERE id = p_user_id;

  -- Check rank change
  v_new_rank := get_rank_from_coins(v_user.coins + v_reward_coins);
  UPDATE public.users SET
    rank = v_new_rank
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'coins_awarded', v_reward_coins,
    'xp_awarded', v_reward_xp,
    'is_sunday', v_is_sunday,
    'new_rank', v_new_rank,
    'user_coins', v_user.coins + v_reward_coins,
    'user_xp', v_user.xp + v_reward_xp
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: process_season_transition
-- Snapshot leaderboard, award end-of-season rewards (top 10),
-- apply 25% coin deduction with 1,000 floor, recalculate all
-- ranks, create seasonal badges for top 3, create new season.
-- ============================================================
CREATE OR REPLACE FUNCTION process_season_transition(
  p_season_number INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_top_users RECORD;
  v_new_season_id INTEGER;
  v_position INTEGER;
  v_new_coins INTEGER;
  v_deduction INTEGER;
BEGIN
  -- Complete the current season
  UPDATE public.seasons SET
    status = 'completed',
    ends_at = NOW()
  WHERE season_number = p_season_number - 1 AND status = 'active';

  -- Create new season
  INSERT INTO public.seasons (season_number, starts_at, ends_at, status)
  VALUES (p_season_number, NOW(), DATE_TRUNC('month', NOW()) + INTERVAL '1 month', 'active')
  RETURNING id INTO v_new_season_id;

  -- Award end-of-season rewards (top 10 by coins)
  v_position := 0;
  FOR v_top_users IN
    SELECT id, coins, username FROM public.users
    WHERE coins >= 2500
    ORDER BY coins DESC
    LIMIT 10
  LOOP
    v_position := v_position + 1;

    CASE v_position
      WHEN 1 THEN
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus, badge_slug)
        VALUES (v_new_season_id, v_top_users.id, 1, v_top_users.coins, 5000, 1000, 'season_' || p_season_number || '_champion');
        INSERT INTO public.seasonal_badges (user_id, season_number, badge_type)
        VALUES (v_top_users.id, p_season_number, 'champion');
        UPDATE public.users SET coins = coins + 5000, xp = xp + 1000 WHERE id = v_top_users.id;
      WHEN 2 THEN
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus, badge_slug)
        VALUES (v_new_season_id, v_top_users.id, 2, v_top_users.coins, 3000, 750, 'season_' || p_season_number || '_runner_up');
        INSERT INTO public.seasonal_badges (user_id, season_number, badge_type)
        VALUES (v_top_users.id, p_season_number, 'runner_up');
        UPDATE public.users SET coins = coins + 3000, xp = xp + 750 WHERE id = v_top_users.id;
      WHEN 3 THEN
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus, badge_slug)
        VALUES (v_new_season_id, v_top_users.id, 3, v_top_users.coins, 2000, 500, 'season_' || p_season_number || '_top_3');
        INSERT INTO public.seasonal_badges (user_id, season_number, badge_type)
        VALUES (v_top_users.id, p_season_number, 'top_3');
        UPDATE public.users SET coins = coins + 2000, xp = xp + 500 WHERE id = v_top_users.id;
      ELSE
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus)
        VALUES (v_new_season_id, v_top_users.id, v_position, v_top_users.coins, 1000, 250);
        UPDATE public.users SET coins = coins + 1000, xp = xp + 250 WHERE id = v_top_users.id;
    END CASE;
  END LOOP;

  -- Apply 25% coin deduction to all players (floor 1,000)
  FOR v_user IN
    SELECT id, coins FROM public.users FOR UPDATE
  LOOP
    v_new_coins := GREATEST(1000, FLOOR(v_user.coins * 0.75)::INTEGER);
    v_deduction := v_user.coins - v_new_coins;

    IF v_deduction > 0 THEN
      UPDATE public.users SET
        coins = v_new_coins,
        rank = get_rank_from_coins(v_new_coins)
      WHERE id = v_user.id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'new_season_id', v_new_season_id,
    'season_number', p_season_number,
    'top_players_awarded', LEAST(v_position, 10)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: check_and_update_betting_streak
-- Check last_bet_date against today. Increment streak if
-- consecutive, reset if gap detected. Update longest_streak.
-- ============================================================
CREATE OR REPLACE FUNCTION check_and_update_betting_streak(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_today DATE;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
BEGIN
  SELECT * INTO v_user FROM public.users
    WHERE id = p_user_id FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  v_today := CURRENT_DATE;

  IF v_user.last_bet_date IS NULL THEN
    -- First bet ever
    v_new_streak := 1;
    v_new_longest := 1;
  ELSIF v_user.last_bet_date = v_today THEN
    -- Already bet today
    RETURN jsonb_build_object('streak', v_user.betting_streak, 'longest', v_user.longest_streak, 'changed', false);
  ELSIF v_user.last_bet_date = v_today - 1 THEN
    -- Consecutive day
    v_new_streak := v_user.betting_streak + 1;
    v_new_longest := GREATEST(v_new_streak, v_user.longest_streak);
  ELSE
    -- Gap detected, reset
    v_new_streak := 1;
    v_new_longest := v_user.longest_streak;
  END IF;

  UPDATE public.users SET
    betting_streak = v_new_streak,
    longest_streak = v_new_longest,
    last_bet_date = v_today
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'streak', v_new_streak,
    'longest', v_new_longest,
    'changed', true
  );
END;
$$ LANGUAGE plpgsql;
