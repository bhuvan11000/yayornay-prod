import { Gift, Lock, CheckCircle, Sun, Coins, Zap } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getRankColor, getRankLabel } from '../../lib/ranks';
import { formatTimeRemaining, formatCoins } from '../../lib/format';
import styles from './DailyRewardClaim.module.css';

export function DailyRewardClaim({ onClaim, claiming }) {
  const user = useAuthStore((s) => s.user);
  const rewardStatus = useAuthStore((s) => s.rewardStatus);

  if (!rewardStatus) return null;

  const { can_claim, is_active, rank, coins, xp, is_sunday, last_claim } = rewardStatus;
  const rankColor = getRankColor(rank);
  const rankLabel = getRankLabel(rank);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const alreadyClaimed = Boolean(last_claim) && last_claim === todayStr;

  const computeNextReset = () => {
    if (!last_claim) return null;
    const next = new Date(last_claim);
    next.setDate(next.getDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
    return next.toISOString();
  };

  if (!is_active) {
    return (
      <div className={`${styles.banner} ${styles.locked}`}>
        <div className={styles.iconWrapper}>
          <Lock size={24} />
        </div>
        <div className={styles.body}>
          <span className={styles.header}>Daily Rewards Locked</span>
          <p className={styles.message}>
            Place a prediction to reactivate daily rewards
          </p>
        </div>
      </div>
    );
  }

  if (alreadyClaimed || (!can_claim && is_active)) {
    const nextReset = computeNextReset();
    return (
      <div className={`${styles.banner} ${styles.claimed}`}>
        <div className={`${styles.iconWrapper} ${styles.claimedIcon}`}>
          <CheckCircle size={24} />
        </div>
        <div className={styles.body}>
          <span className={styles.header}>Daily Reward Claimed</span>
          <div className={styles.rewardPreview}>
            <span className={styles.rankBadge} style={{ background: rankColor }}>
              {rankLabel}
            </span>
            <span className={styles.rewardAmounts}>
              +{formatCoins(coins)} coins, +{xp} XP
              {is_sunday && <span className={styles.sundayBadge}>3x Sunday</span>}
            </span>
          </div>
          {nextReset && (
            <p className={styles.resetTimer}>
              Next reward in {formatTimeRemaining(nextReset)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.claimable}`}>
      <div className={styles.claimGlow} />
      <div className={styles.iconWrapper}>
        <Gift size={24} />
      </div>
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <span className={styles.header}>Daily Reward Available</span>
          {is_sunday && (
            <span className={styles.sundayBadge}>
              <Sun size={12} />
              3x Sunday Bonus
            </span>
          )}
        </div>
        <div className={styles.rewardPreview}>
          <span className={styles.rankBadge} style={{ background: rankColor }}>
            {rankLabel}
          </span>
          <span className={styles.coinAmount}>+{formatCoins(coins)}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.xpAmount}>+{xp} XP</span>
        </div>
        <button
          className={styles.claimButton}
          onClick={onClaim}
          disabled={claiming}
        >
          {claiming ? 'Claiming...' : 'Claim Daily Reward'}
        </button>
      </div>
      <div className={styles.sparkleContainer}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={styles.sparkle} style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>
    </div>
  );
}
