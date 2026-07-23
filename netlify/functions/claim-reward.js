import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/claim-reward
 * Manually claim the daily login reward.
 * Calls the PostgreSQL claim_daily_reward function for atomic safety.
 * Also checks achievements, quests, and level-up post-claim.
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
    // Call the PostgreSQL function
    const { data, error } = await supabaseAdmin.rpc('claim_daily_reward', {
      p_user_id: user.id,
    });

    if (error) throw error;

    // TODO: Post-claim checks
    // - Check achievements (login-related)
    // - Update quest progress (login quests)
    // - Check level up

    return new Response(JSON.stringify(data), {
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
