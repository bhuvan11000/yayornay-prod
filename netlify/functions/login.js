import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { getDailyReward } from './_shared/rewards.js';

/**
 * POST /api/login
 * Processes a returning player login.
 *
 * - Fetches user profile
 * - Updates last_login timestamp
 * - Checks and resets betting streak if gap detected
 * - Calculates daily reward eligibility
 *
 * NOTE: Daily reward is NOT auto-awarded here. Player must manually claim
 * via POST /api/claim-reward.
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
    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({
        error: 'Profile not found. Please complete sign-up first.',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last_login timestamp
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authUser.id);

    // ── Check betting streak ──
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastBetDate = profile.last_bet_date;
    let streakReset = false;

    if (lastBetDate) {
      if (lastBetDate < yesterdayStr) {
        // Missed at least one day — reset streak
        await supabaseAdmin
          .from('users')
          .update({ betting_streak: 0 })
          .eq('id', authUser.id);
        streakReset = true;
      }
    }

    // ── Daily reward eligibility ──
    const lastClaim = profile.last_reward_claim;
    const canClaim = !lastClaim || lastClaim < todayStr;

    // Inactivity lock: must have bet within the last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const isActive = lastBetDate !== null && lastBetDate >= sevenDaysAgoStr;

    // Calculate reward amounts for display
    const isSunday = today.getUTCDay() === 0;
    const reward = getDailyReward(profile.rank, isSunday);

    const rewardStatus = {
      can_claim: canClaim && isActive,
      is_active: isActive,
      rank: profile.rank,
      coins: reward.coins,
      xp: reward.xp,
      is_sunday: isSunday,
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
    console.error('[login] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
