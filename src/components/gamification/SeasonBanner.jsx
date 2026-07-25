import { Calendar } from 'lucide-react';
import { useSeasons } from '../../hooks/useSeasons';
import { getRankColor, getRankLabel } from '../../lib/ranks';
import { useAuthStore } from '../../stores/authStore';
import styles from './SeasonBanner.module.css';

export function SeasonBanner() {
  const { data: season, isLoading, isError } = useSeasons();
  const user = useAuthStore((s) => s.user);

  if (isLoading || isError || !season) return null;

  const now = new Date();
  const start = new Date(season.starts_at);
  const end = new Date(season.ends_at);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const pct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const urgency = remainingDays <= 1 ? 'critical' : remainingDays <= 7 ? 'warning' : 'normal';
  const rankColor = user?.rank ? getRankColor(user.rank) : undefined;
  const rankLabel = user?.rank ? getRankLabel(user.rank) : undefined;

  return (
    <div className={`${styles.banner} ${styles[urgency]}`}>
      <div className={styles.left}>
        <Calendar size={14} className={styles.icon} />
        <span className={styles.title}>Season {season.season_number}</span>
        <span className={styles.countdown}>
          {remainingDays > 0
            ? `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
            : 'Final day!'}
        </span>
      </div>
      <div className={styles.right}>
        {rankLabel && (
          <span className={styles.rankPill} style={{ background: rankColor }}>
            {rankLabel}
          </span>
        )}
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${styles[urgency]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
