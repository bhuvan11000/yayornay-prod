import { verifyCronSecret } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

export default async (req) => {
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
    const now = new Date();

    const { data: activeSeason } = await supabaseAdmin
      .from('seasons')
      .select('*')
      .eq('status', 'active')
      .single()
      .maybeSingle();

    if (!activeSeason) {
      const { data: newSeason, error: createError } = await supabaseAdmin
        .from('seasons')
        .insert({
          season_number: 1,
          starts_at: now.toISOString(),
          ends_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;

      return new Response(JSON.stringify({
        season_ended: 0,
        rewards_awarded: 0,
        new_season: 1,
        coins_deducted: false,
        message: 'First season created',
        season: newSeason,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const seasonEnd = new Date(activeSeason.ends_at);
    if (now < seasonEnd) {
      return new Response(JSON.stringify({
        season_ended: 0,
        rewards_awarded: 0,
        new_season: activeSeason.season_number,
        coins_deducted: false,
        message: 'Current season has not ended yet',
        season: activeSeason,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newSeasonNumber = activeSeason.season_number + 1;

    const { data: existingNewSeason } = await supabaseAdmin
      .from('seasons')
      .select('id')
      .eq('season_number', newSeasonNumber)
      .maybeSingle();

    if (existingNewSeason) {
      return new Response(JSON.stringify({
        season_ended: activeSeason.season_number,
        rewards_awarded: 0,
        new_season: newSeasonNumber,
        coins_deducted: false,
        message: 'Season transition already processed',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingRewards } = await supabaseAdmin
      .from('season_rewards')
      .select('id')
      .eq('season_id', activeSeason.id)
      .limit(1)
      .maybeSingle();

    if (existingRewards) {
      return new Response(JSON.stringify({
        season_ended: activeSeason.season_number,
        rewards_awarded: 0,
        new_season: newSeasonNumber,
        coins_deducted: false,
        message: 'Rewards already distributed for this season',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin.rpc('process_season_transition', {
      p_season_number: newSeasonNumber,
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      season_ended: activeSeason.season_number,
      rewards_awarded: data?.top_players_awarded || 0,
      new_season: newSeasonNumber,
      coins_deducted: true,
      result: data,
    }), {
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
