import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/onboard
 * Creates a user profile in public.users after first sign-up.
 * Called once per user after successful auth registration.
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
    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Profile already exists' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate default username
    const shortId = user.id.substring(0, 6);
    const username = `Player_${shortId}`;

    // Create user profile
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        username,
        avatar_url: null,
        level: 1,
        xp: 0,
        coins: 1000,
        rank: 'Unranked',
        last_login: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ user: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Onboard error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
