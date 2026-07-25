import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, FileText, BarChart3, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMarkets } from '../hooks/useMarkets';
import { MarketCard } from '../components/market/MarketCard';
import { ProposalCard } from '../components/community/ProposalCard';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { supabase } from '../config/supabase';
import { useQuery } from '@tanstack/react-query';
import styles from './Community.module.css';

const TABS = [
  { id: 'live', label: 'Live Markets' },
  { id: 'pending', label: 'Pending Proposals' },
];

export default function Community() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('live');

  const userLevel = user?.level || 1;
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
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-2xl font-heading">Community Markets</h1>
          <p className={styles.subtitle}>
            Propose and vote on community-driven prediction markets
          </p>
        </div>
        {canPropose ? (
          <button
            className={styles.proposeBtn}
            onClick={() => navigate('/community/propose')}
          >
            <Plus size={16} />
            Propose a Market
          </button>
        ) : (
          <div className={styles.levelLock}>
            <Lock size={14} />
            <span>Level 3+</span>
          </div>
        )}
      </div>

      {!canVote && (
        <div className={styles.voteLocked}>
          <Lock size={16} />
          <span>Reach Level 3 to vote on proposals</span>
        </div>
      )}

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'live' && (
        <div className={styles.content}>
          {marketsLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : markets && markets.length > 0 ? (
            <div className={styles.grid}>
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <BarChart3 size={32} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No community markets yet</h3>
              <p className={styles.emptyText}>
                Approved proposals will appear here as live markets.
              </p>
              {canPropose && (
                <button
                  className={styles.emptyBtn}
                  onClick={() => navigate('/community/propose')}
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
        <div className={styles.content}>
          {proposalsLoading ? (
            <div className={styles.list}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rect" />
              ))}
            </div>
          ) : proposals && proposals.length > 0 ? (
            <div className={styles.list}>
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <FileText size={32} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No pending proposals</h3>
              <p className={styles.emptyText}>
                Be the first to propose a community market.
              </p>
              {canPropose && (
                <button
                  className={styles.emptyBtn}
                  onClick={() => navigate('/community/propose')}
                >
                  <Plus size={16} />
                  Propose a market
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
