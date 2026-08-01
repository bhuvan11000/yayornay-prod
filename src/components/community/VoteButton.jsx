import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useVote } from '../../hooks/useVote';
import { useAuthStore } from '../../stores/authStore';
import ClickSpark from '../reactbits/ClickSpark/ClickSpark';
import styles from './VoteButton.module.css';

export function VoteButton({ proposal, userVote }) {
  const user = useAuthStore((s) => s.user);
  const voteMutation = useVote();

  const isOwn = user?.id === proposal.proposer_id;
  const deadlinePassed = new Date(proposal.voting_deadline) < new Date();
  const belowLevelReq = (user?.level || 0) < 3;
  const isDisabled = isOwn || proposal.status !== 'pending' || deadlinePassed || voteMutation.isPending || belowLevelReq;

  const handleVote = (v) => {
    if (isDisabled) return;
    voteMutation.mutate({ proposal_id: proposal.id, vote: v });
  };

  const getTitle = () => {
    if (isOwn) return 'Cannot vote on own proposal';
    if (belowLevelReq) return 'Level 3 required to vote';
    if (deadlinePassed) return 'Voting ended';
    return 'Vote';
  };

  return (
    <div className={styles.container}>
      <ClickSpark sparkColor="#22c55e" className="relative inline-flex">
        <button
          className={`${styles.btn} ${styles.upBtn} ${userVote === 'up' ? styles.upActive : ''}`}
          onClick={() => handleVote('up')}
          disabled={isDisabled}
          title={getTitle()}
        >
          <ThumbsUp size={16} />
          <span>{proposal.upvotes || 0}</span>
        </button>
      </ClickSpark>
      <ClickSpark sparkColor="#ef4444" className="relative inline-flex">
        <button
          className={`${styles.btn} ${styles.downBtn} ${userVote === 'down' ? styles.downActive : ''}`}
          onClick={() => handleVote('down')}
          disabled={isDisabled}
          title={getTitle()}
        >
          <ThumbsDown size={16} />
          <span>{proposal.downvotes || 0}</span>
        </button>
      </ClickSpark>
    </div>
  );
}
