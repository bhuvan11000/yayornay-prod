-- ============================================================
-- PREDICT ARENA — Quest Completion Functions
-- Version: 007
--
-- Provides atomic operations for quest progress updates and
-- reward distribution.
-- ============================================================

-- Atomically mark a quest as completed and award rewards
CREATE OR REPLACE FUNCTION complete_quest(
  p_user_quest_id UUID,
  p_user_id UUID,
  p_coins INTEGER,
  p_xp INTEGER,
  p_new_progress INTEGER
) RETURNS JSONB AS $$
BEGIN
  UPDATE public.user_quests
  SET progress = p_new_progress, completed = TRUE
  WHERE id = p_user_quest_id;

  UPDATE public.users
  SET
    coins = coins + p_coins,
    xp = xp + p_xp
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Increment quest progress without completion
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_quest_id UUID,
  p_new_progress INTEGER
) RETURNS JSONB AS $$
BEGIN
  UPDATE public.user_quests
  SET progress = p_new_progress
  WHERE id = p_user_quest_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
