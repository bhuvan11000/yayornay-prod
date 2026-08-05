import { useState } from 'react';
import { Plus, FileText, BarChart3, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMarkets } from '../hooks/useMarkets';
import { MarketCard } from '../components/market/MarketCard';
import { ProposalCard } from '../components/community/ProposalCard';
import { ProposeDialog } from '../components/community/ProposeDialog';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { supabase } from '../config/supabase';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { id: 'live', label: 'Live Markets' },
  { id: 'pending', label: 'Pending Proposals' },
];

export default function Community() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('live');
  const [showPropose, setShowPropose] = useState(false);

  // Fetch fresh user data on mount so level is always current
  const { data: freshUser } = useQuery({
    queryKey: ['community-user-level', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('level')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000,
  });

  const userLevel = freshUser?.level ?? user?.level ?? 1;
  const canVote = userLevel >= 3;
  const canPropose = userLevel >= 3;

  const { data: marketsData, isLoading: marketsLoading } = useMarkets({
    source: 'community',
    status: 'open',
  });
  const markets = marketsData?.markets || [];

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_proposals')
        .select('*')
        .eq('status', 'pending')
        .order('proposed_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      const proposerIds = [...new Set(data.map((p) => p.proposer_id))];
      const { data: proposers } = await supabase
        .from('users')
        .select('id, username, rank, level')
        .in('id', proposerIds);

      const proposerMap = {};
      if (proposers) {
        for (const p of proposers) {
          proposerMap[p.id] = p;
        }
      }

      let userVotes = {};
      if (user) {
        const { data: votes } = await supabase
          .from('proposal_votes')
          .select('proposal_id, vote')
          .eq('user_id', user.id)
          .in('proposal_id', data.map((p) => p.id));

        if (votes) {
          for (const v of votes) {
            userVotes[v.proposal_id] = v.vote;
          }
        }
      }

      return data.map((p) => ({
        ...p,
        proposer_username: proposerMap[p.proposer_id]?.username || 'Unknown',
        proposer_rank: proposerMap[p.proposer_id]?.rank || 'Unranked',
        proposer_level: proposerMap[p.proposer_id]?.level || 1,
        user_vote: userVotes[p.id] || null,
      }));
    },
    enabled: true,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-2xl font-heading">Community Markets</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Propose and vote on community-driven prediction markets
          </p>
        </div>
        {canPropose ? (
          <button
            className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--accent-amber)] px-5 py-3 text-sm font-semibold text-[#0B0E0C] transition-all duration-150 hover:-translate-y-px hover:bg-[var(--accent-amber-hover)]"
            onClick={() => setShowPropose(true)}
          >
            <Plus size={16} />
            Propose a Market
          </button>
        ) : (
          <div className="flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs text-[var(--text-muted)]">
            <Lock size={14} />
            <span>Level 3+</span>
          </div>
        )}
      </div>

      {!canVote && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] px-3 py-3 text-sm text-[var(--color-warning)]">
          <Lock size={16} />
          <span>Reach Level 3 to vote on proposals</span>
        </div>
      )}

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'live' && (
        <div className="flex flex-col">
          {marketsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : markets && markets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <BarChart3 size={32} className="opacity-50 text-[var(--text-muted)]" />
              <h3 className="text-lg text-[var(--text-primary)]">No community markets yet</h3>
              <p className="max-w-[400px] text-sm text-[var(--text-muted)]">
                Approved proposals will appear here as live markets.
              </p>
              {canPropose && (
                <button
                  className="mt-2 flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent-amber)] px-5 py-3 text-sm font-semibold text-[#0B0E0C] transition-colors duration-150 hover:bg-[var(--accent-amber-hover)]"
                  onClick={() => setShowPropose(true)}
                >
                  <Plus size={16} />
                  Propose the first market
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="flex flex-col">
          {proposalsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rect" />
              ))}
            </div>
          ) : proposals && proposals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <FileText size={32} className="opacity-50 text-[var(--text-muted)]" />
              <h3 className="text-lg text-[var(--text-primary)]">No pending proposals</h3>
              <p className="max-w-[400px] text-sm text-[var(--text-muted)]">
                Be the first to propose a community market.
              </p>
              {canPropose && (
                <button
                  className="mt-2 flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent-amber)] px-5 py-3 text-sm font-semibold text-[#0B0E0C] transition-colors duration-150 hover:bg-[var(--accent-amber-hover)]"
                  onClick={() => setShowPropose(true)}
                >
                  <Plus size={16} />
                  Propose a market
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <ProposeDialog open={showPropose} onOpenChange={setShowPropose} />
    </div>
  );
}
