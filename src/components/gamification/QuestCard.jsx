import { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { formatCoins, formatTimeRemaining } from '../../lib/format';
import { Progress } from '../ui/progress';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';
import styles from './QuestCard.module.css';

export function QuestCard({ quest, onComplete }) {
  const { title, description, target, xp_reward, coin_reward, progress, completed, reset_at } = quest;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const pct = target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;

  return (
    <SpotlightCard
      spotlightColor="rgba(245, 158, 11, 0.15)"
      className={`${styles.card} ${completed ? styles.completed : ''}`}
    >
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
          {completed && (
            <div className={styles.completedBadge}>
              <CheckCircle size={16} />
              <span>Claimed</span>
            </div>
          )}
        </div>

        <div className={styles.progressSection}>
          <Progress
            value={mounted ? (completed ? 100 : pct) : 0}
            className="h-2 bg-[var(--bg-tertiary)]"
            data-slot-complete={completed ? 'true' : undefined}
          />
          <span className={styles.progressText}>
            {Math.min(progress, target)}/{target}
          </span>
        </div>

        <div className={styles.footer}>
          <div className={styles.rewards}>
            <span className={styles.xpReward}>+{xp_reward} XP</span>
            <span className={styles.coinReward}>+{formatCoins(coin_reward)} coins</span>
          </div>
          {!completed && reset_at && (
            <div className={styles.timeRemaining}>
              <Clock size={12} />
              <span>{formatTimeRemaining(reset_at)}</span>
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}
