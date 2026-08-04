import { Target, Award } from 'lucide-react';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementCard } from '../components/gamification/AchievementCard';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCoins, formatXP } from '../lib/format';

export default function Achievements() {
  const { data: achievements, isLoading, isError } = useAchievements();

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <Skeleton variant="rect" width="200px" height="32px" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
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
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:flex-wrap">
        <div>
          <h1 className="text-2xl font-heading">Achievements</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <Target size={14} />
            {unlockedCount}/{totalAchievements} unlocked
          </p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <div className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 md:flex-none">
            <Award size={16} className="text-[var(--rank-visionary)]" />
            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatXP(totalXp)}</span>
            <span className="text-xs text-[var(--text-muted)]">Total XP</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 md:flex-none">
            <Award size={16} className="text-[var(--color-warning)]" />
            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatCoins(totalCoins)}</span>
            <span className="text-xs text-[var(--text-muted)]">Total Coins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {achievements?.map((ach) => (
          <AchievementCard key={ach.id} achievement={ach} />
        ))}
      </div>
    </div>
  );
}
