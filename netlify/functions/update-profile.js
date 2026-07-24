import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/update-profile
 * Updates the authenticated user's profile (e.g., username).
 *
 * Body: { username: string }
 */
export default async (req) => {
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
    const { username } = await req.json();

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (username.length > 30) {
      return new Response(JSON.stringify({ error: 'Username must be 30 characters or fewer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmed = username.trim();

    // Check if username is taken by another user
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', trimmed)
      .neq('id', authUser.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Username is already taken' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ username: trimmed })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ user: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[update-profile] Error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };