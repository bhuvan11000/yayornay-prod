-- ============================================================
-- PREDICT ARENA — Row Level Security (RLS) Policies
-- Version: 002
--
-- DESIGN DECISION:
-- All writes go through Netlify Functions which use the
-- service role key (bypasses RLS). This is intentional —
-- business logic MUST run server-side to prevent manipulation.
-- Therefore only SELECT (read) policies are defined here.
--
-- No INSERT/UPDATE/DELETE policies are created.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_disputes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- READ POLICIES (frontend anon key can read these)
-- ============================================================

-- Anyone can read all user profiles (public)
CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT
  USING (true);

-- Anyone can read open/resolved markets
-- Pending and rejected community markets also visible for voting
CREATE POLICY "Markets are publicly readable"
  ON public.markets FOR SELECT
  USING (status IN ('open', 'closed', 'resolved', 'pending', 'rejected', 'review'));

-- Users can read their own predictions
CREATE POLICY "Users can read own predictions"
  ON public.predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can read price history
CREATE POLICY "Price history is public"
  ON public.market_price_history FOR SELECT
  USING (true);

-- Anyone can read proposals
CREATE POLICY "Proposals are publicly readable"
  ON public.community_proposals FOR SELECT
  USING (true);

-- Users can see proposal votes
CREATE POLICY "Proposal votes are public"
  ON public.proposal_votes FOR SELECT
  USING (true);

-- Anyone can read achievements
CREATE POLICY "Achievements are public"
  ON public.achievements FOR SELECT
  USING (true);

-- Users can see their own achievement unlocks
CREATE POLICY "Users see own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can read quest templates
CREATE POLICY "Quests are public"
  ON public.quests FOR SELECT
  USING (true);

-- Users can see their own quests
CREATE POLICY "Users see own quests"
  ON public.user_quests FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can read seasons
CREATE POLICY "Seasons are public"
  ON public.seasons FOR SELECT
  USING (true);

-- Users can see their own seasonal badges
CREATE POLICY "Users see own seasonal badges"
  ON public.seasonal_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can see their own season rewards
CREATE POLICY "Users see own season rewards"
  ON public.season_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- For market generation log, only service role can read (no public policy)

-- For market disputes, users can read if they filed it
CREATE POLICY "Users see own disputes"
  ON public.market_disputes FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- NO INSERT/UPDATE/DELETE POLICIES
-- All writes go through Netlify Functions with service role key
-- This ensures business logic (AMM, rank, achievements) runs
-- server-side and cannot be bypassed or manipulated.
-- ============================================================
