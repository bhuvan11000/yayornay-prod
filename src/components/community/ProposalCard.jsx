import { Clock, Users } from 'lucide-react';
import { CategoryTag } from '../ui/CategoryTag';
import { RankBadge } from '../gamification/RankBadge';
import { VoteButton } from './VoteButton';
import { formatTimeRemaining, formatCoins } from '../../lib/format';
import { useAuthStore } from '../../stores/authStore';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';

export function ProposalCard({ proposal }) {
  const user = useAuthStore((s) => s.user);
  const deadlinePassed = new Date(proposal.voting_deadline) < new Date();

  const userVote = proposal.user_vote || null;
  const progress = Math.min((proposal.upvotes || 0) / 15, 1);

  return (
    <SpotlightCard
      spotlightColor="rgba(168, 85, 247, 0.15)"
      className="!rounded-[var(--radius-sm)] flex flex-col gap-3 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-[border-color,box-shadow] duration-150 hover:border-[var(--bg-tertiary)] hover:shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-center gap-2">
        <CategoryTag category={proposal.category} />
        {proposal.status === 'pending' && (
          <span className="rounded-[3px] bg-[var(--color-warning-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
            Pending
          </span>
        )}
      </div>

      <h3 className="font-heading text-lg font-semibold leading-[1.3] text-[var(--text-primary)]">{proposal.title}</h3>

      <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
        <span className="text-[var(--text-muted)]">Proposed by </span>
        <span className="font-semibold text-[var(--accent-amber)]">@{proposal.proposer_username}</span>
        <RankBadge rank={proposal.proposer_rank} size="sm" />
        <span className="font-mono text-[var(--text-muted)]">Lvl {proposal.proposer_level}</span>
      </div>

      <div className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs">
        <span className="font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">Resolution:</span>
        <span className="leading-[1.4] text-[var(--text-secondary)]">{proposal.resolution_criteria}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 font-mono text-sm">
          <span className="font-semibold text-[var(--color-yes)]">▲ {proposal.upvotes || 0}</span>
          <span className="font-semibold text-[var(--color-no)]">▼ {proposal.downvotes || 0}</span>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {Math.max(0, 15 - (proposal.upvotes || 0))} more needed
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-[3px] bg-[var(--bg-tertiary)]">
          <div
            className="h-full rounded-[3px] bg-[var(--color-yes)] transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Clock size={14} />
          <span className="font-mono text-xs">
            {deadlinePassed
              ? 'Voting ended'
              : `Voting ends in ${formatTimeRemaining(proposal.voting_deadline)}`
            }
          </span>
        </div>
        <VoteButton proposal={proposal} userVote={userVote} />
      </div>
    </SpotlightCard>
  );
}
