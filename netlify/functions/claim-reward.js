import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { checkAchievements } from './_shared/achievements.js';
import { updateQuestProgress } from './_shared/quests.js';
import { checkLevelUp, calculateLevel } from './_shared/levels.js';
import { buildRankUp } from './_shared/ranks.js';

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch rank + level BEFORE the RPC — claim_daily_reward updates the rank
    // column, so we need the pre-claim values for rank-up detection.
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('level, rank')
      .eq('id', authUser.id)
      .single();

    const { data, error } = await supabaseAdmin.rpc('claim_daily_reward', {
      p_user_id: authUser.id,
    });

    if (error) throw error;

    let achievements = [];
    let completedQuests = [];
    let levelUp = null;
    let rankUp = null;

    try {
      achievements = await checkAchievements(authUser.id, 'login', {});
    } catch (err) {
      console.error('Achievement check failed (non-blocking):', err.message);
    }

    try {
      completedQuests = await updateQuestProgress(authUser.id, 'login', {});
    } catch (err) {
      console.error('Quest update failed (non-blocking):', err.message);
    }

    try {
      levelUp = await checkLevelUp(authUser.id, data.user_xp, currentUser?.level || 1);
    } catch (err) {
      console.error('Level-up check failed (non-blocking):', err.message);
    }

    try {
      rankUp = buildRankUp(currentUser?.rank, data.new_rank);
    } catch (err) {
      console.error('Rank-up check failed (non-blocking):', err.message);
    }

    return new Response(JSON.stringify({
      ...data,
      user_level: data.user_xp ? calculateLevel(data.user_xp) : undefined,
      achievements,
      completedQuests,
      levelUp,
      rankUp,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Claim reward error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to claim reward' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
