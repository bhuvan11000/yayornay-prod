import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { getProposalCost } from './_shared/rewards.js';
import { checkRankChange } from './_shared/ranks.js';

const VALID_CATEGORIES = ['sports', 'tech', 'popculture', 'politics', 'memes'];

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { title, category, closes_at, resolution_criteria } = body;

    if (!title || !category || !closes_at || !resolution_criteria) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (title.length < 10 || title.length > 200) {
      return new Response(JSON.stringify({ error: 'Title must be 10-200 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resolution_criteria.length < 20 || resolution_criteria.length > 300) {
      return new Response(JSON.stringify({ error: 'Resolution criteria must be 20-300 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const closesDate = new Date(closes_at);
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + 3);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 90);

    if (isNaN(closesDate.getTime()) || closesDate < minDate || closesDate > maxDate) {
      return new Response(JSON.stringify({ error: 'Close date must be 3-90 days from now' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('coins, rank, level')
      .eq('id', auth.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.level < 3) {
      return new Response(JSON.stringify({ error: 'Level 3 required to propose markets' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { count: pendingCount } = await supabaseAdmin
      .from('community_proposals')
      .select('*', { count: 'exact', head: true })
      .eq('proposer_id', auth.id)
      .eq('status', 'pending');

    if (pendingCount >= 3) {
      return new Response(JSON.stringify({ error: 'Maximum 3 pending proposals allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cost = getProposalCost(profile.rank);

    if (profile.coins < cost) {
      return new Response(JSON.stringify({ error: `Insufficient coins. Need ${cost}, have ${profile.coins}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const votingDeadline = new Date();
    votingDeadline.setDate(votingDeadline.getDate() + 7);

    const { data: proposal, error } = await supabaseAdmin
      .from('community_proposals')
      .insert({
        proposer_id: auth.id,
        title,
        category,
        resolution_criteria,
        stake_amount: cost,
        voting_deadline: votingDeadline.toISOString(),
        closes_at: closesDate.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('users')
      .update({ coins: profile.coins - cost })
      .eq('id', auth.id);

    await checkRankChange(auth.id, profile.coins - cost, profile.rank);

    return new Response(JSON.stringify({
      proposal_id: proposal.id,
      stake_deducted: cost,
      status: 'pending',
    }), {
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
