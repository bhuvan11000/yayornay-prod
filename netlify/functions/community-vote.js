import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';

/**
 * POST /api/community-vote
 * Upvote or downvote a community market proposal.
 * One vote per user per proposal.
 * Auto-approves when upvotes reach 15.
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
    const { proposal_id, vote } = body;

    if (!proposal_id || !['up', 'down'].includes(vote)) {
      return new Response(JSON.stringify({ error: 'Invalid input. Required: proposal_id, vote (up/down)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check proposal exists and is pending
    const { data: proposal } = await supabaseAdmin
      .from('community_proposals')
      .select('*')
      .eq('id', proposal_id)
      .single();

    if (!proposal) {
      return new Response(JSON.stringify({ error: 'Proposal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (proposal.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Proposal is no longer pending' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (proposal.proposer_id === user.id) {
      return new Response(JSON.stringify({ error: 'You cannot vote on your own proposal' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date() > new Date(proposal.voting_deadline)) {
      return new Response(JSON.stringify({ error: 'Voting period has ended' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert vote (one vote per user per proposal)
    const { error: voteError } = await supabaseAdmin
      .from('proposal_votes')
      .upsert(
        { user_id: user.id, proposal_id, vote },
        { onConflict: 'user_id, proposal_id' }
      );

    if (voteError) throw voteError;

    // Recalculate vote counts
    const { count: upvotes } = await supabaseAdmin
      .from('proposal_votes')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposal_id)
      .eq('vote', 'up');

    const { count: downvotes } = await supabaseAdmin
      .from('proposal_votes')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposal_id)
      .eq('vote', 'down');

    const updates = { upvotes: upvotes || 0, downvotes: downvotes || 0 };

    // Auto-approve if 15+ upvotes
    if (upvotes >= 15) {
      updates.status = 'approved';

      // Refund stake and give bonus
      const reward = Math.round(proposal.stake_amount * 1.5);
      await supabaseAdmin
        .from('users')
        .update({ coins: supabaseAdmin.rpc('increment', { x: reward }) })
        .eq('id', proposal.proposer_id);
    }

    // Auto-reject if net votes <= -5
    if ((upvotes || 0) - (downvotes || 0) <= -5) {
      updates.status = 'rejected';
    }

    await supabaseAdmin
      .from('community_proposals')
      .update(updates)
      .eq('id', proposal_id);

    return new Response(JSON.stringify({
      proposal_id,
      upvotes: upvotes || 0,
      downvotes: downvotes || 0,
      status: updates.status || 'pending',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Community vote error:', err);
    return new Response(JSON.stringify({ error: 'Failed to cast vote' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { method: 'POST' };
