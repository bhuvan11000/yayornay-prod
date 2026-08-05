import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useVote } from '../../hooks/useVote';
import { useAuthStore } from '../../stores/authStore';
import ClickSpark from '../reactbits/ClickSpark/ClickSpark';
import CountUp from '../reactbits/CountUp/CountUp';

const btnBase =
  'flex items-center gap-1 rounded-[var(--radius-sm)] border border-transparent px-3 py-2 font-mono text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40';

const upBtn =
  'bg-[rgba(34,197,94,0.1)] text-[var(--color-yes)] border-[rgba(34,197,94,0.2)] enabled:hover:bg-[rgba(34,197,94,0.2)] enabled:hover:border-[var(--color-yes)]';

const upActive =
  'border-[var(--color-yes)] bg-[rgba(34,197,94,0.25)] shadow-[0_0_8px_rgba(34,197,94,0.2)]';

const downBtn =
  'bg-[rgba(239,68,68,0.1)] text-[var(--color-no)] border-[rgba(239,68,68,0.2)] enabled:hover:bg-[rgba(239,68,68,0.2)] enabled:hover:border-[var(--color-no)]';

const downActive =
  'border-[var(--color-no)] bg-[rgba(239,68,68,0.25)] shadow-[0_0_8px_rgba(239,68,68,0.2)]';

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
    <div className="flex gap-2">
      <ClickSpark sparkColor="#22c55e" className="relative inline-flex">
        <button
          className={`${btnBase} ${upBtn} ${userVote === 'up' ? upActive : ''}`}
          onClick={() => handleVote('up')}
          disabled={isDisabled}
          title={getTitle()}
        >
          <ThumbsUp size={16} />
          <CountUp key={proposal.upvotes || 0} to={proposal.upvotes || 0} from={0} duration={0.6} />
        </button>
      </ClickSpark>
      <ClickSpark sparkColor="#ef4444" className="relative inline-flex">
        <button
          className={`${btnBase} ${downBtn} ${userVote === 'down' ? downActive : ''}`}
          onClick={() => handleVote('down')}
          disabled={isDisabled}
          title={getTitle()}
        >
          <ThumbsDown size={16} />
          <CountUp key={proposal.downvotes || 0} to={proposal.downvotes || 0} from={0} duration={0.6} />
        </button>
      </ClickSpark>
    </div>
  );
}
