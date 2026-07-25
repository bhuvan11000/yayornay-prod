import { Flame } from 'lucide-react';
import styles from './StreakCounter.module.css';

/**
 * StreakCounter — Displays a player's betting streak with color intensity.
 *
 * @param {object} props
 * @param {number} props.streak - Current betting streak
 * @param {number} [props.longest] - Longest betting streak
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export function StreakCounter({ streak = 0, longest, size = 'md' }) {
  const tier = getStreakTier(streak);
  const showLabel = size === 'lg';

  return (
    <div className={`${styles.counter} ${styles[size]} ${styles[tier]}`} title={`Betting streak: ${streak} day${streak !== 1 ? 's' : ''}${longest != null ? ` — Longest: ${longest}` : ''}`}>
      <div className={styles.flameWrapper}>
        <Flame size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18} className={styles.flame} />
        {tier === 'inferno' && <div className={styles.flameGlow} />}
      </div>
      <span className={styles.number}>{streak}</span>
      {showLabel && (
        <div className={styles.labelGroup}>
          <span className={styles.label}>Day Streak</span>
          {longest != null && (
            <span className={styles.longest}>Longest: {longest}</span>
          )}
        </div>
      )}
    </div>
  );
}

function getStreakTier(streak) {
  if (streak === 0) return 'none';
  if (streak <= 2) return 'low';
  if (streak <= 6) return 'medium';
  if (streak <= 14) return 'high';
  return 'inferno';
}
