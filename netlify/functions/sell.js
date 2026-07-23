import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

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
    const body = await req.json();
    const { prediction_id, shares_to_sell } = body;

    if (!prediction_id || !shares_to_sell) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin.rpc('sell_shares', {
      p_user_id: user.id,
      p_prediction_id: prediction_id,
      p_shares_to_sell: shares_to_sell,
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Sell error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to sell shares' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };