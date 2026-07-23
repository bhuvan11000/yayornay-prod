import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * GET /api/leaderboard
 * Returns ranked players sorted by specified metric.
 * Query params: metric (coins|accuracy|profit|streak), timeframe (all|month|week), limit, offset
 */
export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const url = new URL(req.url);
    const metric = url.searchParams.get('metric') || 'coins';
    const timeframe = url.searchParams.get('timeframe') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabaseAdmin.from('users').select('*');

    switch (metric) {
      case 'accuracy':
        query = query.gte('total_predictions', 20).order('accuracy', { ascending: false });
        break;
      case 'profit':
        query = query.order('net_profit', { ascending: false });
        break;
      case 'streak':
        query = query.gt('betting_streak', 0).order('betting_streak', { ascending: false });
        break;
      case 'coins':
      default:
        query = query.gte('coins', 2500).order('coins', { ascending: false });
        break;
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) throw error;

    // TODO: Apply timeframe filter (requires created_at join with predictions or season logic)

    return new Response(JSON.stringify({ players: data, count: count || data.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'GET' };
