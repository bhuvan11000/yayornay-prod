-- ============================================================
-- PREDICT ARENA — Production Schema
-- Single consolidated script for a fresh database.
--
-- Run this once in the Supabase SQL editor on your new project.
-- It is idempotent: safe to re-run (uses IF NOT EXISTS, etc.)
--
-- Incorporates migrations 001–012:
--   001  Table definitions
--   002  RLS policies
--   003  Core PostgreSQL functions
--   004  Static seed data (achievements, quest templates)
--   005  quests.criteria column + initial values
--   006  unlock_achievement() function
--   007  complete_quest() / update_quest_progress() functions
--   008  cancel_market() function
--   009  markets.failed_resolutions column
--   010  'draft' status + 'admin' source on markets
--   011  Drop description from markets + community_proposals
--   012  purge_expired_markets() function
-- ============================================================

-- ============================================================
-- SECTION 1: TABLES
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,

  -- Progression (XP-based, permanent)
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,

  -- Economy (coin-based, volatile)
  coins INTEGER NOT NULL DEFAULT 1000,
  rank TEXT NOT NULL DEFAULT 'Unranked',

  -- Stats
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0.0,
  net_profit INTEGER NOT NULL DEFAULT 0,

  -- Streaks
  betting_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_bet_date DATE,

  -- Login
  last_login TIMESTAMPTZ,
  last_reward_claim DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_coins    ON public.users(coins DESC);
CREATE INDEX idx_users_xp       ON public.users(xp DESC);
CREATE INDEX idx_users_rank     ON public.users(rank);
CREATE INDEX idx_users_accuracy ON public.users(accuracy DESC) WHERE total_predictions >= 20;

-- ── MARKETS ──────────────────────────────────────────────────
-- NOTE: description column omitted (dropped in 011).
-- NOTE: status includes 'draft' (added in 010).
-- NOTE: source includes 'admin' (added in 010).
-- NOTE: failed_resolutions included (added in 009).
CREATE TABLE public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sports', 'tech', 'popculture', 'politics', 'memes')),
  source TEXT NOT NULL CHECK (source IN ('ai', 'community', 'admin')),

  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'resolving', 'resolved', 'review', 'cancelled', 'pending', 'rejected', 'draft')),
  resolution TEXT CHECK (resolution IN ('yes', 'no')),
  resolution_source TEXT,
  resolution_criteria TEXT,
  failed_resolutions INTEGER NOT NULL DEFAULT 0,

  -- AMM State
  q_yes REAL NOT NULL DEFAULT 0,
  q_no  REAL NOT NULL DEFAULT 0,
  b     REAL NOT NULL DEFAULT 100,
  yes_price REAL NOT NULL DEFAULT 0.50,
  no_price  REAL NOT NULL DEFAULT 0.50,

  -- Engagement
  volume INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,

  creator_id UUID REFERENCES public.users(id),

  -- Timing
  opens_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  dispute_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_markets_status     ON public.markets(status);
CREATE INDEX idx_markets_category   ON public.markets(category);
CREATE INDEX idx_markets_closes_at  ON public.markets(closes_at) WHERE status = 'open';
CREATE INDEX idx_markets_created_at ON public.markets(created_at DESC);

-- ── PREDICTIONS ───────────────────────────────────────────────
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  market_id UUID NOT NULL REFERENCES public.markets(id),

  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  shares REAL NOT NULL,
  entry_price REAL NOT NULL,
  coins_spent INTEGER NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence IN (1, 2, 3, 5)),

  payout INTEGER,
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'won', 'lost', 'sold', 'refunded')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_user    ON public.predictions(user_id);
CREATE INDEX idx_predictions_market  ON public.predictions(market_id);
CREATE INDEX idx_predictions_pending ON public.predictions(market_id) WHERE result = 'pending';

-- ── MARKET PRICE HISTORY ──────────────────────────────────────
CREATE TABLE public.market_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  yes_price REAL NOT NULL,
  no_price  REAL NOT NULL,
  volume INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_market ON public.market_price_history(market_id, recorded_at);

-- ── COMMUNITY PROPOSALS ───────────────────────────────────────
-- NOTE: description column omitted (dropped in 011).
CREATE TABLE public.community_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID NOT NULL REFERENCES public.users(id),

  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sports', 'tech', 'popculture', 'politics', 'memes')),
  resolution_criteria TEXT NOT NULL,

  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  stake_amount INTEGER NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMPTZ NOT NULL,
  voting_deadline TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_proposals_status ON public.community_proposals(status);

