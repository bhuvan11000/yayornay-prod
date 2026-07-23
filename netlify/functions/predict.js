import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/predict
 * Place a prediction on a market.
 * Calls the PostgreSQL place_prediction function for atomic safety.
 * Post-transaction: checks achievements, updates quests, checks level-up.
 */
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

    // Validate input
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

    // Call the PostgreSQL function
    const { data, error } = await supabaseAdmin.rpc('place_prediction', {
      p_user_id: user.id,
      p_market_id: market_id,
      p_position: position,
      p_coins: coins,
      p_confidence: confidence,
    });

    if (error) throw error;

    // TODO: Post-transaction checks (non-blocking, can fail without data corruption)
    // - checkAchievements(user.id, 'predict', { market_id, position, coins, confidence })
    // - updateQuestProgress(user.id, 'predict', { ... })
    // - checkAndUpdateBettingStreak(user.id)
    // - checkLevelUp(user.id)

    return new Response(JSON.stringify(data), {
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
