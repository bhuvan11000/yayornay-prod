import { verifyAuth } from './_shared/auth.js';
import { corsHeaders } from './_shared/cors.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { getApprovalReward } from './_shared/rewards.js';
import { checkRankChange } from './_shared/ranks.js';
import { checkAchievements } from './_shared/achievements.js';
import { checkLevelUp } from './_shared/levels.js';

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
    const { proposal_id, vote } = body;

    if (!proposal_id || !['up', 'down'].includes(vote)) {
      return new Response(JSON.stringify({ error: 'Invalid input. Required: proposal_id, vote (up/down)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: voter } = await supabaseAdmin
      .from('users')
      .select('level')
      .eq('id', auth.id)
      .single();

    if (!voter || voter.level < 3) {
      return new Response(JSON.stringify({ error: 'Level 3 required to vote' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    if (new Date() > new Date(proposal.voting_deadline)) {
      return new Response(JSON.stringify({ error: 'Voting period has ended' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (proposal.proposer_id === auth.id) {
      return new Response(JSON.stringify({ error: 'You cannot vote on your own proposal' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { count: todayVotes } = await supabaseAdmin
      .from('proposal_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.id)
      .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

    if (todayVotes >= 10) {
      return new Response(JSON.stringify({ error: 'Daily vote limit reached (max 10)' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: voteError } = await supabaseAdmin
      .from('proposal_votes')
      .insert({ user_id: auth.id, proposal_id, vote });

    if (voteError) {
      if (voteError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Already voted on this proposal' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw voteError;
    }

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

    const up = upvotes || 0;
    const down = downvotes || 0;
    let proposalStatus = 'pending';
    let marketCreated = false;

    if (up >= 15) {
      proposalStatus = 'approved';

      const { data: proposer } = await supabaseAdmin
        .from('users')
        .select('coins, xp, level, rank')
        .eq('id', proposal.proposer_id)
        .single();

      const reward = proposer ? getApprovalReward(proposer.rank) : { coins: 75, xp: 100 };

      if (proposer) {
        const newCoins = proposer.coins + proposal.stake_amount + reward.coins;
        const newXp = proposer.xp + reward.xp;

        await supabaseAdmin
          .from('users')
          .update({ coins: newCoins, xp: newXp })
          .eq('id', proposal.proposer_id);

        await checkRankChange(proposal.proposer_id, newCoins, proposer.rank);

        const { data: market, error: marketError } = await supabaseAdmin
          .from('markets')
          .insert({
            title: proposal.title,
            description: proposal.description,
            category: proposal.category,
            resolution_criteria: proposal.resolution_criteria,
            source: 'community',
            status: 'open',
            creator_id: proposal.proposer_id,
            closes_at: proposal.closes_at,
            opens_at: new Date().toISOString(),
            q_yes: 0,
            q_no: 0,
            b: 100,
            yes_price: 0.50,
            no_price: 0.50,
          })
          .select()
          .single();

        if (!marketError) {
          marketCreated = true;
        }

        try {
          await checkAchievements(proposal.proposer_id, 'community_approved', {
            marketId: market?.id,
          });
        } catch (err) {
          console.error('Achievement check failed (non-blocking):', err.message);
        }

        try {
          await checkLevelUp(proposal.proposer_id, newXp, proposer.level);
        } catch (err) {
          console.error('Level-up check failed (non-blocking):', err.message);
        }
      }
    } else if (up - down <= -5) {
      proposalStatus = 'rejected';
    }

    await supabaseAdmin
      .from('community_proposals')
      .update({ upvotes: up, downvotes: down, status: proposalStatus })
      .eq('id', proposal_id);

    return new Response(JSON.stringify({
      vote_recorded: true,
      proposal_status: proposalStatus,
      upvotes: up,
      downvotes: down,
      market_created: marketCreated,
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