-- ── PROPOSAL VOTES ────────────────────────────────────────────
CREATE TABLE public.proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  proposal_id UUID NOT NULL REFERENCES public.community_proposals(id),
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, proposal_id)
);

-- ── ACHIEVEMENTS (static definitions) ────────────────────────
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  coin_reward INTEGER NOT NULL DEFAULT 0
);

-- ── USER ACHIEVEMENTS (unlocked) ─────────────────────────────
CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.users(id),
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, achievement_id)
);

-- ── QUESTS (template definitions) ────────────────────────────
-- NOTE: criteria column included (added in 005).
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  action_type TEXT NOT NULL,
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  coin_reward INTEGER NOT NULL,
  criteria JSONB
);

-- ── USER QUESTS (active assignments) ─────────────────────────
CREATE TABLE public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  quest_id UUID NOT NULL REFERENCES public.quests(id),
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_user_quests_active ON public.user_quests(user_id) WHERE completed = FALSE;

-- ── MARKET GENERATION LOG ─────────────────────────────────────
CREATE TABLE public.market_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  markets_generated INTEGER NOT NULL DEFAULT 0,
  markets_rejected INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEASONS ───────────────────────────────────────────────────
CREATE TABLE public.seasons (
  id SERIAL PRIMARY KEY,
  season_number INTEGER NOT NULL UNIQUE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEASON REWARDS ────────────────────────────────────────────
CREATE TABLE public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id INTEGER NOT NULL REFERENCES public.seasons(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  position INTEGER NOT NULL,
  coins_before_deduction INTEGER NOT NULL,
  coin_bonus INTEGER NOT NULL,
  xp_bonus INTEGER NOT NULL,
  badge_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEASONAL BADGES ───────────────────────────────────────────
CREATE TABLE public.seasonal_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  season_number INTEGER NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('champion', 'runner_up', 'top_3')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, season_number)
);

CREATE INDEX idx_seasonal_badges_user ON public.seasonal_badges(user_id);

-- ── MARKET DISPUTES ───────────────────────────────────────────
CREATE TABLE public.market_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(market_id, user_id)
);

CREATE INDEX idx_disputes_market ON public.market_disputes(market_id);


-- ============================================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================================
-- All writes go through Netlify Functions using the service
-- role key (bypasses RLS). Only SELECT policies are defined.

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_proposals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_rewards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_disputes       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT USING (true);

-- 'draft' is intentionally excluded — hidden from public
CREATE POLICY "Markets are publicly readable"
  ON public.markets FOR SELECT
  USING (status IN ('open', 'closed', 'resolved', 'pending', 'rejected', 'review'));

CREATE POLICY "Users can read own predictions"
  ON public.predictions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Price history is public"
  ON public.market_price_history FOR SELECT USING (true);

CREATE POLICY "Proposals are publicly readable"
  ON public.community_proposals FOR SELECT USING (true);

CREATE POLICY "Proposal votes are public"
  ON public.proposal_votes FOR SELECT USING (true);

CREATE POLICY "Achievements are public"
  ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Users see own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Quests are public"
  ON public.quests FOR SELECT USING (true);

CREATE POLICY "Users see own quests"
  ON public.user_quests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Seasons are public"
  ON public.seasons FOR SELECT USING (true);

CREATE POLICY "Users see own seasonal badges"
  ON public.seasonal_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own season rewards"
  ON public.season_rewards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own disputes"
  ON public.market_disputes FOR SELECT USING (auth.uid() = user_id);

-- market_generation_log: no public policy (service role only)


-- ============================================================
-- SECTION 3: POSTGRESQL FUNCTIONS
-- ============================================================

-- ── HELPER: LMSR share calculation ───────────────────────────
CREATE OR REPLACE FUNCTION calculate_shares(
  q_yes REAL, q_no REAL, b REAL, p_position TEXT, coins REAL
) RETURNS REAL AS $$
DECLARE
  low REAL := 0;
  high REAL := coins / 0.01;
  mid REAL; cost REAL;
  current_q REAL; other_q REAL;
