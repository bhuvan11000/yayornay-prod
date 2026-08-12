import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { getRank, buildRankUp } from './_shared/ranks.js';

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

    // Fetch the rank before the RPC — sell_shares updates the rank column
    // from the new coin balance, so we need the pre-sale value for rank-up
    // detection.
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('rank')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabaseAdmin.rpc('sell_shares', {
      p_user_id: user.id,
      p_prediction_id: prediction_id,
      p_shares_to_sell: shares_to_sell,
    });

    if (error) throw error;

    let rankUp = null;
    try {
      const newRank = data?.user_coins !== undefined ? getRank(data.user_coins) : null;
      rankUp = buildRankUp(profile?.rank, newRank);
    } catch (err) {
      console.error('Rank-up check failed (non-blocking):', err.message);
    }

    return new Response(JSON.stringify({ ...data, rankUp }), {
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