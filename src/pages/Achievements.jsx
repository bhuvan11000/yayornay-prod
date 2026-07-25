import { Target, Award } from 'lucide-react';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementCard } from '../components/gamification/AchievementCard';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCoins, formatXP } from '../lib/format';
import styles from './Achievements.module.css';

export default function Achievements() {
  const { data: achievements, isLoading, isError } = useAchievements();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton variant="rect" width="200px" height="32px" />
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <h1 className="text-2xl font-heading">Achievements</h1>
        <p className="text-muted">Failed to load achievements.</p>
      </div>
    );
  }

  const totalAchievements = achievements?.length || 0;
  const unlockedCount = achievements?.filter((a) => a.unlocked).length || 0;
  const totalXp = achievements?.filter((a) => a.unlocked).reduce((s, a) => s + a.xp_reward, 0) || 0;
  const totalCoins = achievements?.filter((a) => a.unlocked).reduce((s, a) => s + a.coin_reward, 0) || 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="text-2xl font-heading">Achievements</h1>
          <p className={styles.subtitle}>
            <Target size={14} />
            {unlockedCount}/{totalAchievements} unlocked
          </p>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <Award size={16} className={styles.statIcon} />
            <span className={styles.statValue}>{formatXP(totalXp)}</span>
            <span className={styles.statLabel}>Total XP</span>
          </div>
          <div className={styles.stat}>
            <Award size={16} className={styles.coinStatIcon} />
            <span className={styles.statValue}>{formatCoins(totalCoins)}</span>
            <span className={styles.statLabel}>Total Coins</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {achievements?.map((ach) => (
          <AchievementCard key={ach.id} achievement={ach} />
        ))}
      </div>
    </div>
  );
}
