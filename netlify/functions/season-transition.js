import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/season-transition
 * Called by GitHub Actions cron on the 1st of each month (00:00 UTC).
 * Processes the monthly season transition:
 * - Snapshot leaderboard, award end-of-season rewards (top 10)
 * - Apply 25% coin deduction (floor 1,000)
 * - Recalculate all ranks
 * - Create seasonal badges for top 3
 * - Create new season record
 *
 * Calls the PostgreSQL process_season_transition function.
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
    // Calculate new season number
    const { data: lastSeason } = await supabaseAdmin
      .from('seasons')
      .select('season_number')
      .order('season_number', { ascending: false })
      .limit(1)
      .single();

    const newSeasonNumber = (lastSeason?.season_number || 0) + 1;

    // Call the PostgreSQL function
    const { data, error } = await supabaseAdmin.rpc('process_season_transition', {
      p_season_number: newSeasonNumber,
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Season transition error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process season transition' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