BEGIN
  IF p_position = 'yes' THEN current_q := q_yes; other_q := q_no;
  ELSE current_q := q_no; other_q := q_yes; END IF;

  WHILE high - low > 0.001 LOOP
    mid  := (low + high) / 2;
    cost := b * LN(EXP((current_q + mid) / b) + EXP(other_q / b))
          - b * LN(EXP(current_q / b) + EXP(other_q / b));
    IF cost < coins THEN low := mid; ELSE high := mid; END IF;
  END LOOP;

  RETURN low;
END;
$$ LANGUAGE plpgsql;

-- ── HELPER: Coin balance → rank name ─────────────────────────
CREATE OR REPLACE FUNCTION get_rank_from_coins(p_coins INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF    p_coins >= 250000 THEN RETURN 'Omniscient';
  ELSIF p_coins >=  75000 THEN RETURN 'Prophet';
  ELSIF p_coins >=  25000 THEN RETURN 'Visionary';
  ELSIF p_coins >=  10000 THEN RETURN 'Forecaster';
  ELSIF p_coins >=   5000 THEN RETURN 'Strategist';
  ELSIF p_coins >=   2500 THEN RETURN 'Analyst';
  ELSE                         RETURN 'Unranked';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── place_prediction ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_prediction(
  p_user_id UUID, p_market_id UUID,
  p_position TEXT, p_coins INTEGER, p_confidence INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_market RECORD; v_user RECORD;
  v_actual_coins INTEGER; v_shares REAL;
  v_new_q_yes REAL; v_new_q_no REAL;
  v_new_price_yes REAL; v_new_price_no REAL;
  v_new_volume INTEGER; v_prediction_id UUID; v_new_rank TEXT;
BEGIN
  v_actual_coins := p_coins * p_confidence;

  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF v_market IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.status != 'open' THEN RAISE EXCEPTION 'Market is not open'; END IF;
  IF v_market.closes_at <= NOW() THEN RAISE EXCEPTION 'Market has closed'; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF v_user IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_user.coins < v_actual_coins THEN RAISE EXCEPTION 'Insufficient coins'; END IF;

  v_shares := calculate_shares(v_market.q_yes, v_market.q_no, v_market.b, p_position, v_actual_coins::REAL);
  IF v_shares <= 0 THEN RAISE EXCEPTION 'Investment too small to receive any shares'; END IF;

  IF p_position = 'yes' THEN
    v_new_q_yes := v_market.q_yes + v_shares; v_new_q_no := v_market.q_no;
  ELSE
    v_new_q_yes := v_market.q_yes; v_new_q_no := v_market.q_no + v_shares;
  END IF;

  v_new_price_yes := EXP(v_new_q_yes / v_market.b) /
    (EXP(v_new_q_yes / v_market.b) + EXP(v_new_q_no / v_market.b));
  v_new_price_no  := 1.0 - v_new_price_yes;
  v_new_volume    := v_market.volume + v_actual_coins;

  UPDATE public.users SET
    coins = coins - v_actual_coins, xp = xp + 10,
    total_predictions = total_predictions + 1
  WHERE id = p_user_id;

  v_new_rank := get_rank_from_coins(v_user.coins - v_actual_coins);
  UPDATE public.users SET rank = v_new_rank WHERE id = p_user_id;

  v_prediction_id := gen_random_uuid();
  INSERT INTO public.predictions (id, user_id, market_id, position, shares, entry_price, coins_spent, confidence, result)
  VALUES (
    v_prediction_id, p_user_id, p_market_id, p_position, v_shares,
    CASE WHEN p_position = 'yes' THEN v_new_price_yes ELSE v_new_price_no END,
    v_actual_coins, p_confidence, 'pending'
  );

  UPDATE public.markets SET
    q_yes = v_new_q_yes, q_no = v_new_q_no,
    yes_price = v_new_price_yes, no_price = v_new_price_no,
    volume = v_new_volume,
    participant_count = (
      SELECT COUNT(DISTINCT user_id) FROM public.predictions
      WHERE market_id = p_market_id AND result IN ('pending', 'won', 'lost')
    )
  WHERE id = p_market_id;

  INSERT INTO public.market_price_history (id, market_id, yes_price, no_price, volume)
  VALUES (gen_random_uuid(), p_market_id, v_new_price_yes, v_new_price_no, v_new_volume);

  UPDATE public.users SET last_bet_date = CURRENT_DATE WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 'prediction_id', v_prediction_id, 'shares', v_shares,
    'entry_price', CASE WHEN p_position = 'yes' THEN v_new_price_yes ELSE v_new_price_no END,
    'coins_spent', v_actual_coins,
    'new_yes_price', v_new_price_yes, 'new_no_price', v_new_price_no,
    'user_coins', v_user.coins - v_actual_coins,
    'user_xp', v_user.xp + 10, 'user_rank', v_new_rank
  );
END;
$$ LANGUAGE plpgsql;

-- ── sell_shares ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sell_shares(
  p_user_id UUID, p_prediction_id UUID, p_shares_to_sell REAL
) RETURNS JSONB AS $$
DECLARE
  v_prediction RECORD; v_market RECORD; v_user RECORD;
  v_revenue REAL;
  v_new_q_yes REAL; v_new_q_no REAL;
  v_new_price_yes REAL; v_new_price_no REAL;
  v_remaining_shares REAL; v_new_volume INTEGER;
BEGIN
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id FOR UPDATE;
  IF v_prediction IS NULL THEN RAISE EXCEPTION 'Prediction not found'; END IF;
  IF v_prediction.user_id != p_user_id THEN RAISE EXCEPTION 'Not your prediction'; END IF;
  IF v_prediction.result != 'pending' THEN RAISE EXCEPTION 'Prediction has already been resolved or sold'; END IF;
  IF p_shares_to_sell <= 0 THEN RAISE EXCEPTION 'Shares to sell must be positive'; END IF;
  IF p_shares_to_sell > v_prediction.shares + 0.001 THEN RAISE EXCEPTION 'Not enough shares to sell'; END IF;

  SELECT * INTO v_market FROM public.markets WHERE id = v_prediction.market_id FOR UPDATE;
  IF v_market IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.status != 'open' THEN RAISE EXCEPTION 'Market is not open for selling'; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;

  IF v_prediction.position = 'yes' THEN
    v_revenue := v_market.b * LN(EXP(v_market.q_yes / v_market.b) + EXP(v_market.q_no / v_market.b))
               - v_market.b * LN(EXP((v_market.q_yes - p_shares_to_sell) / v_market.b) + EXP(v_market.q_no / v_market.b));
    v_new_q_yes := v_market.q_yes - p_shares_to_sell; v_new_q_no := v_market.q_no;
  ELSE
    v_revenue := v_market.b * LN(EXP(v_market.q_yes / v_market.b) + EXP(v_market.q_no / v_market.b))
               - v_market.b * LN(EXP(v_market.q_yes / v_market.b) + EXP((v_market.q_no - p_shares_to_sell) / v_market.b));
    v_new_q_yes := v_market.q_yes; v_new_q_no := v_market.q_no - p_shares_to_sell;
  END IF;

  v_revenue := FLOOR(v_revenue);

  v_new_price_yes := EXP(v_new_q_yes / v_market.b) /
    (EXP(v_new_q_yes / v_market.b) + EXP(v_new_q_no / v_market.b));
  v_new_price_no  := 1.0 - v_new_price_yes;
  v_new_volume    := v_market.volume;

  UPDATE public.users SET coins = coins + v_revenue::INTEGER WHERE id = p_user_id;

  v_remaining_shares := v_prediction.shares - p_shares_to_sell;
  IF v_remaining_shares <= 0 THEN
    UPDATE public.predictions SET shares = 0, result = 'sold', payout = v_revenue::INTEGER WHERE id = p_prediction_id;
  ELSE
    UPDATE public.predictions SET
      shares = v_remaining_shares,
      coins_spent = FLOOR(v_prediction.coins_spent * (v_remaining_shares / v_prediction.shares))
    WHERE id = p_prediction_id;
  END IF;

  UPDATE public.markets SET
    q_yes = v_new_q_yes, q_no = v_new_q_no,
    yes_price = v_new_price_yes, no_price = v_new_price_no, volume = v_new_volume
  WHERE id = v_market.id;

  INSERT INTO public.market_price_history (id, market_id, yes_price, no_price, volume)
  VALUES (gen_random_uuid(), v_market.id, v_new_price_yes, v_new_price_no, v_new_volume);

  UPDATE public.users SET rank = get_rank_from_coins(v_user.coins + v_revenue::INTEGER) WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'coins_received', v_revenue::INTEGER, 'shares_sold', p_shares_to_sell,
    'shares_remaining', GREATEST(v_remaining_shares, 0),
    'new_yes_price', v_new_price_yes, 'new_no_price', v_new_price_no,
    'user_coins', v_user.coins + v_revenue::INTEGER
  );
