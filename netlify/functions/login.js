import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/login
 * Processes a returning player login.
 * Updates last_login, checks betting streak, calculates daily reward eligibility.
 * NOTE: Daily reward is NOT auto-awarded here. Player must manually claim.
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
    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found. Please sign up first.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last_login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Check betting streak
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastBetDate = profile.last_bet_date;
    let streakReset = false;

    if (lastBetDate && lastBetDate < today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastBetDate < yesterdayStr) {
        // Missed a day, reset streak
        await supabaseAdmin
          .from('users')
          .update({ betting_streak: 0 })
          .eq('id', user.id);
        streakReset = true;
      }
    }

    // Calculate daily reward eligibility
    const lastClaim = profile.last_reward_claim;
    const canClaim = !lastClaim || lastClaim < today;

    // Check inactivity lock (no bet in 7 days)
    const isActive = lastBetDate && lastBetDate >= new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const rewardStatus = {
      can_claim: canClaim && !!isActive,
      is_active: !!isActive,
      last_claim: lastClaim,
    };

    return new Response(JSON.stringify({
      user: profile,
      rewardStatus,
      streak_reset: streakReset,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
