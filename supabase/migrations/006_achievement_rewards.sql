-- ============================================================
-- PREDICT ARENA — Achievement Unlock Function
-- Version: 006
--
-- Atomically inserts an achievement unlock record and awards
-- the associated XP/coin rewards in a single transaction.
-- ============================================================

CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID,
  p_achievement_id UUID,
  p_xp INTEGER,
  p_coins INTEGER
) RETURNS JSONB AS $$
BEGIN
  -- Insert the unlock record (no-op if already unlocked)
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id)
  ON CONFLICT DO NOTHING;

  -- Award rewards
  UPDATE public.users
  SET
    xp = xp + p_xp,
    coins = coins + p_coins
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