END;
$$ LANGUAGE plpgsql;

-- ── resolve_market ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION resolve_market(
  p_market_id UUID, p_resolution TEXT, p_source TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_market RECORD; v_pred RECORD; v_user_update RECORD;
  v_payout INTEGER; v_profit INTEGER;
  v_winners INTEGER := 0; v_losers INTEGER := 0; v_total_payout INTEGER := 0;
BEGIN
  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF v_market IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.status NOT IN ('open', 'closed', 'resolving') THEN RAISE EXCEPTION 'Market cannot be resolved in current status'; END IF;
  IF p_resolution NOT IN ('yes', 'no') THEN RAISE EXCEPTION 'Resolution must be yes or no'; END IF;

  FOR v_pred IN
    SELECT * FROM public.predictions WHERE market_id = p_market_id AND result = 'pending' FOR UPDATE
  LOOP
    IF v_pred.position = p_resolution THEN
      v_payout := FLOOR(v_pred.shares);
      v_profit := v_payout - v_pred.coins_spent;
      UPDATE public.predictions SET payout = v_payout, result = 'won' WHERE id = v_pred.id;
      UPDATE public.users SET
        coins = coins + v_payout,
        correct_predictions = correct_predictions + 1,
        accuracy = (COALESCE(correct_predictions, 0) + 1)::REAL / NULLIF(total_predictions, 0),
        net_profit = net_profit + v_profit,
        xp = xp + (25 * v_pred.confidence)
      WHERE id = v_pred.user_id;
      v_winners := v_winners + 1; v_total_payout := v_total_payout + v_payout;
    ELSE
      UPDATE public.predictions SET payout = 0, result = 'lost' WHERE id = v_pred.id;
      UPDATE public.users SET
        accuracy = COALESCE(correct_predictions, 0)::REAL / NULLIF(total_predictions, 0),
        net_profit = net_profit - v_pred.coins_spent,
        xp = xp + 5
      WHERE id = v_pred.user_id;
      v_losers := v_losers + 1;
    END IF;
  END LOOP;

  FOR v_user_update IN SELECT DISTINCT user_id FROM public.predictions WHERE market_id = p_market_id LOOP
    UPDATE public.users SET rank = get_rank_from_coins(coins) WHERE id = v_user_update.user_id;
  END LOOP;

  UPDATE public.markets SET
    status = 'resolved', resolution = p_resolution, resolution_source = p_source,
    resolved_at = NOW(), dispute_deadline = NOW() + INTERVAL '24 hours'
  WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true, 'market_id', p_market_id, 'resolution', p_resolution,
    'winners', v_winners, 'losers', v_losers, 'total_payout', v_total_payout
  );
