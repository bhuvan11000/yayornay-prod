import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { getDailyReward } from './_shared/rewards.js';

/**
 * POST /api/onboard
 * Creates a user profile in public.users after first sign-up.
 * Idempotent — if profile already exists, returns it.
 *
 * Auth is required. Called automatically by the auth store
 * when a session is detected but no profile exists yet.
 */
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
    // Check if profile already exists — idempotent
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ user: existing }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate default username: "Player_" + first 6 chars of user ID
    const shortId = authUser.id.substring(0, 6);
    const username = `Player_${shortId}`;

    // Create user profile with starting defaults
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.id,
        username,
        avatar_url: null,
        level: 1,
        xp: 0,
        coins: 1000,
        rank: 'Unranked',
        total_predictions: 0,
        correct_predictions: 0,
        accuracy: 0.0,
        net_profit: 0,
        betting_streak: 0,
        longest_streak: 0,
        last_bet_date: null,
        last_login: new Date().toISOString(),
        last_reward_claim: null,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[onboard] Created profile for user ${authUser.id} as ${username}`);

    return new Response(JSON.stringify({ user: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[onboard] Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
