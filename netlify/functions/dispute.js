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
    const { market_id, reason } = body;

    if (!market_id || !reason) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (reason.length < 10) {
      return new Response(JSON.stringify({ error: 'Reason must be at least 10 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: market } = await supabaseAdmin
      .from('markets')
      .select('id, status, dispute_deadline')
      .eq('id', market_id)
      .single();

    if (!market) {
      return new Response(JSON.stringify({ error: 'Market not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (market.status !== 'resolved') {
      return new Response(JSON.stringify({ error: 'Market is not resolved' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (market.dispute_deadline && new Date() > new Date(market.dispute_deadline)) {
      return new Response(JSON.stringify({ error: 'Dispute window has expired (24 hours after resolution)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: dispute, error } = await supabaseAdmin
      .from('market_disputes')
      .insert({ market_id, user_id: user.id, reason })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'You already disputed this market' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    const { count } = await supabaseAdmin
      .from('market_disputes')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', market_id);

    let marketReviewed = false;

    if (count >= 5) {
      await supabaseAdmin
        .from('markets')
        .update({ status: 'review' })
        .eq('id', market_id);
      marketReviewed = true;
    }

    return new Response(JSON.stringify({
      dispute,
      market_reviewed: marketReviewed,
      dispute_count: count,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Dispute error:', err);
    return new Response(JSON.stringify({ error: 'Failed to submit dispute' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
