import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { getProposalCost } from './_shared/rewards.js';

/**
 * POST /api/community-propose
 * Submit a new community market proposal.
 * Deducts rank-scaled stake from proposer.
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
    const body = await req.json();
    const { title, description, category, closes_at, resolution_criteria } = body;

    if (!title || !description || !category || !closes_at || !resolution_criteria) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate title length
    if (title.length < 10 || title.length > 200) {
      return new Response(JSON.stringify({ error: 'Title must be between 10 and 200 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['sports', 'tech', 'popculture', 'politics', 'memes'].includes(category)) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's rank for cost calculation
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('coins, rank')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cost = getProposalCost(profile.rank);

    if (profile.coins < cost) {
      return new Response(JSON.stringify({ error: `Insufficient coins. Proposal cost: ${cost} coins` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check max pending proposals
    const { count: pendingCount } = await supabaseAdmin
      .from('community_proposals')
      .select('*', { count: 'exact', head: true })
      .eq('proposer_id', user.id)
      .eq('status', 'pending');

    if (pendingCount >= 3) {
      return new Response(JSON.stringify({ error: 'Maximum 3 pending proposals allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate voting deadline (7 days from now)
    const votingDeadline = new Date();
    votingDeadline.setDate(votingDeadline.getDate() + 7);

    // Deduct stake and create proposal
    const { data, error } = await supabaseAdmin
      .from('community_proposals')
      .insert({
        proposer_id: user.id,
        title,
        description,
        category,
        resolution_criteria,
        stake_amount: cost,
        voting_deadline: votingDeadline.toISOString(),
        closes_at,
      })
      .select()
      .single();

    if (error) throw error;

    // Deduct stake from user
    await supabaseAdmin
      .from('users')
      .update({ coins: profile.coins - cost })
      .eq('id', user.id);

    return new Response(JSON.stringify({ proposal: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Community propose error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to submit proposal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
