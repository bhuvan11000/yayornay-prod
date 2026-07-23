-- ============================================================
-- PREDICT ARENA — Database Schema
-- Version: 001
-- Description: All table definitions with indexes, constraints,
--              foreign keys, and defaults.
-- ============================================================

-- ============================================================
-- USERS — The Player
-- ============================================================
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

  -- Streaks (betting-based, achievement only)
  betting_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_bet_date DATE,

  -- Login
  last_login TIMESTAMPTZ,
  last_reward_claim DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_coins ON public.users(coins DESC);
CREATE INDEX idx_users_xp ON public.users(xp DESC);
CREATE INDEX idx_users_rank ON public.users(rank);
CREATE INDEX idx_users_accuracy ON public.users(accuracy DESC)
  WHERE total_predictions >= 20;

-- ============================================================
-- MARKETS — A Prediction Market
-- ============================================================
CREATE TABLE public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sports', 'tech', 'popculture', 'politics', 'memes')),
  source TEXT NOT NULL CHECK (source IN ('ai', 'community')),

  -- Status lifecycle
  -- open -> closed -> resolving -> resolved / review / cancelled
  -- also: pending (community), rejected (community)
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'resolving', 'resolved', 'review', 'cancelled', 'pending', 'rejected')),
  resolution TEXT CHECK (resolution IN ('yes', 'no')),
  resolution_source TEXT,
  resolution_criteria TEXT,

  -- AMM State
  q_yes REAL NOT NULL DEFAULT 0,
  q_no REAL NOT NULL DEFAULT 0,
  b REAL NOT NULL DEFAULT 100,
  yes_price REAL NOT NULL DEFAULT 0.50,
  no_price REAL NOT NULL DEFAULT 0.50,

  -- Engagement
  volume INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,

  -- Ownership
  creator_id UUID REFERENCES public.users(id),

  -- Timing
  opens_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  dispute_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for markets
CREATE INDEX idx_markets_status ON public.markets(status);
CREATE INDEX idx_markets_category ON public.markets(category);
CREATE INDEX idx_markets_closes_at ON public.markets(closes_at) WHERE status = 'open';
CREATE INDEX idx_markets_created_at ON public.markets(created_at DESC);

-- ============================================================
-- PREDICTIONS — A Player's Bet
-- ============================================================
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  market_id UUID NOT NULL REFERENCES public.markets(id),

  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  shares REAL NOT NULL,
  entry_price REAL NOT NULL,
  coins_spent INTEGER NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence IN (1, 2, 3, 5)),

  -- Resolution
  payout INTEGER,
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'won', 'lost', 'sold', 'refunded')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for predictions
CREATE INDEX idx_predictions_user ON public.predictions(user_id);
CREATE INDEX idx_predictions_market ON public.predictions(market_id);
CREATE INDEX idx_predictions_pending ON public.predictions(market_id) WHERE result = 'pending';

-- ============================================================
-- MARKET PRICE HISTORY (for charts)
-- ============================================================
CREATE TABLE public.market_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  yes_price REAL NOT NULL,
  no_price REAL NOT NULL,
  volume INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_market ON public.market_price_history(market_id, recorded_at);

-- ============================================================
-- COMMUNITY PROPOSALS — User-Proposed Markets
-- ============================================================
CREATE TABLE public.community_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID NOT NULL REFERENCES public.users(id),

  title TEXT NOT NULL,
  description TEXT NOT NULL,
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

-- ============================================================
-- PROPOSAL VOTES — Upvotes/Downvotes
-- ============================================================
CREATE TABLE public.proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  proposal_id UUID NOT NULL REFERENCES public.community_proposals(id),
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, proposal_id)
);

-- ============================================================
-- ACHIEVEMENTS (static definitions)
-- ============================================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  coin_reward INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- USER ACHIEVEMENTS (unlocked)
-- ============================================================
CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.users(id),
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, achievement_id)
);

-- ============================================================
-- QUESTS (template definitions)
-- ============================================================
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  action_type TEXT NOT NULL,
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  coin_reward INTEGER NOT NULL
);

-- ============================================================
-- USER QUESTS (active assignments)
-- ============================================================
CREATE TABLE public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  quest_id UUID NOT NULL REFERENCES public.quests(id),
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_user_quests_active ON public.user_quests(user_id)
  WHERE completed = FALSE;

-- ============================================================
-- MARKET GENERATION LOG (debugging)
-- ============================================================
CREATE TABLE public.market_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  markets_generated INTEGER NOT NULL DEFAULT 0,
  markets_rejected INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEASONS
-- ============================================================
CREATE TABLE public.seasons (
  id SERIAL PRIMARY KEY,
  season_number INTEGER NOT NULL UNIQUE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEASON REWARDS (end-of-season payouts)
-- ============================================================
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

-- ============================================================
-- SEASONAL BADGES (permanent, displayed on profile)
-- ============================================================
CREATE TABLE public.seasonal_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  season_number INTEGER NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('champion', 'runner_up', 'top_3')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, season_number)
);

CREATE INDEX idx_seasonal_badges_user ON public.seasonal_badges(user_id);

-- ============================================================
-- MARKET DISPUTES (24-hour post-resolution disputes)
-- ============================================================
CREATE TABLE public.market_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(market_id, user_id)
);

CREATE INDEX idx_disputes_market ON public.market_disputes(market_id);
