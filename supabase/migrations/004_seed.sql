-- ============================================================
-- PREDICT ARENA — Seed Data
-- Version: 004
--
-- Inserts starter achievements and quest templates.
-- ============================================================

-- ============================================================
-- ACHIEVEMENTS (16 starter achievements)
-- ============================================================
INSERT INTO public.achievements (slug, title, description, icon, xp_reward, coin_reward) VALUES
  ('first_prediction', 'First Prediction', 'Place your first prediction', 'target', 50, 100),
  ('on_a_roll', 'On a Roll', '3-day betting streak', 'flame', 100, 150),
  ('hot_streak', 'Hot Streak', '7-day betting streak', 'flame', 250, 300),
  ('unstoppable', 'Unstoppable', '15-day betting streak', 'flame', 500, 500),
  ('iron_will', 'Iron Will', '30-day betting streak', 'flame', 750, 750),
  ('diversified', 'Diversified', 'Predict in 5 different categories', 'layers', 100, 100),
  ('contrarian', 'Contrarian', 'Win a prediction where you were in the <10% minority', 'trend-down', 300, 250),
  ('whale', 'Whale', 'Reach Forecaster rank (10,000 coins)', 'fish-symbol', 200, 0),
  ('early_bird', 'Early Bird', 'Predict within the first hour of a market opening', 'sunrise', 75, 50),
  ('century', 'Century', 'Make 100 total predictions', 'sigma', 300, 200),
  ('sharp_eye', 'Sharp Eye', 'Maintain 70%+ accuracy over 50+ predictions', 'eye', 400, 300),
  ('market_maker', 'Market Maker', 'Get a community market proposal approved', 'store', 200, 150),
  ('trendsetter', 'Trendsetter', 'Create a community market with 50+ participants', 'trending-up', 400, 300),
  ('ranked_up', 'Ranked Up', 'Reach Analyst rank (2,500 coins)', 'badge-check', 100, 100),
  ('rising_star', 'Rising Star', 'Reach Strategist rank (5,000 coins)', 'star', 250, 250),
  ('seasoned_trader', 'Seasoned Trader', 'Participate in 3 different seasons', 'calendar', 300, 200);

-- ============================================================
-- QUEST TEMPLATES (5 daily, 4 weekly)
-- ============================================================

-- Daily quests
INSERT INTO public.quests (title, description, type, action_type, target, xp_reward, coin_reward) VALUES
  ('Make a Prediction', 'Place 1 prediction today', 'daily', 'predict', 1, 25, 25),
  ('Triple Threat', 'Place 3 predictions today', 'daily', 'predict', 3, 75, 50),
  ('Category Explorer', 'Predict in 2 different categories today', 'daily', 'category', 2, 50, 50),
  ('Confident Call', 'Place a prediction at 3x+ confidence today', 'daily', 'confidence', 1, 50, 25),
  ('Community Voice', 'Upvote/downvote 3 community market proposals today', 'daily', 'vote', 3, 25, 25);

-- Weekly quests
INSERT INTO public.quests (title, description, type, action_type, target, xp_reward, coin_reward) VALUES
  ('Winning Week', 'Get 5 correct predictions this week', 'weekly', 'win', 5, 200, 200),
  ('Active Trader', 'Place 15 predictions this week', 'weekly', 'predict', 15, 150, 150),
  ('Category Master', 'Win 3 predictions in a single category this week', 'weekly', 'win', 3, 200, 150),
  ('Streak Builder', 'Achieve a 5-day login streak this week', 'weekly', 'login', 5, 150, 100);
