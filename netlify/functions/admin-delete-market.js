import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Admin-only: delete (reject) a draft market before it goes live.
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

  if (user.email !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { market_id } = body;

    if (!market_id) {
      return new Response(JSON.stringify({ error: 'Missing market_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: market } = await supabaseAdmin
      .from('markets')
      .select('id, status, source')
      .eq('id', market_id)
      .single();

    if (!market) {
      return new Response(JSON.stringify({ error: 'Market not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (market.status !== 'draft') {
      return new Response(JSON.stringify({ error: 'Only draft markets can be deleted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hard delete — no user activity on drafts
    const { error } = await supabaseAdmin
      .from('markets')
      .delete()
      .eq('id', market_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, market_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin delete market error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to delete market' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