END;
$$ LANGUAGE plpgsql;

-- ── cancel_market ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cancel_market(p_market_id UUID) RETURNS JSONB AS $$
DECLARE
  v_market RECORD; v_pred RECORD;
  v_refunded INTEGER := 0; v_total_refund INTEGER := 0;
BEGIN
  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF v_market IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.status NOT IN ('open', 'closed', 'resolved', 'review') THEN
    RAISE EXCEPTION 'Market cannot be cancelled in current status';
  END IF;

  FOR v_pred IN
    SELECT * FROM public.predictions WHERE market_id = p_market_id AND result IN ('pending', 'won', 'lost') FOR UPDATE
  LOOP
    UPDATE public.predictions SET payout = v_pred.coins_spent, result = 'refunded' WHERE id = v_pred.id;
    UPDATE public.users SET coins = coins + v_pred.coins_spent WHERE id = v_pred.user_id;
    v_refunded := v_refunded + 1; v_total_refund := v_total_refund + v_pred.coins_spent;
  END LOOP;

  UPDATE public.markets SET status = 'cancelled', resolution = NULL, resolved_at = NOW() WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true, 'market_id', p_market_id,
    'refunded_count', v_refunded, 'total_refund', v_total_refund
  );
END;
$$ LANGUAGE plpgsql;

