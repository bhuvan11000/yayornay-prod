import { Clock, Users } from 'lucide-react';
import { CategoryTag } from '../ui/CategoryTag';
import { RankBadge } from '../gamification/RankBadge';
import { VoteButton } from './VoteButton';
import { formatTimeRemaining, formatCoins } from '../../lib/format';
import { useAuthStore } from '../../stores/authStore';
import styles from './ProposalCard.module.css';

export function ProposalCard({ proposal }) {
  const user = useAuthStore((s) => s.user);
  const deadlinePassed = new Date(proposal.voting_deadline) < new Date();

  const userVote = proposal.user_vote || null;
  const progress = Math.min((proposal.upvotes || 0) / 15, 1);

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <CategoryTag category={proposal.category} />
        {proposal.status === 'pending' && (
          <span className={styles.statusBadge}>Pending</span>
        )}
      </div>

      <h3 className={styles.title}>{proposal.title}</h3>

      <div className={styles.proposer}>
        <span className={styles.proposerLabel}>Proposed by </span>
        <span className={styles.proposerName}>@{proposal.proposer_username}</span>
        <RankBadge rank={proposal.proposer_rank} size="sm" />
        <span className={styles.proposerLevel}>Lvl {proposal.proposer_level}</span>
      </div>

      <p className={styles.description}>
        {proposal.description.length > 150
          ? proposal.description.slice(0, 150) + '...'
          : proposal.description
        }
      </p>

      <div className={styles.criteria}>
        <span className={styles.criteriaLabel}>Resolution:</span>
        <span className={styles.criteriaText}>{proposal.resolution_criteria}</span>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.voteCounts}>
          <span className={styles.upVotes}>▲ {proposal.upvotes || 0}</span>
          <span className={styles.downVotes}>▼ {proposal.downvotes || 0}</span>
          <span className={styles.needed}>
            {Math.max(0, 15 - (proposal.upvotes || 0))} more needed
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.timeInfo}>
          <Clock size={14} />
          <span className={styles.timeText}>
            {deadlinePassed
              ? 'Voting ended'
              : `Voting ends in ${formatTimeRemaining(proposal.voting_deadline)}`
            }
          </span>
        </div>
        <VoteButton proposal={proposal} userVote={userVote} />
      </div>
    </div>
  );
}
