import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * GET /api/user/:username
 * Returns public profile for a given username.
 * Includes stats, recent predictions, achievements, and seasonal badges.
 */
export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const username = pathParts[pathParts.length - 1];

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent predictions with market info
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select(`
        *,
        market:market_id(title, category, status, resolution, yes_price, no_price)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch unlocked achievements
    const { data: achievements } = await supabaseAdmin
      .from('user_achievements')
      .select(`
        achievement:achievement_id(slug, title, description, icon),
        unlocked_at
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    // Fetch seasonal badges
    const { data: badges } = await supabaseAdmin
      .from('seasonal_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('season_number', { ascending: false });

    return new Response(JSON.stringify({
      user,
      predictions,
      achievements: achievements?.map(a => ({ ...a.achievement, unlocked_at: a.unlocked_at })) || [],
      badges: badges || [],
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('User profile error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'GET' };