-- ── claim_daily_reward ────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user RECORD; v_is_sunday BOOLEAN;
  v_reward_coins INTEGER; v_reward_xp INTEGER;
  v_current_date DATE; v_is_active BOOLEAN; v_new_rank TEXT;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF v_user IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  v_current_date := CURRENT_DATE;
  v_is_sunday    := EXTRACT(DOW FROM v_current_date) = 0;
  v_is_active    := v_user.last_bet_date IS NOT NULL
                    AND v_user.last_bet_date >= v_current_date - INTERVAL '7 days';

  IF NOT v_is_active THEN RAISE EXCEPTION 'Daily rewards locked: place a bet to reactivate'; END IF;
  IF v_user.last_reward_claim = v_current_date THEN RAISE EXCEPTION 'Daily reward already claimed today'; END IF;

  CASE v_user.rank
    WHEN 'Omniscient' THEN v_reward_coins := 1000; v_reward_xp := 100;
    WHEN 'Prophet'    THEN v_reward_coins :=  500; v_reward_xp :=  50;
    WHEN 'Visionary'  THEN v_reward_coins :=  250; v_reward_xp :=  25;
    WHEN 'Forecaster' THEN v_reward_coins :=  150; v_reward_xp :=  15;
    WHEN 'Strategist' THEN v_reward_coins :=  100; v_reward_xp :=  10;
    WHEN 'Analyst'    THEN v_reward_coins :=   75; v_reward_xp :=   8;
    ELSE                   v_reward_coins :=   50; v_reward_xp :=   5;
  END CASE;

  IF v_is_sunday THEN v_reward_coins := v_reward_coins * 3; v_reward_xp := v_reward_xp * 3; END IF;

  UPDATE public.users SET
    coins = coins + v_reward_coins, xp = xp + v_reward_xp,
    last_reward_claim = v_current_date
  WHERE id = p_user_id;

  v_new_rank := get_rank_from_coins(v_user.coins + v_reward_coins);
  UPDATE public.users SET rank = v_new_rank WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'coins_awarded', v_reward_coins, 'xp_awarded', v_reward_xp,
    'is_sunday', v_is_sunday, 'new_rank', v_new_rank,
    'user_coins', v_user.coins + v_reward_coins, 'user_xp', v_user.xp + v_reward_xp
  );
END;
$$ LANGUAGE plpgsql;

-- ── process_season_transition ─────────────────────────────────
CREATE OR REPLACE FUNCTION process_season_transition(p_season_number INTEGER) RETURNS JSONB AS $$
DECLARE
  v_user RECORD; v_top_users RECORD;
  v_new_season_id INTEGER; v_position INTEGER;
  v_new_coins INTEGER; v_deduction INTEGER;
BEGIN
  UPDATE public.seasons SET status = 'completed', ends_at = NOW()
  WHERE season_number = p_season_number - 1 AND status = 'active';

  INSERT INTO public.seasons (season_number, starts_at, ends_at, status)
  VALUES (p_season_number, NOW(), DATE_TRUNC('month', NOW()) + INTERVAL '1 month', 'active')
  RETURNING id INTO v_new_season_id;

  v_position := 0;
  FOR v_top_users IN
    SELECT id, coins, username FROM public.users WHERE coins >= 2500 ORDER BY coins DESC LIMIT 10
  LOOP
    v_position := v_position + 1;
    CASE v_position
      WHEN 1 THEN
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus, badge_slug)
        VALUES (v_new_season_id, v_top_users.id, 1, v_top_users.coins, 5000, 1000, 'season_' || p_season_number || '_champion');
        INSERT INTO public.seasonal_badges (user_id, season_number, badge_type) VALUES (v_top_users.id, p_season_number, 'champion');
        UPDATE public.users SET coins = coins + 5000, xp = xp + 1000 WHERE id = v_top_users.id;
      WHEN 2 THEN
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus, badge_slug)
        VALUES (v_new_season_id, v_top_users.id, 2, v_top_users.coins, 3000, 750, 'season_' || p_season_number || '_runner_up');
        INSERT INTO public.seasonal_badges (user_id, season_number, badge_type) VALUES (v_top_users.id, p_season_number, 'runner_up');
        UPDATE public.users SET coins = coins + 3000, xp = xp + 750 WHERE id = v_top_users.id;
      WHEN 3 THEN
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus, badge_slug)
        VALUES (v_new_season_id, v_top_users.id, 3, v_top_users.coins, 2000, 500, 'season_' || p_season_number || '_top_3');
        INSERT INTO public.seasonal_badges (user_id, season_number, badge_type) VALUES (v_top_users.id, p_season_number, 'top_3');
        UPDATE public.users SET coins = coins + 2000, xp = xp + 500 WHERE id = v_top_users.id;
      ELSE
        INSERT INTO public.season_rewards (season_id, user_id, position, coins_before_deduction, coin_bonus, xp_bonus)
        VALUES (v_new_season_id, v_top_users.id, v_position, v_top_users.coins, 1000, 250);
        UPDATE public.users SET coins = coins + 1000, xp = xp + 250 WHERE id = v_top_users.id;
    END CASE;
  END LOOP;

  FOR v_user IN SELECT id, coins FROM public.users FOR UPDATE LOOP
    v_new_coins := GREATEST(1000, FLOOR(v_user.coins * 0.75)::INTEGER);
    v_deduction := v_user.coins - v_new_coins;
    IF v_deduction > 0 THEN
      UPDATE public.users SET coins = v_new_coins, rank = get_rank_from_coins(v_new_coins) WHERE id = v_user.id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 'new_season_id', v_new_season_id,
    'season_number', p_season_number, 'top_players_awarded', LEAST(v_position, 10)
  );
