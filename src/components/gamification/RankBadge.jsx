import { getRankColor, getRankLabel, RANK_THRESHOLDS } from '../../lib/ranks';
import styles from './RankBadge.module.css';

export function RankBadge({ rank, size = 'md', showLabel = true }) {
  const color = getRankColor(rank);
  const label = getRankLabel(rank);
  const threshold = RANK_THRESHOLDS.find(r => r.name === rank);
  const isOmniscient = rank === 'Omniscient';

  const sizeMap = { sm: 16, md: 24, lg: 32 };
  const dotSize = sizeMap[size] || 24;

  return (
    <span
      className={`${styles.badge} ${styles[size]} ${isOmniscient ? styles.omniscient : ''}`}
      title={`${label}${threshold ? ` — ${threshold.minCoins.toLocaleString()} coins required` : ''}`}
    >
      <span
        className={`${styles.dot} ${isOmniscient ? styles.omniscientDot : ''}`}
        style={{
          width: dotSize,
          height: dotSize,
          background: isOmniscient ? undefined : color,
        }}
      />
      {showLabel && <span className={styles.label}>{label}</span>}
    </span>
  );
}