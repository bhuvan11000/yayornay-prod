import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

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

    // Get daily quest template IDs
    const { data: dailyTemplates } = await supabaseAdmin
      .from('quests')
      .select('id')
      .eq('type', 'daily');

    let deletedDaily = 0;
    let deletedWeekly = 0;

    // Delete expired daily quests
    if (dailyTemplates?.length > 0) {
      const dailyIds = dailyTemplates.map(q => q.id);
      const { data: dd, error: errDaily } = await supabaseAdmin
        .from('user_quests')
        .delete()
        .lt('reset_at', now)
        .in('quest_id', dailyIds)
        .select('id');

      if (errDaily) throw errDaily;
      deletedDaily = dd?.length || 0;
    }

    // Also clean up weekly quests (Monday reset)
    const dayOfWeek = new Date().getUTCDay(); // 0=Sunday, 1=Monday
    if (dayOfWeek === 1) {
      const { data: weeklyTemplates } = await supabaseAdmin
        .from('quests')
        .select('id')
        .eq('type', 'weekly');

      if (weeklyTemplates?.length > 0) {
        const weeklyIds = weeklyTemplates.map(q => q.id);
        const { data: dw, error: errWeekly } = await supabaseAdmin
          .from('user_quests')
          .delete()
          .lt('reset_at', now)
          .in('quest_id', weeklyIds)
          .select('id');

        if (errWeekly) throw errWeekly;
        deletedWeekly = dw?.length || 0;
      }
    }

    const type = deletedWeekly > 0 ? 'both' : 'daily';

    return new Response(JSON.stringify({
      deleted: deletedDaily + deletedWeekly,
      type,
      daily_cleaned: deletedDaily,
      weekly_cleaned: deletedWeekly,
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
