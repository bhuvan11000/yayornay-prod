import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/reset-quests
 * Called by GitHub Actions cron:
 * - Daily (00:00 UTC): Clean up expired daily quests
 * - Monday (00:00 UTC): Also clean up expired weekly quests
 *
 * New quests are assigned on next login, not here.
 */
export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (!verifyCronSecret(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const now = new Date().toISOString();

    // Delete expired daily quests
    const { data: deletedDaily, error: errDaily } = await supabaseAdmin
      .from('user_quests')
      .delete()
      .lt('reset_at', now)
      .eq('quest.type', 'daily')
      .select('id');

    if (errDaily) throw errDaily;

    // Also check if we should reset weekly quests (Monday)
    const dayOfWeek = new Date().getUTCDay(); // 0=Sunday, 1=Monday
    let deletedWeekly = null;

    if (dayOfWeek === 1) {
      const { data: dw, error: errWeekly } = await supabaseAdmin
        .from('user_quests')
        .delete()
        .lt('reset_at', now)
        .eq('quest.type', 'weekly')
        .select('id');

      if (errWeekly) throw errWeekly;
      deletedWeekly = dw;
    }

    return new Response(JSON.stringify({
      message: 'Quest cleanup complete',
      daily_cleaned: deletedDaily?.length || 0,
      weekly_cleaned: deletedWeekly?.length || 0,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Reset quests error:', err);
    return new Response(JSON.stringify({ error: 'Failed to reset quests' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
