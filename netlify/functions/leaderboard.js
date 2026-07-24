import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { verifyAuth } from './_shared/auth.js';

/**
 * GET /api/leaderboard
 * Returns ranked players sorted by specified metric with timeframe filtering.
 *
 * Query params:
 *   metric: 'coins' | 'accuracy' | 'profit' | 'streak'
 *   timeframe: 'all' | 'month' | 'week'
 *   limit: max 100 (default 50)
 *   offset: for pagination (default 0)
 *
 * Returns: { players: [...], totalCount: number, userRank: number|null }
 */
export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const url = new URL(req.url);
    const metric = url.searchParams.get('metric') || 'coins';
    const timeframe = url.searchParams.get('timeframe') || 'all';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build timeframe filter
    const now = new Date();
    let timeFilter = null;
    if (timeframe === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      timeFilter = startOfMonth.toISOString();
    } else if (timeframe === 'week') {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);
      timeFilter = startOfWeek.toISOString();
    }

    // Build query based on metric
    let query = supabaseAdmin.from('users').select('*', { count: 'exact', head: false });

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

    if (timeFilter) {
      query = query.gte('created_at', timeFilter);
    }

    const { data: players, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) throw error;

    // Calculate current user's rank if authenticated
    const authUser = await verifyAuth(req);
    let userRank = null;

    if (authUser) {
      // Need to count how many users are ahead of the current user for the given metric
      let rankQuery = supabaseAdmin.from('users').select('id', { count: 'exact', head: true });

      switch (metric) {
        case 'accuracy':
          rankQuery = rankQuery.gte('total_predictions', 20).gt('accuracy', 0);
          break;
        case 'profit':
          rankQuery = rankQuery.gt('net_profit', 0);
          break;
        case 'streak':
          rankQuery = rankQuery.gt('betting_streak', 0);
          break;
        case 'coins':
        default:
          rankQuery = rankQuery.gte('coins', 2500);
          break;
      }

      if (timeFilter) {
        rankQuery = rankQuery.gte('created_at', timeFilter);
      }

      // Get the current user's metric value
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select(metric === 'accuracy' ? 'accuracy' : metric === 'profit' ? 'net_profit' : metric === 'streak' ? 'betting_streak' : 'coins')
        .eq('id', authUser.id)
        .single();

      if (currentUser) {
        const userValue = currentUser[metric === 'accuracy' ? 'accuracy' : metric === 'profit' ? 'net_profit' : metric === 'streak' ? 'betting_streak' : 'coins'];

        if (userValue != null) {
          // Count users ahead of current user
          let aheadQuery = supabaseAdmin.from('users').select('id', { count: 'exact', head: true });

          const metricCol = metric === 'accuracy' ? 'accuracy' : metric === 'profit' ? 'net_profit' : metric === 'streak' ? 'betting_streak' : 'coins';

          if (metric === 'accuracy') {
            aheadQuery = aheadQuery.gte('total_predictions', 20).gt(metricCol, userValue);
          } else if (metric === 'streak') {
            aheadQuery = aheadQuery.gt(metricCol, userValue);
          } else if (metric === 'coins') {
            aheadQuery = aheadQuery.gt(metricCol, userValue);
          } else {
            aheadQuery = aheadQuery.gt(metricCol, userValue);
          }

          if (timeFilter) {
            aheadQuery = aheadQuery.gte('created_at', timeFilter);
          }

          const { count: aheadCount } = await aheadQuery;
          userRank = (aheadCount || 0) + 1;
        }
      }
    }

    return new Response(JSON.stringify({
      players: players || [],
      totalCount: count || 0,
      userRank,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[leaderboard] Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'GET' };