END;
$$ LANGUAGE plpgsql;

-- ── check_and_update_betting_streak ──────────────────────────
CREATE OR REPLACE FUNCTION check_and_update_betting_streak(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user RECORD; v_today DATE;
  v_new_streak INTEGER; v_new_longest INTEGER;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF v_user IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  v_today := CURRENT_DATE;

  IF v_user.last_bet_date IS NULL THEN
    v_new_streak := 1; v_new_longest := 1;
  ELSIF v_user.last_bet_date = v_today THEN
    RETURN jsonb_build_object('streak', v_user.betting_streak, 'longest', v_user.longest_streak, 'changed', false);
  ELSIF v_user.last_bet_date = v_today - 1 THEN
    v_new_streak  := v_user.betting_streak + 1;
    v_new_longest := GREATEST(v_new_streak, v_user.longest_streak);
  ELSE
    v_new_streak  := 1; v_new_longest := v_user.longest_streak;
  END IF;

  UPDATE public.users SET
    betting_streak = v_new_streak, longest_streak = v_new_longest, last_bet_date = v_today
  WHERE id = p_user_id;

  RETURN jsonb_build_object('streak', v_new_streak, 'longest', v_new_longest, 'changed', true);
END;
$$ LANGUAGE plpgsql;

-- ── unlock_achievement ────────────────────────────────────────
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID, p_achievement_id UUID, p_xp INTEGER, p_coins INTEGER
) RETURNS JSONB AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.users SET xp = xp + p_xp, coins = coins + p_coins WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ── complete_quest ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_quest(
  p_user_quest_id UUID, p_user_id UUID,
  p_coins INTEGER, p_xp INTEGER, p_new_progress INTEGER
) RETURNS JSONB AS $$
BEGIN
  UPDATE public.user_quests SET progress = p_new_progress, completed = TRUE WHERE id = p_user_quest_id;
  UPDATE public.users SET coins = coins + p_coins, xp = xp + p_xp WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ── update_quest_progress ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_quest_id UUID, p_new_progress INTEGER
) RETURNS JSONB AS $$
BEGIN
  UPDATE public.user_quests SET progress = p_new_progress WHERE id = p_user_quest_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ── purge_expired_markets ─────────────────────────────────────
-- Deletes resolved/cancelled markets older than 7 weeks and all
-- related data. price_history removed via ON DELETE CASCADE.
CREATE OR REPLACE FUNCTION purge_expired_markets() RETURNS JSONB AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := NOW() - INTERVAL '7 weeks';
  v_market_ids UUID[];
  v_markets INTEGER := 0; v_predictions INTEGER := 0;
  v_disputes INTEGER := 0; v_history INTEGER := 0;
