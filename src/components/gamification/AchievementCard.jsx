import { CheckCircle, Target, Flame, Layers, TrendingDown, Fish, Sunrise, Sigma, Eye, Store, TrendingUp, BadgeCheck, Star, Calendar } from 'lucide-react';
import { formatCoins, formatDate } from '../../lib/format';
import styles from './AchievementCard.module.css';

const iconMap = {
  target: Target,
  flame: Flame,
  layers: Layers,
  'trend-down': TrendingDown,
  'fish-symbol': Fish,
  sunrise: Sunrise,
  sigma: Sigma,
  eye: Eye,
  store: Store,
  'trending-up': TrendingUp,
  'badge-check': BadgeCheck,
  star: Star,
  calendar: Calendar,
};

export function AchievementCard({ achievement }) {
  const { title, description, icon, unlocked, unlocked_at, xp_reward, coin_reward, progress } = achievement;
  const IconComponent = iconMap[icon] || Target;

  return (
    <div className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked}`}>
      <div className={styles.iconWrapper}>
        <IconComponent size={32} className={styles.icon} />
        {unlocked && (
          <div className={styles.checkmark}>
            <CheckCircle size={20} />
          </div>
        )}
      </div>

      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      <div className={styles.rewards}>
        <span className={styles.xpReward}>+{xp_reward} XP</span>
        <span className={styles.coinReward}>+{formatCoins(coin_reward)} coins</span>
      </div>

      {unlocked && unlocked_at && (
        <p className={styles.unlockDate}>Unlocked {formatDate(unlocked_at)}</p>
      )}

      {!unlocked && progress && (
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
          <span className={styles.progressText}>{progress.current}/{progress.target}</span>
        </div>
      )}
    </div>
  );
}
