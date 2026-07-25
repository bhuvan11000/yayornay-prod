import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useVote } from '../../hooks/useVote';
import { useAuthStore } from '../../stores/authStore';
import styles from './VoteButton.module.css';

export function VoteButton({ proposal, userVote }) {
  const user = useAuthStore((s) => s.user);
  const voteMutation = useVote();

  const isOwn = user?.id === proposal.proposer_id;
  const deadlinePassed = new Date(proposal.voting_deadline) < new Date();
  const isDisabled = isOwn || proposal.status !== 'pending' || deadlinePassed || voteMutation.isPending;

  const handleVote = (v) => {
    if (isDisabled) return;
    voteMutation.mutate({ proposal_id: proposal.id, vote: v });
  };

  return (
    <div className={styles.container}>
      <button
        className={`${styles.btn} ${styles.upBtn} ${userVote === 'up' ? styles.upActive : ''}`}
        onClick={() => handleVote('up')}
        disabled={isDisabled}
        title={isOwn ? 'Cannot vote on own proposal' : deadlinePassed ? 'Voting ended' : 'Upvote'}
      >
        <ThumbsUp size={16} />
        <span>{proposal.upvotes || 0}</span>
      </button>
      <button
        className={`${styles.btn} ${styles.downBtn} ${userVote === 'down' ? styles.downActive : ''}`}
        onClick={() => handleVote('down')}
        disabled={isDisabled}
        title={isOwn ? 'Cannot vote on own proposal' : deadlinePassed ? 'Voting ended' : 'Downvote'}
      >
        <ThumbsDown size={16} />
        <span>{proposal.downvotes || 0}</span>
      </button>
    </div>
  );
}