BEGIN
  SELECT ARRAY_AGG(id) INTO v_market_ids
  FROM public.markets
  WHERE status IN ('resolved', 'cancelled')
    AND resolved_at IS NOT NULL
    AND resolved_at <= v_cutoff;

  IF v_market_ids IS NULL OR CARDINALITY(v_market_ids) = 0 THEN
    RETURN jsonb_build_object(
      'markets_deleted', 0, 'predictions_deleted', 0,
      'disputes_deleted', 0, 'price_history_deleted', 0
    );
  END IF;

  SELECT COUNT(*) INTO v_history FROM public.market_price_history WHERE market_id = ANY(v_market_ids);

  DELETE FROM public.predictions WHERE market_id = ANY(v_market_ids);
  GET DIAGNOSTICS v_predictions = ROW_COUNT;

  DELETE FROM public.market_disputes WHERE market_id = ANY(v_market_ids);
  GET DIAGNOSTICS v_disputes = ROW_COUNT;

  DELETE FROM public.markets WHERE id = ANY(v_market_ids);
  GET DIAGNOSTICS v_markets = ROW_COUNT;

  RETURN jsonb_build_object(
    'markets_deleted', v_markets, 'predictions_deleted', v_predictions,
    'disputes_deleted', v_disputes, 'price_history_deleted', v_history
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- SECTION 4: STATIC SEED DATA
-- ============================================================
-- Required application data — NOT test/dev data.
-- The app cannot function without achievements and quest templates.

-- ── Achievements (16 total) ───────────────────────────────────
INSERT INTO public.achievements (slug, title, description, icon, xp_reward, coin_reward) VALUES
  ('first_prediction',  'First Prediction',   'Place your first prediction',                               'target',       50,  100),
  ('on_a_roll',         'On a Roll',          '3-day betting streak',                                      'flame',       100,  150),
  ('hot_streak',        'Hot Streak',         '7-day betting streak',                                      'flame',       250,  300),
  ('unstoppable',       'Unstoppable',        '15-day betting streak',                                     'flame',       500,  500),
  ('iron_will',         'Iron Will',          '30-day betting streak',                                     'flame',       750,  750),
  ('diversified',       'Diversified',        'Predict in 5 different categories',                         'layers',      100,  100),
  ('contrarian',        'Contrarian',         'Win a prediction where you were in the <10% minority',      'trend-down',  300,  250),
  ('whale',             'Whale',              'Reach Forecaster rank (10,000 coins)',                      'fish-symbol', 200,    0),
  ('early_bird',        'Early Bird',         'Predict within the first hour of a market opening',         'sunrise',      75,   50),
  ('century',           'Century',            'Make 100 total predictions',                                'sigma',       300,  200),
  ('sharp_eye',         'Sharp Eye',          'Maintain 70%+ accuracy over 50+ predictions',               'eye',         400,  300),
  ('market_maker',      'Market Maker',       'Get a community market proposal approved',                  'store',       200,  150),
  ('trendsetter',       'Trendsetter',        'Create a community market with 50+ participants',            'trending-up', 400,  300),
  ('ranked_up',         'Ranked Up',          'Reach Analyst rank (2,500 coins)',                          'badge-check', 100,  100),
  ('rising_star',       'Rising Star',        'Reach Strategist rank (5,000 coins)',                       'star',        250,  250),
  ('seasoned_trader',   'Seasoned Trader',    'Participate in 3 different seasons',                        'calendar',    300,  200);

-- ── Quest Templates (5 daily, 4 weekly) ──────────────────────
INSERT INTO public.quests (title, description, type, action_type, target, xp_reward, coin_reward, criteria) VALUES
  ('Make a Prediction',  'Place 1 prediction today',                            'daily',  'predict',    1,  25,  25, NULL),
  ('Triple Threat',      'Place 3 predictions today',                           'daily',  'predict',    3,  75,  50, NULL),
  ('Category Explorer',  'Predict in 2 different categories today',              'daily',  'category',   2,  50,  50, '{"distinct_categories": true}'),
  ('Confident Call',     'Place a prediction at 3x+ confidence today',           'daily',  'confidence', 1,  50,  25, '{"min_confidence": 3}'),
  ('Community Voice',    'Upvote/downvote 3 community market proposals today',   'daily',  'vote',       3,  25,  25, NULL),
  ('Winning Week',       'Get 5 correct predictions this week',                  'weekly', 'win',        5, 200, 200, NULL),
  ('Active Trader',      'Place 15 predictions this week',                       'weekly', 'predict',   15, 150, 150, NULL),
  ('Category Master',    'Win 3 predictions in a single category this week',      'weekly', 'win',        3, 200, 150, '{"distinct_categories": true}'),
  ('Streak Builder',     'Achieve a 5-day login streak this week',               'weekly', 'login',      5, 150, 100, NULL);


-- ============================================================
-- SECTION 5: INITIAL SEASON
-- ============================================================
-- Season 1 starts now and runs through the end of the current
-- calendar month. Adjust dates if needed.

INSERT INTO public.seasons (season_number, starts_at, ends_at, status)
VALUES (
  1,
  NOW(),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  'active'
);
