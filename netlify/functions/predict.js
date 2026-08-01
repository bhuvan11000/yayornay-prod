import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { checkAchievements } from './_shared/achievements.js';
import { updateQuestProgress } from './_shared/quests.js';
import { checkLevelUp, calculateLevel } from './_shared/levels.js';

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { market_id, position, coins, confidence } = body;

    if (!market_id || !position || !coins || !confidence) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['yes', 'no'].includes(position)) {
      return new Response(JSON.stringify({ error: 'Position must be "yes" or "no"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (![1, 2, 3, 5].includes(confidence)) {
      return new Response(JSON.stringify({ error: 'Confidence must be 1, 2, 3, or 5' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (coins < 10 || coins > 10000) {
      return new Response(JSON.stringify({ error: 'Coins must be between 10 and 10000' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's current level BEFORE the RPC — place_prediction does not
    // return user_level, and passing a fallback of 1 made every XP gain look
    // like a level-up (calculateLevel(xp) > 1 was always true).
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('level')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabaseAdmin.rpc('place_prediction', {
      p_user_id: user.id,
      p_market_id: market_id,
      p_position: position,
      p_coins: coins,
      p_confidence: confidence,
    });

    if (error) throw error;

    let achievements = [];
    let completedQuests = [];
    let levelUp = null;

    try {
      achievements = await checkAchievements(user.id, 'predict', {
        market_id,
        position,
        coins,
        confidence,
      });
    } catch (err) {
      console.error('Achievement check failed (non-blocking):', err.message);
    }

    try {
      // Fetch market category for quest progress tracking
      const { data: marketData } = await supabaseAdmin
        .from('markets')
        .select('category')
        .eq('id', market_id)
        .single();

      completedQuests = await updateQuestProgress(user.id, 'predict', {
        category: marketData?.category,
        confidence,
        market_id,
      });
    } catch (err) {
      console.error('Quest update failed (non-blocking):', err.message);
    }

    try {
      levelUp = await checkLevelUp(user.id, data.user_xp, profile?.level || 1);
    } catch (err) {
      console.error('Level-up check failed (non-blocking):', err.message);
    }

    // Add the user's current level (for auth store sync)
    const userLevel = data.user_xp ? calculateLevel(data.user_xp) : (data.user_level || 1);

    const response = {
      ...data,
      user_level: userLevel,
      achievements,
      completedQuests,
      levelUp,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Predict error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to place prediction' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };